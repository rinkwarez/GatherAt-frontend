import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { FirestoreService } from '../../../shared/services/firestore.service';
import { Vote } from '../../../models/vote.model';
import { Room, RoomStatus, PollType } from '../../../models/room.model';
import { runTransaction, doc, getDoc } from 'firebase/firestore';

@Injectable({
  providedIn: 'root',
})
export class VoteService {
  private readonly ROOMS_COLLECTION = 'rooms';
  private readonly OPTIONS_SUBCOLLECTION = 'options';
  private readonly VOTES_SUBCOLLECTION = 'votes';

  constructor(private firestoreService: FirestoreService) {}

  /**
   * Vote for an option using a Firestore transaction
   * Handles both Single Select (SS) and Multiple Select (MS) modes
   */
  async vote(
    roomId: string,
    optionId: string,
    userId: string,
    displayName: string,
    pollType: PollType = PollType.SS
  ): Promise<void> {
    const db = this.firestoreService.getFirestore();

    try {
      await runTransaction(db, async (transaction) => {
        // ===== PHASE 1: ALL READS FIRST =====

        // Check room status first
        const roomRef = doc(db, this.ROOMS_COLLECTION, roomId);
        const roomDoc = await transaction.get(roomRef);

        if (roomDoc.exists()) {
          const roomData = roomDoc.data() as Room;
          if (roomData.status === RoomStatus.Ended) {
            throw new Error('Voting has ended for this room');
          }
        }

        // Path to user's vote document (userId is the document ID)
        const votePath = `${this.ROOMS_COLLECTION}/${roomId}/${this.VOTES_SUBCOLLECTION}`;
        const voteDocRef = doc(db, votePath, userId);

        // Get current vote
        const voteDoc = await transaction.get(voteDocRef);
        let currentVote = voteDoc.exists() ? (voteDoc.data() as any) : null;

        // Migrate old vote format to new format
        if (currentVote && currentVote.optionId && !currentVote.optionIds) {
          currentVote = {
            optionIds: [currentVote.optionId],
            displayName: currentVote.displayName,
            votedAt: currentVote.votedAt,
          };
        }

        const currentOptionIds = currentVote?.optionIds || [];
        console.log('Current votes:', currentOptionIds);
        console.log('Toggling optionId:', optionId);

        // Read all options we might need to update
        const optionPath = `${this.ROOMS_COLLECTION}/${roomId}/${this.OPTIONS_SUBCOLLECTION}`;

        // Always read the option being toggled
        const toggledOptionRef = doc(db, optionPath, optionId);
        const toggledOptionDoc = await transaction.get(toggledOptionRef);

        if (!toggledOptionDoc.exists()) {
          throw new Error('Option does not exist');
        }

        // For SS mode, read the old option if changing votes
        let oldOptionRefs: any[] = [];
        if (
          pollType === PollType.SS &&
          currentOptionIds.length > 0 &&
          !currentOptionIds.includes(optionId)
        ) {
          for (const oldOptionId of currentOptionIds) {
            const oldOptionRef = doc(db, optionPath, oldOptionId);
            const oldOptionDoc = await transaction.get(oldOptionRef);
            oldOptionRefs.push({ ref: oldOptionRef, doc: oldOptionDoc, id: oldOptionId });
          }
        }

        // ===== PHASE 2: ALL WRITES AFTER READS =====

        let newOptionIds: string[] = [];

        if (pollType === PollType.SS) {
          // Single Select Mode
          if (currentOptionIds.includes(optionId)) {
            // Clicking same option - unvote
            newOptionIds = [];
            const optionData = toggledOptionDoc.data();
            const newVoteCount = Math.max(0, (optionData['voteCount'] || 0) - 1);
            transaction.update(toggledOptionRef, { voteCount: newVoteCount });
          } else {
            // Changing to new option
            newOptionIds = [optionId];

            // Decrement old options
            for (const oldOption of oldOptionRefs) {
              if (oldOption.doc.exists()) {
                const oldVoteCount = Math.max(0, (oldOption.doc.data()['voteCount'] || 0) - 1);
                transaction.update(oldOption.ref, { voteCount: oldVoteCount });
              }
            }

            // Increment new option
            const newVoteCount = (toggledOptionDoc.data()['voteCount'] || 0) + 1;
            transaction.update(toggledOptionRef, { voteCount: newVoteCount });
          }
        } else {
          // Multiple Select Mode
          if (currentOptionIds.includes(optionId)) {
            // Remove from selection
            newOptionIds = currentOptionIds.filter((id: string) => id !== optionId);
            const optionData = toggledOptionDoc.data();
            const newVoteCount = Math.max(0, (optionData['voteCount'] || 0) - 1);
            transaction.update(toggledOptionRef, { voteCount: newVoteCount });
          } else {
            // Add to selection
            newOptionIds = [...currentOptionIds, optionId];
            const newVoteCount = (toggledOptionDoc.data()['voteCount'] || 0) + 1;
            transaction.update(toggledOptionRef, { voteCount: newVoteCount });
          }
        }

        // Update/delete vote document
        if (newOptionIds.length === 0) {
          // No votes - delete document
          transaction.delete(voteDocRef);
        } else {
          // Has votes - update/create document
          const voteData: Vote = {
            optionIds: newOptionIds,
            displayName,
            votedAt: this.firestoreService.getTimestamp(),
          };

          if (currentVote) {
            transaction.update(voteDocRef, voteData as any);
          } else {
            transaction.set(voteDocRef, voteData);
          }
        }

        console.log('Vote transaction completed successfully');
      });
    } catch (error) {
      console.error('Error voting:', error);
      throw error;
    }
  }

