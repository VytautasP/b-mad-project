import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  TimeEntryResponseDto,
  TimeEntryFilterParams,
  PaginatedResult,
  TimeEntrySummary
} from '../../shared/models/time-entry.model';

@Injectable({
  providedIn: 'root'
})
export class TimeLogService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/api/timeentries`;

  getTimeEntries(filter: TimeEntryFilterParams): Observable<PaginatedResult<TimeEntryResponseDto>> {
    const params = this.buildParams(filter);
    return this.http.get<PaginatedResult<TimeEntryResponseDto>>(this.apiUrl, { params });
  }

  getSummary(startDate?: string, endDate?: string): Observable<TimeEntrySummary> {
    let params = new HttpParams();
    if (startDate) params = params.set('startDate', startDate);
    if (endDate) params = params.set('endDate', endDate);
    return this.http.get<TimeEntrySummary>(`${this.apiUrl}/summary`, { params });
  }

  exportCsv(filter: TimeEntryFilterParams): Observable<Blob> {
    const params = this.buildParams(filter);
    return this.http.get(`${this.apiUrl}/export`, {
      params,
      responseType: 'blob'
    });
  }

  deleteTimeEntry(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  private buildParams(filter: TimeEntryFilterParams): HttpParams {
    let params = new HttpParams();
    if (filter.page) params = params.set('page', filter.page.toString());
    if (filter.pageSize) params = params.set('pageSize', filter.pageSize.toString());
    if (filter.startDate) params = params.set('startDate', filter.startDate);
    if (filter.endDate) params = params.set('endDate', filter.endDate);
    if (filter.userId) params = params.set('userId', filter.userId);
    if (filter.projectId) params = params.set('projectId', filter.projectId);
    if (filter.isBillable !== undefined) params = params.set('isBillable', filter.isBillable.toString());
    if (filter.search) params = params.set('search', filter.search);
    return params;
  }
}
