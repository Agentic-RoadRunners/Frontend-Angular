/** Matches backend CommentResponse */
export interface CommentResponse {
  id: number;
  incidentId: string;
  userId: string;
  userName?: string;
  content: string;
  createdAt: string;
}

/** Matches backend CreateCommentRequest — incidentId goes in the URL */
export interface CreateCommentRequest {
  content: string;
}
