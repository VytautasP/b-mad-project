import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { TimeEntryCreateDto, TimeEntryResponseDto, EntryType } from '../../shared/models/time-entry.model';

@Injectable({
  providedIn: 'root'
})
export class TimeTrackingService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/api/tasks`;

  /**
   * Log time for a task
   */
  logTime(taskId: string, minutes: number, note: string, entryType: 'Timer' | 'Manual'): Observable<TimeEntryResponseDto> {
    const dto: TimeEntryCreateDto = {
      minutes,
      note: note || undefined,
      entryDate: new Date(),
      entryType: entryType === 'Timer' ? EntryType.Timer : EntryType.Manual
    };

    return this.http.post<TimeEntryResponseDto>(`${this.apiUrl}/${taskId}/timeentries`, dto).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Get time entries for a task
   */
  getTaskTimeEntries(taskId: string): Observable<TimeEntryResponseDto[]> {
    return this.http.get<TimeEntryResponseDto[]>(`${this.apiUrl}/${taskId}/timeentries`).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Delete a time entry
   */
  deleteTimeEntry(entryId: string): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/api/timeentries/${entryId}`).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Handle HTTP errors
   */
  private handleError(error: any): Observable<never> {
    console.error('Time tracking service error:', error);
    return throwError(() => error);
  }
}