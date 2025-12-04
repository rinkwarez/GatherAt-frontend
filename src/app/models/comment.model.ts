/**
 * Comment Model - Represents a comment on a voting option
 */
export interface Comment {
  id: string;
  optionId: string;
  userId: string;
  userName: string;
  text: string;
  createdAt: Date;
}

/**
 * Data structure for creating a new comment
 */
export interface CreateCommentData {
  optionId: string;
  userId: string;
  userName: string;
  text: string;
}
