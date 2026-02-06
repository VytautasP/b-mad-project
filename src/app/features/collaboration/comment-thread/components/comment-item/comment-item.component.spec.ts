import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommentItemComponent } from './comment-item.component';
import { CommentResponseDto } from '../../../../../shared/models/comment.model';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ChangeDetectorRef } from '@angular/core';

describe('CommentItemComponent', () => {
  let component: CommentItemComponent;
  let fixture: ComponentFixture<CommentItemComponent>;

  const mockComment: CommentResponseDto = {
    id: 'comment-1',
    taskId: 'task-1',
    userId: 'user-1',
    authorName: 'John Doe',
    authorProfileImageUrl: null,
    content: 'This is a test comment',
    createdDate: new Date().toISOString(),
    modifiedDate: null,
    isEdited: false,
    isDeleted: false,
    mentionedUserIds: []
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CommentItemComponent, NoopAnimationsModule]
    }).compileComponents();

    fixture = TestBed.createComponent(CommentItemComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('comment', { ...mockComment });
    fixture.componentRef.setInput('currentUserId', 'user-1');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display author name and content', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.author-name')?.textContent).toContain('John Doe');
    expect(el.querySelector('.comment-content')?.textContent).toContain('This is a test comment');
  });

  it('should display timestamp', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.comment-time')?.textContent?.trim()).toBeTruthy();
  });

  it('should show "(edited)" indicator when isEdited is true', () => {
    fixture.componentRef.setInput('comment', { ...mockComment, isEdited: true });
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const indicator = el.querySelector('.edited-indicator');
    expect(indicator).toBeTruthy();
    expect(indicator?.textContent).toContain('(edited)');
  });

  it('should not show "(edited)" indicator when isEdited is false', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.edited-indicator')).toBeNull();
  });

  it('should show edit/delete buttons for own comments', () => {
    const el = fixture.nativeElement as HTMLElement;
    const actions = el.querySelector('.comment-actions');
    expect(actions).toBeTruthy();
  });

  it('should hide edit/delete buttons for other users comments', () => {
    fixture.componentRef.setInput('currentUserId', 'user-other');
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const actions = el.querySelector('.comment-actions');
    expect(actions).toBeNull();
  });

  it('should toggle edit mode', () => {
    component.onStartEdit();
    fixture.componentRef.injector.get(ChangeDetectorRef).detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.edit-textarea')).toBeTruthy();
    expect(component.isEditing).toBe(true);
  });

  it('should emit edit event on save', () => {
    const emitSpy = vi.spyOn(component.edit, 'emit');
    component.onStartEdit();
    component.editContent = 'Updated content';
    component.onSaveEdit();
    expect(emitSpy).toHaveBeenCalledWith({
      commentId: 'comment-1',
      content: 'Updated content'
    });
    expect(component.isEditing).toBe(false);
  });

  it('should revert on cancel edit', () => {
    component.onStartEdit();
    component.editContent = 'Updated content';
    component.onCancelEdit();
    expect(component.isEditing).toBe(false);
    expect(component.editContent).toBe('');
  });

  it('should emit delete event', () => {
    const emitSpy = vi.spyOn(component.delete, 'emit');
    component.onDelete();
    expect(emitSpy).toHaveBeenCalledWith('comment-1');
  });

  it('should show "[Comment deleted]" for deleted comments', () => {
    fixture.componentRef.setInput('comment', { ...mockComment, isDeleted: true });
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const deleted = el.querySelector('.deleted-text');
    expect(deleted).toBeTruthy();
    expect(deleted?.textContent).toContain('[Comment deleted]');
  });

  it('should display author initials when no profile image', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.avatar-initials')?.textContent?.trim()).toBe('J');
  });

  it('should render @mentions as highlighted text', () => {
    fixture.componentRef.setInput('comment', { ...mockComment, content: 'Hey @JohnDoe check this' });
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const mention = el.querySelector('.mention');
    expect(mention).toBeTruthy();
    expect(mention?.textContent).toContain('@JohnDoe');
  });
});
