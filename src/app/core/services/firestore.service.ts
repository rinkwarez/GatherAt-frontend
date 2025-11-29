import { Injectable } from '@angular/core';
import { initializeApp, FirebaseApp } from 'firebase/app';
import {
  getFirestore,
  Firestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  getDocs,
  onSnapshot,
  QueryConstraint,
  DocumentData,
  DocumentReference,
  CollectionReference,
  Timestamp,
} from 'firebase/firestore';
import { environment } from '../../../environments/enivronment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class FirestoreService {
  private app: FirebaseApp;
  private db: Firestore;

  constructor() {
    this.app = initializeApp(environment.firebase);
    this.db = getFirestore(this.app);
  }

  /**
   * Get Firestore instance
   */
  getFirestore(): Firestore {
    return this.db;
  }

  /**
   * Get a document reference
   */
  getDocRef(path: string, ...pathSegments: string[]): DocumentReference<DocumentData> {
    return doc(this.db, path, ...pathSegments);
  }

  /**
   * Get a collection reference
   */
  getCollectionRef(path: string, ...pathSegments: string[]): CollectionReference<DocumentData> {
    return collection(this.db, path, ...pathSegments);
  }

  /**
   * Get a single document
   */
  async getDocument<T>(path: string, ...pathSegments: string[]): Promise<T | null> {
    const docRef = this.getDocRef(path, ...pathSegments);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as T;
    }
    return null;
  }

  /**
   * Set a document (create or overwrite)
   */
  async setDocument(data: DocumentData, path: string, ...pathSegments: string[]): Promise<void> {
    const docRef = this.getDocRef(path, ...pathSegments);
    await setDoc(docRef, data);
  }

  /**
   * Update a document
   */
  async updateDocument(data: DocumentData, path: string, ...pathSegments: string[]): Promise<void> {
    const docRef = this.getDocRef(path, ...pathSegments);
    await updateDoc(docRef, data);
  }

  /**
   * Delete a document
   */
  async deleteDocument(path: string, ...pathSegments: string[]): Promise<void> {
    const docRef = this.getDocRef(path, ...pathSegments);
    await deleteDoc(docRef);
  }

  /**
   * Get documents from a collection with query constraints
   */
  async getDocuments<T>(path: string, ...queryConstraints: QueryConstraint[]): Promise<T[]> {
    const collectionRef = collection(this.db, path);
    const q = query(collectionRef, ...queryConstraints);
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as T[];
  }

  /**
   * Real-time listener for a single document
   */
  onDocumentSnapshot<T>(path: string, ...pathSegments: string[]): Observable<T | null> {
    return new Observable((observer) => {
      const docRef = this.getDocRef(path, ...pathSegments);

      const unsubscribe = onSnapshot(
        docRef,
        (docSnap) => {
          if (docSnap.exists()) {
            observer.next({ id: docSnap.id, ...docSnap.data() } as T);
          } else {
            observer.next(null);
          }
        },
        (error) => observer.error(error)
      );

      return () => unsubscribe();
    });
  }

  /**
   * Real-time listener for a collection with query constraints
   */
  onCollectionSnapshot<T>(path: string, ...queryConstraints: QueryConstraint[]): Observable<T[]> {
    return new Observable((observer) => {
      const collectionRef = collection(this.db, path);
      const q = query(collectionRef, ...queryConstraints);

      const unsubscribe = onSnapshot(
        q,
        (querySnapshot) => {
          const docs = querySnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as T[];
          observer.next(docs);
        },
        (error) => observer.error(error)
      );

      return () => unsubscribe();
    });
  }

  /**
   * Get current server timestamp
   */
  getTimestamp(): Timestamp {
    return Timestamp.now();
  }

  /**
   * Check if a document exists
   */
  async documentExists(path: string, ...pathSegments: string[]): Promise<boolean> {
    const docRef = this.getDocRef(path, ...pathSegments);
    const docSnap = await getDoc(docRef);
    return docSnap.exists();
  }
}
