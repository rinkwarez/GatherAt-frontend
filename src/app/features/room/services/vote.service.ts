import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { FirestoreService } from '../../../shared/services/firestore.service';
import { Vote } from '../../../models/vote.model';
import { Room, RoomStatus } from '../../../models/room.model';
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
   * Handles vote changes by decrementing old option and incrementing new option
   */
  async vote(roomId: string, optionId: string, userId: string, displayName: string): Promise<void> {
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
        const currentVote = voteDoc.exists() ? (voteDoc.data() as Vote) : null;

        console.log('Current vote:', currentVote);
        console.log('New vote optionId:', optionId);

        // Read all options we might need to update
        const optionPath = `${this.ROOMS_COLLECTION}/${roomId}/${this.OPTIONS_SUBCOLLECTION}`;

        // Always read the new option we're voting for
        const newOptionRef = doc(db, optionPath, optionId);
        const newOptionDoc = await transaction.get(newOptionRef);

        if (!newOptionDoc.exists()) {
          throw new Error('Option does not exist');
        }

        // If changing vote, read the old option too
        let oldOptionDoc = null;
        let oldOptionRef = null;
        if (currentVote && currentVote.optionId !== optionId) {
          oldOptionRef = doc(db, optionPath, currentVote.optionId);
          oldOptionDoc = await transaction.get(oldOptionRef);
        }

        // ===== PHASE 2: ALL WRITES AFTER READS =====

        // If user is voting for the same option, unvote
        if (currentVote && currentVote.optionId === optionId) {
          console.log('User clicked same option - removing vote');

          const optionData = newOptionDoc.data();
          const newVoteCount = Math.max(0, (optionData['voteCount'] || 0) - 1);
          console.log(
            `Decrementing option ${optionId} from ${optionData['voteCount']} to ${newVoteCount}`
          );
          transaction.update(newOptionRef, { voteCount: newVoteCount });
          transaction.delete(voteDocRef);
          return;
        }

        // If user had a previous vote, decrement that option's count
        if (currentVote && oldOptionDoc && oldOptionRef) {
          const oldOptionData = oldOptionDoc.data();
          if (oldOptionData) {
            const oldVoteCount = Math.max(0, (oldOptionData['voteCount'] || 0) - 1);
            console.log(
              `Decrementing option ${currentVote.optionId} from ${oldOptionData['voteCount']} to ${oldVoteCount}`
            );
            transaction.update(oldOptionRef, { voteCount: oldVoteCount });
          }
        }

        // Increment new option's count
        const newOptionData = newOptionDoc.data();
        const newVoteCount = (newOptionData['voteCount'] || 0) + 1;
        console.log(
          `Incrementing option ${optionId} from ${newOptionData['voteCount']} to ${newVoteCount}`
        );
        transaction.update(newOptionRef, { voteCount: newVoteCount });

        // Update/create vote document
        const voteData: Vote = {
          optionId,
          displayName,
          votedAt: this.firestoreService.getTimestamp(),
        };

        if (currentVote) {
          transaction.update(voteDocRef, voteData as any);
        } else {
          transaction.set(voteDocRef, voteData);
        }

        console.log('Vote transaction completed successfully');
      });
    } catch (error) {
      console.error('Error voting:', error);
      throw error;
    }
  }

  /**
   * Get user's current vote for a room with real-time updates
   * Returns the optionId they voted for, or null if they haven't voted
   */
  getUserVote(roomId: string, userId: string): Observable<string | null> {
    const votePath = `${this.ROOMS_COLLECTION}/${roomId}/${this.VOTES_SUBCOLLECTION}`;

    return this.firestoreService.onDocumentSnapshot<Vote>(votePath, userId).pipe(
      map((vote) => {
        console.log('User vote snapshot:', vote);
        return vote ? vote.optionId : null;
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

        const currentVote = voteDoc.data() as Vote;
        console.log('Removing vote:', currentVote);

        // Decrement the option's count
        const optionPath = `${this.ROOMS_COLLECTION}/${roomId}/${this.OPTIONS_SUBCOLLECTION}`;
        const optionRef = doc(db, optionPath, currentVote.optionId);
        const optionDoc = await transaction.get(optionRef);

        if (optionDoc.exists()) {
          const optionData = optionDoc.data();
          const newVoteCount = Math.max(0, (optionData['voteCount'] || 0) - 1);
          console.log(
            `Decrementing option ${currentVote.optionId} from ${optionData['voteCount']} to ${newVoteCount}`
          );
          transaction.update(optionRef, { voteCount: newVoteCount });
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
