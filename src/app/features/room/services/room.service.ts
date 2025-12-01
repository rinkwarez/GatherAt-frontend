import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { FirestoreService } from '../../../shared/services/firestore.service';
import { Room, CreateRoomData, RoomStatus } from '../../../models/room.model';
import { writeBatch, doc } from 'firebase/firestore';

@Injectable({
  providedIn: 'root',
})
export class RoomService {
  private readonly ROOMS_COLLECTION = 'rooms';
  private readonly OPTIONS_SUBCOLLECTION = 'options';

  constructor(private firestoreService: FirestoreService) {}

  /**
   * Create a new room with initial options
   * Returns the generated room ID
   */
  async createRoom(data: CreateRoomData, createdBy: string): Promise<string> {
    const db = this.firestoreService.getFirestore();
    const batch = writeBatch(db);

    // Generate room ID
    const roomRef = doc(this.firestoreService.getCollectionRef(this.ROOMS_COLLECTION));
    const roomId = roomRef.id;

    // Create room document
    const roomData: Omit<Room, 'id'> = {
      question: data.question,
      timezone: data.timezone,
      participants: [],
      createdBy: createdBy,
      status: RoomStatus.InProgress,
      optionType: data.optionType,
      createdAt: this.firestoreService.getTimestamp(),
      updatedAt: this.firestoreService.getTimestamp(),
    };

    batch.set(roomRef, roomData);

    // Create initial options
    data.options.forEach((optionLabel, index) => {
      const optionRef = doc(
        this.firestoreService.getCollectionRef(
          this.ROOMS_COLLECTION,
          roomId,
          this.OPTIONS_SUBCOLLECTION
        )
      );

      batch.set(optionRef, {
        label: optionLabel,
        voteCount: 0,
        createdAt: this.firestoreService.getTimestamp(),
        order: index,
      });
    });

    // Commit batch
    await batch.commit();

    return roomId;
  }

  /**
   * Get a room by ID with real-time updates
   */
  getRoom(roomId: string): Observable<Room | null> {
    return this.firestoreService.onDocumentSnapshot<Room>(this.ROOMS_COLLECTION, roomId);
  }

  /**
   * Check if a room exists
   */
  async roomExists(roomId: string): Promise<boolean> {
    return this.firestoreService.documentExists(this.ROOMS_COLLECTION, roomId);
  }

  /**
   * Add user to room participants
   */
  async joinRoom(roomId: string, displayName: string): Promise<void> {
    const db = this.firestoreService.getFirestore();
    const { doc, updateDoc, arrayUnion, getDoc } = await import('firebase/firestore');

    const roomRef = doc(db, this.ROOMS_COLLECTION, roomId);

    // Check if room voting has ended
    const roomDoc = await getDoc(roomRef);
    if (roomDoc.exists()) {
      const roomData = roomDoc.data() as Room;
      if (roomData.status === RoomStatus.Ended) {
        console.log('Cannot join room - voting has ended');
        return;
      }
    }

    await updateDoc(roomRef, {
      participants: arrayUnion(displayName),
    });

    console.log(`${displayName} joined room ${roomId}`);
  }

  /**
   * Remove user from room participants
   */
  async leaveRoom(roomId: string, displayName: string): Promise<void> {
    const db = this.firestoreService.getFirestore();
    const { doc, updateDoc, arrayRemove, getDoc } = await import('firebase/firestore');

    const roomRef = doc(db, this.ROOMS_COLLECTION, roomId);

    // Check if room voting has ended
    const roomDoc = await getDoc(roomRef);
    if (roomDoc.exists()) {
      const roomData = roomDoc.data() as Room;
      if (roomData.status === RoomStatus.Ended) {
        console.log('Cannot leave room - voting has ended');
        return;
      }
    }

    await updateDoc(roomRef, {
      participants: arrayRemove(displayName),
    });

    console.log(`${displayName} left room ${roomId}`);
  }

  /**
   * Update room status (only creator can do this)
   */
  async updateRoomStatus(roomId: string, status: RoomStatus): Promise<void> {
    const db = this.firestoreService.getFirestore();
    const { doc, updateDoc } = await import('firebase/firestore');

    const roomRef = doc(db, this.ROOMS_COLLECTION, roomId);
    await updateDoc(roomRef, {
      status: status,
      updatedAt: this.firestoreService.getTimestamp(),
    });

    console.log(`Room ${roomId} status updated to ${status}`);
  }

  /**
   * Delete room and all its subcollections (only creator can do this after voting ends)
   */
  async deleteRoom(roomId: string): Promise<void> {
    const db = this.firestoreService.getFirestore();
    const { doc, deleteDoc, collection, getDocs } = await import('firebase/firestore');

    // Delete all options
    const optionsRef = collection(db, this.ROOMS_COLLECTION, roomId, this.OPTIONS_SUBCOLLECTION);
    const optionsSnapshot = await getDocs(optionsRef);
    const deletePromises: Promise<void>[] = [];

    optionsSnapshot.forEach((optionDoc) => {
      deletePromises.push(deleteDoc(optionDoc.ref));
    });

    // Delete all votes
    const votesRef = collection(db, this.ROOMS_COLLECTION, roomId, 'votes');
    const votesSnapshot = await getDocs(votesRef);

    votesSnapshot.forEach((voteDoc) => {
      deletePromises.push(deleteDoc(voteDoc.ref));
    });

    // Wait for all subcollection deletes to complete
    await Promise.all(deletePromises);

    // Finally delete the room document
    const roomRef = doc(db, this.ROOMS_COLLECTION, roomId);
    await deleteDoc(roomRef);

    console.log(`Room ${roomId} deleted successfully`);
  }
}
