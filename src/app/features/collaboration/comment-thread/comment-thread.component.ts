import { Component, Input, Output, EventEmitter, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';
import { Subject, takeUntil } from 'rxjs';
import { CommentService } from '../services/comment.service';
import { CommentResponseDto } from '../../../shared/models/comment.model';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { CommentItemComponent } from './components/comment-item/comment-item.component';
import { CommentFormComponent } from './components/comment-form/comment-form.component';
import { ConfirmationDialogComponent, ConfirmationDialogData } from '../../../shared/components/confirmation-dialog/confirmation-dialog.component';

@Component({
  selector: 'app-comment-thread',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    CommentItemComponent,
    CommentFormComponent
  ],
  templateUrl: './comment-thread.component.html',
  styleUrl: './comment-thread.component.scss'
})
export class CommentThreadComponent implements OnInit, OnDestroy {
  @Input({ required: true }) taskId!: string;
  @Output() commentCountChange = new EventEmitter<number>();

  private readonly commentService = inject(CommentService);
  private readonly authService = inject(AuthService);
  private readonly notificationService = inject(NotificationService);
  private readonly dialog = inject(MatDialog);
  private readonly destroy$ = new Subject<void>();

  comments = signal<CommentResponseDto[]>([]);
  isLoading = signal<boolean>(true);
  isSubmitting = signal<boolean>(false);
  currentUserId = '';

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    this.currentUserId = user?.id || '';
    this.loadComments();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadComments(): void {
    this.isLoading.set(true);
    this.commentService.getTaskComments(this.taskId).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (comments) => {
        this.comments.set(comments);
        this.commentCountChange.emit(comments.length);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Failed to load comments:', error);
        this.notificationService.showError('Failed to load comments');
        this.isLoading.set(false);
      }
    });
  }

  onPostComment(event: { content: string; mentionedUserIds: string[] }): void {
    this.isSubmitting.set(true);
    this.commentService.createComment(this.taskId, {
      content: event.content,
      mentionedUserIds: event.mentionedUserIds
    }).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (newComment) => {
        this.comments.update(comments => [...comments, newComment]);
        this.commentCountChange.emit(this.comments().length);
        this.notificationService.showSuccess('Comment posted');
        this.isSubmitting.set(false);
      },
      error: (error) => {
        console.error('Failed to post comment:', error);
        this.notificationService.showError('Failed to post comment');
        this.isSubmitting.set(false);
      }
    });
  }

  onEditComment(event: { commentId: string; content: string }): void {
    this.commentService.updateComment(event.commentId, { content: event.content }).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (updatedComment) => {
        this.comments.update(comments =>
          comments.map(c => c.id === event.commentId ? updatedComment : c)
        );
        this.notificationService.showSuccess('Comment updated');
      },
      error: (error) => {
        console.error('Failed to update comment:', error);
        this.notificationService.showError('Failed to update comment');
      }
    });
  }

  onDeleteComment(commentId: string): void {
    const dialogData: ConfirmationDialogData = {
      title: 'Delete Comment',
      message: 'Are you sure you want to delete this comment? This action cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Cancel'
    };

    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '400px',
      data: dialogData
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed === true) {
        this.commentService.deleteComment(commentId).pipe(
          takeUntil(this.destroy$)
        ).subscribe({
          next: () => {
            this.comments.update(comments => comments.filter(c => c.id !== commentId));
            this.commentCountChange.emit(this.comments().length);
            this.notificationService.showSuccess('Comment deleted');
          },
          error: (error) => {
            console.error('Failed to delete comment:', error);
            this.notificationService.showError('Failed to delete comment');
          }
        });
      }
    });
  }

  onMentionClick(mention: string): void {
    this.notificationService.showInfo('User: ' + mention);
  }
}
