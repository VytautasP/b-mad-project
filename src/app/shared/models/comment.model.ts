export interface CommentResponseDto {
  id: string;
  taskId: string;
  userId: string;
  authorName: string;
  authorProfileImageUrl: string | null;
  content: string;
  createdDate: string;
  modifiedDate: string | null;
  isEdited: boolean;
  isDeleted: boolean;
  mentionedUserIds: string[];
}

export interface CommentCreateDto {
  content: string;
  mentionedUserIds?: string[];
}

export interface CommentUpdateDto {
  content: string;
}
