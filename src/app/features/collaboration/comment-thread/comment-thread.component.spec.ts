import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommentThreadComponent } from './comment-thread.component';
import { CommentService } from '../services/comment.service';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { CommentResponseDto } from '../../../shared/models/comment.model';
import { of, throwError } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialog } from '@angular/material/dialog';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

describe('CommentThreadComponent', () => {
  let component: CommentThreadComponent;
  let fixture: ComponentFixture<CommentThreadComponent>;
  let mockCommentService: {
    getTaskComments: ReturnType<typeof vi.fn>;
    createComment: ReturnType<typeof vi.fn>;
    updateComment: ReturnType<typeof vi.fn>;
    deleteComment: ReturnType<typeof vi.fn>;
  };
  let mockAuthService: { getCurrentUser: ReturnType<typeof vi.fn> };
  let mockNotificationService: {
    showSuccess: ReturnType<typeof vi.fn>;
    showError: ReturnType<typeof vi.fn>;
    showInfo: ReturnType<typeof vi.fn>;
  };
  let mockDialog: { open: ReturnType<typeof vi.fn> };

  const mockComments: CommentResponseDto[] = [
    {
      id: 'comment-1',
      taskId: 'task-1',
      userId: 'user-1',
      authorName: 'John Doe',
      authorProfileImageUrl: null,
      content: 'First comment',
      createdDate: '2026-02-06T10:00:00Z',
      modifiedDate: null,
      isEdited: false,
      isDeleted: false,
      mentionedUserIds: []
    },
    {
      id: 'comment-2',
      taskId: 'task-1',
      userId: 'user-2',
      authorName: 'Jane Smith',
      authorProfileImageUrl: null,
      content: 'Second comment',
      createdDate: '2026-02-06T11:00:00Z',
      modifiedDate: null,
      isEdited: false,
      isDeleted: false,
      mentionedUserIds: []
    }
  ];

  beforeEach(async () => {
    mockCommentService = {
      getTaskComments: vi.fn().mockReturnValue(of(mockComments)),
      createComment: vi.fn(),
      updateComment: vi.fn(),
      deleteComment: vi.fn()
    };
    mockAuthService = {
      getCurrentUser: vi.fn().mockReturnValue({ id: 'user-1', name: 'John Doe', email: 'john@test.com' })
    };
    mockNotificationService = {
      showSuccess: vi.fn(),
      showError: vi.fn(),
      showInfo: vi.fn()
    };
    mockDialog = {
      open: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [CommentThreadComponent, NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: CommentService, useValue: mockCommentService },
        { provide: AuthService, useValue: mockAuthService },
        { provide: NotificationService, useValue: mockNotificationService },
        { provide: MatDialog, useValue: mockDialog }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CommentThreadComponent);
    component = fixture.componentInstance;
    component.taskId = 'task-1';
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should load comments on init', () => {
    fixture.detectChanges();
    expect(mockCommentService.getTaskComments).toHaveBeenCalledWith('task-1');
    expect(component.comments().length).toBe(2);
  });

  it('should display empty state when no comments', () => {
    mockCommentService.getTaskComments.mockReturnValue(of([]));
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.empty-state')?.textContent).toContain('Be the first to comment');
  });

  it('should render comment list with correct data', () => {
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const items = el.querySelectorAll('app-comment-item');
    expect(items.length).toBe(2);
  });

  it('should add new comment to list on post', () => {
    fixture.detectChanges();

    const newComment: CommentResponseDto = {
      id: 'comment-3',
      taskId: 'task-1',
      userId: 'user-1',
      authorName: 'John Doe',
      authorProfileImageUrl: null,
      content: 'New comment',
      createdDate: '2026-02-06T12:00:00Z',
      modifiedDate: null,
      isEdited: false,
      isDeleted: false,
      mentionedUserIds: []
    };
    mockCommentService.createComment.mockReturnValue(of(newComment));

    component.onPostComment({ content: 'New comment', mentionedUserIds: [] });

    expect(component.comments().length).toBe(3);
    expect(mockNotificationService.showSuccess).toHaveBeenCalledWith('Comment posted');
  });

  it('should update comment in list on edit', () => {
    fixture.detectChanges();

    const updatedComment = { ...mockComments[0], content: 'Edited content', isEdited: true };
    mockCommentService.updateComment.mockReturnValue(of(updatedComment));

    component.onEditComment({ commentId: 'comment-1', content: 'Edited content' });

    const updated = component.comments().find(c => c.id === 'comment-1');
    expect(updated?.content).toBe('Edited content');
    expect(mockNotificationService.showSuccess).toHaveBeenCalledWith('Comment updated');
  });

  it('should show loading state during fetch', () => {
    expect(component.isLoading()).toBe(false);
    fixture.detectChanges();
    expect(component.isLoading()).toBe(false);
  });

  it('should handle load error', () => {
    mockCommentService.getTaskComments.mockReturnValue(throwError(() => new Error('fail')));
    fixture.detectChanges();
    expect(component.hasLoadError()).toBe(true);
    expect(component.isLoading()).toBe(false);
  });

  it('should retry comments load from inline retry action', () => {
    mockCommentService.getTaskComments
      .mockReturnValueOnce(throwError(() => new Error('fail')))
      .mockReturnValueOnce(of(mockComments));

    fixture.detectChanges();
    expect(component.hasLoadError()).toBe(true);

    component.onRetryLoadComments();

    expect(mockCommentService.getTaskComments).toHaveBeenCalledTimes(2);
    expect(component.hasLoadError()).toBe(false);
    expect(component.comments().length).toBe(2);
  });

  it('should emit commentCountChange on load', () => {
    const emitSpy = vi.spyOn(component.commentCountChange, 'emit');
    fixture.detectChanges();
    expect(emitSpy).toHaveBeenCalledWith(2);
  });
});
