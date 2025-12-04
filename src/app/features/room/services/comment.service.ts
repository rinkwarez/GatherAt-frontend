import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { FirestoreService } from '../../../shared/services/firestore.service';
import { Comment, CreateCommentData } from '../../../models/comment.model';
import { orderBy, addDoc, collection } from 'firebase/firestore';

/**
 * Service for managing comments on voting options
 */
@Injectable({
  providedIn: 'root',
})
export class CommentService {
  constructor(private firestoreService: FirestoreService) {}

  /**
   * Add a comment to an option
   */
  async addComment(roomId: string, commentData: CreateCommentData): Promise<string> {
    const commentDoc = {
      ...commentData,
      createdAt: new Date(),
    };

    const collectionRef = collection(
      this.firestoreService.getFirestore(),
      `rooms/${roomId}/options/${commentData.optionId}/comments`
    );

    const docRef = await addDoc(collectionRef, commentDoc);
    return docRef.id;
  }

  /**
   * Get all comments for an option with real-time updates
   */
  getComments(roomId: string, optionId: string): Observable<Comment[]> {
    const path = `rooms/${roomId}/options/${optionId}/comments`;
    return this.firestoreService.onCollectionSnapshot<Comment>(path, orderBy('createdAt', 'asc'));
  }

  /**
   * Delete a comment
   */
  async deleteComment(roomId: string, optionId: string, commentId: string): Promise<void> {
    const path = `rooms/${roomId}/options/${optionId}/comments`;
    return this.firestoreService.deleteDocument(path, commentId);
  }
}
