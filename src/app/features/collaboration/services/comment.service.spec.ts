import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { CommentService } from './comment.service';
import { CommentCreateDto, CommentResponseDto, CommentUpdateDto } from '../../../shared/models/comment.model';
import { environment } from '../../../../environments/environment';

describe('CommentService', () => {
  let service: CommentService;
  let httpMock: HttpTestingController;
  const apiUrl = environment.apiUrl + '/api';

  const mockComment: CommentResponseDto = {
    id: 'comment-1',
    taskId: 'task-1',
    userId: 'user-1',
    authorName: 'John Doe',
    authorProfileImageUrl: null,
    content: 'Test comment',
    createdDate: '2026-02-06T10:00:00Z',
    modifiedDate: null,
    isEdited: false,
    isDeleted: false,
    mentionedUserIds: []
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        CommentService
      ]
    });
    service = TestBed.inject(CommentService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getTaskComments', () => {
    it('should make GET request to correct URL', () => {
      const taskId = 'task-1';
      service.getTaskComments(taskId).subscribe(comments => {
        expect(comments).toEqual([mockComment]);
      });

      const req = httpMock.expectOne(apiUrl + '/tasks/' + taskId + '/comments');
      expect(req.request.method).toBe('GET');
      req.flush([mockComment]);
    });

    it('should handle error', () => {
      const taskId = 'task-1';
      service.getTaskComments(taskId).subscribe({
        error: (error) => {
          expect(error).toBeTruthy();
        }
      });

      const req = httpMock.expectOne(apiUrl + '/tasks/' + taskId + '/comments');
      req.flush('Error', { status: 500, statusText: 'Server Error' });
    });
  });

  describe('createComment', () => {
    it('should make POST request with correct body', () => {
      const taskId = 'task-1';
      const dto: CommentCreateDto = { content: 'New comment', mentionedUserIds: ['user-2'] };

      service.createComment(taskId, dto).subscribe(comment => {
        expect(comment).toEqual(mockComment);
      });

      const req = httpMock.expectOne(apiUrl + '/tasks/' + taskId + '/comments');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(dto);
      req.flush(mockComment);
    });

    it('should handle error', () => {
      const taskId = 'task-1';
      const dto: CommentCreateDto = { content: 'New comment' };

      service.createComment(taskId, dto).subscribe({
        error: (error) => {
          expect(error).toBeTruthy();
        }
      });

      const req = httpMock.expectOne(apiUrl + '/tasks/' + taskId + '/comments');
      req.flush('Error', { status: 400, statusText: 'Bad Request' });
    });
  });

  describe('updateComment', () => {
    it('should make PUT request to correct URL with body', () => {
      const commentId = 'comment-1';
      const dto: CommentUpdateDto = { content: 'Updated comment' };

      service.updateComment(commentId, dto).subscribe(comment => {
        expect(comment).toEqual({ ...mockComment, content: 'Updated comment', isEdited: true });
      });

      const req = httpMock.expectOne(apiUrl + '/comments/' + commentId);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(dto);
      req.flush({ ...mockComment, content: 'Updated comment', isEdited: true });
    });

    it('should handle error', () => {
      const commentId = 'comment-1';
      const dto: CommentUpdateDto = { content: 'Updated' };

      service.updateComment(commentId, dto).subscribe({
        error: (error) => {
          expect(error).toBeTruthy();
        }
      });

      const req = httpMock.expectOne(apiUrl + '/comments/' + commentId);
      req.flush('Error', { status: 403, statusText: 'Forbidden' });
    });
  });

  describe('deleteComment', () => {
    it('should make DELETE request to correct URL', () => {
      const commentId = 'comment-1';

      service.deleteComment(commentId).subscribe(() => {
        expect(true).toBe(true);
      });

      const req = httpMock.expectOne(apiUrl + '/comments/' + commentId);
      expect(req.request.method).toBe('DELETE');
      req.flush(null, { status: 204, statusText: 'No Content' });
    });

    it('should handle error', () => {
      const commentId = 'comment-1';

      service.deleteComment(commentId).subscribe({
        error: (error) => {
          expect(error).toBeTruthy();
        }
      });

      const req = httpMock.expectOne(apiUrl + '/comments/' + commentId);
      req.flush('Error', { status: 404, statusText: 'Not Found' });
    });
  });
});