  /**
   * Get user's current votes for a room with real-time updates
   * Returns array of optionIds they voted for, or empty array if they haven't voted
   */
  /**
   * Get user's current votes for a room with real-time updates
   * Returns array of optionIds they voted for, or empty array if they haven't voted
   */
  getUserVote(roomId: string, userId: string): Observable<string[]> {
    const votePath = `${this.ROOMS_COLLECTION}/${roomId}/${this.VOTES_SUBCOLLECTION}`;

    return this.firestoreService.onDocumentSnapshot<any>(votePath, userId).pipe(
      map((vote) => {
        if (!vote) return [];

        // Migrate old format to new format
        if (vote.optionId && !vote.optionIds) {
          return [vote.optionId];
        }

        console.log('User votes snapshot:', vote.optionIds || []);
        return vote.optionIds || [];
      })
    );
  }

  /**
   * Get all votes for a room with real-time updates
   * Useful for displaying who voted for what
   */
  getAllVotes(roomId: string): Observable<Vote[]> {
    const votesPath = `${this.ROOMS_COLLECTION}/${roomId}/${this.VOTES_SUBCOLLECTION}`;

    return this.firestoreService.onCollectionSnapshot<Vote>(votesPath);
  }

  /**
   * Remove a user's vote when they leave the room
   * Finds vote by displayName and removes it, decrementing the option count
   */
  async removeUserVote(roomId: string, userId: string): Promise<void> {
    const db = this.firestoreService.getFirestore();

    try {
      // Check room status before attempting to remove vote
      const roomRef = doc(db, this.ROOMS_COLLECTION, roomId);
      const roomDoc = await getDoc(roomRef);

      if (roomDoc.exists()) {
        const roomData = roomDoc.data() as Room;
        if (roomData.status === RoomStatus.Ended) {
          console.log('Cannot remove vote - voting has ended');
          return;
        }
      }

      await runTransaction(db, async (transaction) => {
        // Path to user's vote document
        const votePath = `${this.ROOMS_COLLECTION}/${roomId}/${this.VOTES_SUBCOLLECTION}`;
        const voteDocRef = doc(db, votePath, userId);

        // Get current vote
        const voteDoc = await transaction.get(voteDocRef);

        if (!voteDoc.exists()) {
          console.log('No vote to remove for user:', userId);
          return;
        }

        let currentVote = voteDoc.data() as any;

        // Migrate old format to new format
        if (currentVote.optionId && !currentVote.optionIds) {
          currentVote.optionIds = [currentVote.optionId];
        }

        console.log('Removing votes:', currentVote.optionIds);

        // Decrement all voted options' counts
        const optionPath = `${this.ROOMS_COLLECTION}/${roomId}/${this.OPTIONS_SUBCOLLECTION}`;

        for (const optionId of currentVote.optionIds || []) {
          const optionRef = doc(db, optionPath, optionId);
          const optionDoc = await transaction.get(optionRef);

          if (optionDoc.exists()) {
            const optionData = optionDoc.data();
            const newVoteCount = Math.max(0, (optionData['voteCount'] || 0) - 1);
            console.log(
              `Decrementing option ${optionId} from ${optionData['voteCount']} to ${newVoteCount}`
            );
            transaction.update(optionRef, { voteCount: newVoteCount });
          }
        }

        // Delete the vote document
        transaction.delete(voteDocRef);
        console.log('Vote removed successfully');
      });
    } catch (error) {
      console.error('Error removing vote:', error);
      throw error;
    }
  }
}
