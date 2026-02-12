import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { PaginatedActivityLogResult } from '../../../shared/models/activity-log.model';

@Injectable({
  providedIn: 'root'
})
export class ActivityLogService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/api`;

  getTaskActivity(taskId: string, page = 1, pageSize = 20): Observable<PaginatedActivityLogResult> {
    const params = new HttpParams()
      .set('page', page)
      .set('pageSize', pageSize);

    return this.http
      .get<PaginatedActivityLogResult>(`${this.apiUrl}/tasks/${taskId}/activity`, { params })
      .pipe(catchError(this.handleError));
  }

  private handleError(error: unknown): Observable<never> {
    console.error('Activity log service error:', error);
    return throwError(() => error);
  }
}
