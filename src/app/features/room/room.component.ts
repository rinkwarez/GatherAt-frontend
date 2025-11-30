import { Component, OnInit, OnDestroy, signal, AfterViewInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { RoomService } from './services/room.service';
import { OptionService } from './services/option.service';
import { VoteService } from './services/vote.service';
import { RoomAnimationsService } from './services/room-animations.service';
import { UserSessionService } from '../../core/services/user-session.service';
import { Room, RoomStatus } from '../../models/room.model';
import { OptionWithPercentage } from '../../models/option.model';
import { Vote } from '../../models/vote.model';
import { RoomHeaderComponent } from './components/room-header/room-header.component';
import { OptionCardComponent } from './components/option-card/option-card.component';
import { VoterNamePromptComponent } from './components/voter-name-prompt/voter-name-prompt.component';
import { AddOptionFormComponent } from './components/add-option-form/add-option-form.component';

@Component({
  selector: 'app-room',
  standalone: true,
  imports: [
    CommonModule,
    RoomHeaderComponent,
    OptionCardComponent,
    VoterNamePromptComponent,
    AddOptionFormComponent,
  ],
  templateUrl: './room.component.html',
  styleUrl: './room.component.css',
})
export class RoomComponent implements OnInit, OnDestroy, AfterViewInit {
  roomId = signal<string>('');
  room = signal<Room | null>(null);
  options = signal<OptionWithPercentage[]>([]);
  votes = signal<Vote[]>([]);
  isLoading = signal(true);
  error = signal<string>('');
  showNamePrompt = signal(false);
  userVote = signal<string | null>(null); // The optionId the user voted for
  isVoting = signal(false);
  isCreator = signal(false); // Whether current user is the room creator
  participantsExpanded = signal(false); // For mobile accordion

  // Expose enum to template
  readonly RoomStatus = RoomStatus;
  private roomSubscription?: Subscription;
  private optionsSubscription?: Subscription;
  private voteSubscription?: Subscription;
  private votesSubscription?: Subscription;
  private animationsTriggered = false;
  private previousOptionIds = new Set<string>();

  constructor(
    private route: ActivatedRoute,
    private roomService: RoomService,
    private optionService: OptionService,
    private voteService: VoteService,
    private animationsService: RoomAnimationsService,
    private userSessionService: UserSessionService
  ) {}

  ngOnInit(): void {
    // Get room ID from route params
    const id = this.route.snapshot.paramMap.get('roomId');

    if (!id) {
      this.error.set('No room ID provided');
      this.isLoading.set(false);
      return;
    }

    this.roomId.set(id);
    this.setupRoomListener();
    this.setupOptionsListener();
    this.setupVoteListener();
    this.setupVotesListener();

    // Check if user needs to enter their name
    if (this.userSessionService.isNewUser()) {
      this.showNamePrompt.set(true);
    } else {
      // User already has a name, join the room
      const displayName = this.userSessionService.getDisplayName();
      if (displayName) {
        this.roomService.joinRoom(id, displayName).catch((error) => {
          console.error('Error joining room:', error);
        });
      }
    }

    // Set up beforeunload listener to remove user when they close the tab/window
    this.setupBeforeUnloadListener();
  }

  ngAfterViewInit(): void {
    // Trigger animations after view is initialized
    if (this.options().length > 0 && !this.animationsTriggered) {
      setTimeout(() => {
        this.animationsService.animateOptionsEntrance();
        this.animationsTriggered = true;
      }, 100);
    }
  }

  ngOnDestroy(): void {
    // Only remove user from room if voting hasn't ended
    const currentRoom = this.room();
    const displayName = this.userSessionService.getDisplayName();
    const userId = this.userSessionService.getUserId();

    if (displayName && userId && this.roomId() && currentRoom?.status !== RoomStatus.Ended) {
      // Remove vote first, then leave room
      this.voteService.removeUserVote(this.roomId(), userId).catch((error) => {
        console.error('Error removing vote:', error);
      });

      this.roomService.leaveRoom(this.roomId(), displayName).catch((error) => {
        console.error('Error leaving room:', error);
      });
    } else if (currentRoom?.status === RoomStatus.Ended) {
      console.log('Room voting has ended - skipping participant/vote removal');
    }

    // Clean up subscriptions and animations
    this.roomSubscription?.unsubscribe();
    this.optionsSubscription?.unsubscribe();
    this.voteSubscription?.unsubscribe();
    this.votesSubscription?.unsubscribe();
    this.animationsService.cleanup();
  }

  /**
   * Set up listeners to detect when user leaves (closes tab, navigates away, etc.)
   */
  private setupBeforeUnloadListener(): void {
    // Removed tab close detection - participants stay in the list
    // Only ngOnDestroy (navigation) will remove participants
  }

  /**
   * Set up real-time listener for room data
   */
  private setupRoomListener(): void {
    this.roomSubscription = this.roomService.getRoom(this.roomId()).subscribe({
      next: (room) => {
        if (room) {
          this.room.set(room);
          this.isLoading.set(false);

          // Check if current user is the creator
          const userId = this.userSessionService.getUserId();
          this.isCreator.set(room.createdBy === userId);
        } else {
          this.error.set('Room not found');
          this.isLoading.set(false);
        }
      },
      error: (err) => {
        console.error('Error loading room:', err);
        this.error.set('Failed to load room');
        this.isLoading.set(false);
      },
    });
  }

  /**
   * Set up real-time listener for options
   */
  private setupOptionsListener(): void {
    console.log('Setting up options listener for roomId:', this.roomId());
    this.optionsSubscription = this.optionService.getOptions(this.roomId()).subscribe({
      next: (options) => {
        console.log('Received options from Firestore:', options);
        const wasEmpty = this.options().length === 0;

        // Check if order changed (for animation)
        const currentIds = this.options().map((opt) => opt.id);
        const newIds = options.map((opt) => opt.id);
        const orderChanged =
          currentIds.length > 0 &&
          currentIds.length === newIds.length &&
          currentIds.some((id, idx) => id !== newIds[idx]);

        // Update options
        this.options.set(options);

        // Trigger animations for first load
        if (wasEmpty && options.length > 0 && !this.animationsTriggered) {
          setTimeout(() => {
            this.animationsService.animateOptionsEntrance();
            this.animationsTriggered = true;
          }, 100);
        } else if (orderChanged) {
          // Animate reordering when order changes
          console.log('Order changed, animating reorder');
          setTimeout(() => {
            this.animationsService.animateOptionsReorder();
          }, 0);
        } else if (this.animationsTriggered) {
          // Detect and animate new options appearing in real-time
          const currentOptionIds = new Set(currentIds);
          const newOptionIds = newIds.filter((id) => id && !currentOptionIds.has(id));

          if (newOptionIds.length > 0) {
            console.log('New options detected:', newOptionIds);
            // Wait for DOM to update, then animate the new option
            setTimeout(() => {
              newOptionIds.forEach((optionId) => {
                const element = document.querySelector(
                  `[data-option-id="${optionId}"]`
                ) as HTMLElement;
                if (element) {
                  console.log('Animating new option:', optionId);
                  this.animationsService.animateNewOption(element);
                }
              });
            }, 50);
          }

          // Update the previous IDs set
          this.previousOptionIds = new Set(newIds.filter((id) => id) as string[]);
        }
      },
      error: (err) => {
        console.error('Error loading options:', err);
      },
    });
  }

  /**
   * Set up real-time listener for user's vote
   */
  private setupVoteListener(): void {
    const userId = this.userSessionService.getUserId();
    console.log('Setting up vote listener for userId:', userId);

    this.voteSubscription = this.voteService.getUserVote(this.roomId(), userId).subscribe({
      next: (optionId) => {
        console.log('User current vote:', optionId);
        this.userVote.set(optionId);
      },
      error: (err) => {
        console.error('Error loading user vote:', err);
      },
    });
  }

  /**
   * Set up real-time listener for all votes
   */
  private setupVotesListener(): void {
    console.log('Setting up votes listener for roomId:', this.roomId());

    this.votesSubscription = this.voteService.getAllVotes(this.roomId()).subscribe({
      next: (votes) => {
        console.log('All votes:', votes);
        this.votes.set(votes);
      },
      error: (err) => {
        console.error('Error loading votes:', err);
      },
    });
  }

  /**
   * Handle vote from option card
   */
  async onVote(optionId: string): Promise<void> {
    // Check if voting is allowed
    const currentRoom = this.room();
    // If status is undefined (old rooms), allow voting. Otherwise check if InProgress
    const votingAllowed = !currentRoom?.status || currentRoom.status === RoomStatus.InProgress;

    if (!votingAllowed) {
      console.log('Voting is not allowed - status:', currentRoom?.status);
      return;
    }

    const displayName = this.userSessionService.getDisplayName();
    const userId = this.userSessionService.getUserId();

    if (!displayName) {
      console.error('User has no display name');
      return;
    }

    try {
      this.isVoting.set(true);
      console.log('Voting for option:', optionId);
      await this.voteService.vote(this.roomId(), optionId, userId, displayName);
      console.log('Vote successful');
    } catch (error) {
      console.error('Error voting:', error);
      // Could show a toast notification here
    } finally {
      this.isVoting.set(false);
    }
  }

  /**
   * Update room status (only for creator)
   */
  async updateStatus(status: RoomStatus): Promise<void> {
    if (!this.isCreator()) {
      console.error('Only creator can update room status');
      return;
    }

    try {
      await this.roomService.updateRoomStatus(this.roomId(), status);
      console.log('Room status updated to:', status);
    } catch (error) {
      console.error('Error updating room status:', error);
    }
  }

  /**
   * Track by function for ngFor
   */
  trackByOptionId(index: number, option: OptionWithPercentage): string {
    return option.id || index.toString();
  }

  /**
   * Toggle participants accordion (mobile)
   */
  toggleParticipants(): void {
    this.participantsExpanded.update((expanded) => !expanded);
  }

  /**
   * Handle name submission from prompt
   */
  async onNameSubmitted(displayName: string): Promise<void> {
    console.log('User name set:', displayName);
    this.showNamePrompt.set(false);

    // Add user to room participants
    try {
      await this.roomService.joinRoom(this.roomId(), displayName);
    } catch (error) {
      console.error('Error joining room:', error);
    }
  }
}
