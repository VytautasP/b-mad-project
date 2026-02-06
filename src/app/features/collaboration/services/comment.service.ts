import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { CommentResponseDto, CommentCreateDto, CommentUpdateDto } from '../../../shared/models/comment.model';

@Injectable({
  providedIn: 'root'
})
export class CommentService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/api`;

  getTaskComments(taskId: string): Observable<CommentResponseDto[]> {
    return this.http.get<CommentResponseDto[]>(`${this.apiUrl}/tasks/${taskId}/comments`).pipe(
      catchError(this.handleError)
    );
  }

  createComment(taskId: string, dto: CommentCreateDto): Observable<CommentResponseDto> {
    return this.http.post<CommentResponseDto>(`${this.apiUrl}/tasks/${taskId}/comments`, dto).pipe(
      catchError(this.handleError)
    );
  }

  updateComment(commentId: string, dto: CommentUpdateDto): Observable<CommentResponseDto> {
    return this.http.put<CommentResponseDto>(`${this.apiUrl}/comments/${commentId}`, dto).pipe(
      catchError(this.handleError)
    );
  }

  deleteComment(commentId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/comments/${commentId}`).pipe(
      catchError(this.handleError)
    );
  }

  private handleError(error: any): Observable<never> {
    console.error('Comment service error:', error);
    return throwError(() => error);
  }
}
