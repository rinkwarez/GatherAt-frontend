import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { FirestoreService } from '../../../core/services/firestore.service';
import { Option, OptionWithPercentage } from '../../../models/option.model';
import { orderBy } from 'firebase/firestore';

@Injectable({
  providedIn: 'root',
})
export class OptionService {
  private readonly ROOMS_COLLECTION = 'rooms';
  private readonly OPTIONS_SUBCOLLECTION = 'options';

  constructor(private firestoreService: FirestoreService) {}

  /**
   * Get options for a room with real-time updates
   * Sorted by voteCount descending, then order ascending
   * Returns options with percentage and winner flag
   */
  getOptions(roomId: string): Observable<OptionWithPercentage[]> {
    const optionsPath = `${this.ROOMS_COLLECTION}/${roomId}/${this.OPTIONS_SUBCOLLECTION}`;
    console.log('OptionService: Getting options from path:', optionsPath);

    return this.firestoreService
      .onCollectionSnapshot<Option>(optionsPath, orderBy('order', 'asc'))
      .pipe(
        map((options) => {
          console.log('OptionService: Raw options from Firestore:', options);
          // Calculate total votes
          const totalVotes = options.reduce((sum, opt) => sum + opt.voteCount, 0);

          // Find max vote count for winner determination
          const maxVotes = Math.max(...options.map((opt) => opt.voteCount), 0);

          // Add percentage and winner flag to each option
          const optionsWithPercentage = options.map((option) => ({
            ...option,
            percentage: totalVotes > 0 ? (option.voteCount / totalVotes) * 100 : 0,
            isWinner: option.voteCount > 0 && option.voteCount === maxVotes,
          }));

          // Sort by voteCount descending, then by order ascending
          return optionsWithPercentage.sort((a, b) => {
            if (b.voteCount !== a.voteCount) {
              return b.voteCount - a.voteCount;
            }
            return a.order - b.order;
          });
        })
      );
  }

  /**
   * Add a new option to a room
   */
  async addOption(roomId: string, label: string): Promise<void> {
    const optionsPath = `${this.ROOMS_COLLECTION}/${roomId}/${this.OPTIONS_SUBCOLLECTION}`;

    // Get current options to determine the next order value
    const existingOptions = await this.firestoreService.getDocuments<Option>(optionsPath);
    const nextOrder = existingOptions.length;

    // Create new option
    const optionData = {
      label,
      voteCount: 0,
      createdAt: this.firestoreService.getTimestamp(),
      order: nextOrder,
    };

    // Generate a new document reference and use its ID
    const collectionRef = this.firestoreService.getCollectionRef(
      this.ROOMS_COLLECTION,
      roomId,
      this.OPTIONS_SUBCOLLECTION
    );

    // Import doc function to create a reference with auto-generated ID
    const { doc } = await import('firebase/firestore');
    const db = this.firestoreService.getFirestore();
    const optionRef = doc(collectionRef);

    await this.firestoreService.setDocument(
      optionData,
      this.ROOMS_COLLECTION,
      roomId,
      this.OPTIONS_SUBCOLLECTION,
      optionRef.id
    );
  }
}
