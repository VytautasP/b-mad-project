import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormsModule } from '@angular/forms';
import { CommentResponseDto } from '../../../../../shared/models/comment.model';
import { RelativeTimePipe } from '../../../../../shared/pipes/relative-time.pipe';

@Component({
  selector: 'app-comment-item',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    FormsModule,
    RelativeTimePipe
  ],
  templateUrl: './comment-item.component.html',
  styleUrl: './comment-item.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CommentItemComponent {
  @Input({ required: true }) comment!: CommentResponseDto;
  @Input({ required: true }) currentUserId!: string;

  @Output() edit = new EventEmitter<{ commentId: string; content: string }>();
  @Output() delete = new EventEmitter<string>();
  @Output() mentionClick = new EventEmitter<string>();

  isEditing = false;
  editContent = '';

  get isOwnComment(): boolean {
    return this.comment.userId === this.currentUserId;
  }

  get authorInitial(): string {
    return this.comment.authorName ? this.comment.authorName.charAt(0).toUpperCase() : '?';
  }

  getFormattedContent(): { text: string; isMention: boolean; userId?: string }[] {
    const content = this.comment.content;
    const mentionRegex = /@(\w+(?:\s\w+)*)/g;
    const parts: { text: string; isMention: boolean; userId?: string }[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = mentionRegex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        parts.push({ text: content.slice(lastIndex, match.index), isMention: false });
      }
      parts.push({ text: match[0], isMention: true });
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < content.length) {
      parts.push({ text: content.slice(lastIndex), isMention: false });
    }

    if (parts.length === 0) {
      parts.push({ text: content, isMention: false });
    }

    return parts;
  }

  onStartEdit(): void {
    this.isEditing = true;
    this.editContent = this.comment.content;
  }

  onSaveEdit(): void {
    const trimmed = this.editContent.trim();
    if (trimmed && trimmed !== this.comment.content) {
      this.edit.emit({ commentId: this.comment.id, content: trimmed });
    }
    this.isEditing = false;
  }

  onCancelEdit(): void {
    this.isEditing = false;
    this.editContent = '';
  }

  onDelete(): void {
    this.delete.emit(this.comment.id);
  }

  onMentionClicked(mention: string): void {
    this.mentionClick.emit(mention);
  }
}
