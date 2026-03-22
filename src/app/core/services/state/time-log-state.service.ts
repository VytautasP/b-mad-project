import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, finalize } from 'rxjs';
import { TimeLogService } from '../time-log.service';
import {
  TimeEntryResponseDto,
  TimeEntryFilterParams,
  PaginatedResult,
  TimeEntrySummary
} from '../../../shared/models/time-entry.model';

export type DatePreset = 'today' | 'week' | 'month' | 'custom';

export interface TimeLogFilters {
  datePreset: DatePreset;
  startDate: string;
  endDate: string;
  projectId?: string;
  isBillable?: boolean;
  search?: string;
  page: number;
  pageSize: number;
}

@Injectable({
  providedIn: 'root'
})
export class TimeLogStateService {
  private readonly timeLogService = inject(TimeLogService);

  private readonly defaultFilters: TimeLogFilters = {
    datePreset: 'week',
    startDate: this.getWeekStart(),
    endDate: this.getWeekEnd(),
    page: 1,
    pageSize: 10
  };

  private filtersSubject = new BehaviorSubject<TimeLogFilters>({ ...this.defaultFilters });
  private entriesSubject = new BehaviorSubject<PaginatedResult<TimeEntryResponseDto>>({
    items: [],
    totalCount: 0,
    page: 1,
    pageSize: 10,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false
  });
  private summarySubject = new BehaviorSubject<TimeEntrySummary>({
    totalMinutes: 0,
    billableMinutes: 0,
    nonBillableMinutes: 0,
    previousPeriodTotalMinutes: 0,
    previousPeriodBillableMinutes: 0,
    previousPeriodNonBillableMinutes: 0
  });
  private loadingSubject = new BehaviorSubject<boolean>(false);

  public filters$: Observable<TimeLogFilters> = this.filtersSubject.asObservable();
  public entries$: Observable<PaginatedResult<TimeEntryResponseDto>> = this.entriesSubject.asObservable();
  public summary$: Observable<TimeEntrySummary> = this.summarySubject.asObservable();
  public loading$: Observable<boolean> = this.loadingSubject.asObservable();

  loadEntries(): void {
    const filters = this.filtersSubject.value;
    this.loadingSubject.next(true);

    const params: TimeEntryFilterParams = {
      page: filters.page,
      pageSize: filters.pageSize,
      startDate: filters.startDate,
      endDate: filters.endDate,
      projectId: filters.projectId,
      isBillable: filters.isBillable,
      search: filters.search
    };

    this.timeLogService.getTimeEntries(params)
      .pipe(finalize(() => this.loadingSubject.next(false)))
      .subscribe({
        next: result => this.entriesSubject.next(result),
        error: err => console.error('Failed to load time entries:', err)
      });
  }

  loadSummary(): void {
    const filters = this.filtersSubject.value;
    this.timeLogService.getSummary(filters.startDate, filters.endDate).subscribe({
      next: summary => this.summarySubject.next(summary),
      error: err => console.error('Failed to load summary:', err)
    });
  }

  updateFilters(partial: Partial<TimeLogFilters>): void {
    const current = this.filtersSubject.value;
    const updated = { ...current, ...partial, page: partial.page ?? 1 };
    this.filtersSubject.next(updated);
    this.loadEntries();
    this.loadSummary();
  }

  setPage(page: number): void {
    const current = this.filtersSubject.value;
    this.filtersSubject.next({ ...current, page });
    this.loadEntries();
  }

  setDatePreset(preset: DatePreset): void {
    const now = new Date();
    let startDate: string;
    let endDate: string;

    switch (preset) {
      case 'today':
        startDate = this.formatDate(now);
        endDate = this.formatDate(now);
        break;
      case 'week':
        startDate = this.getWeekStart();
        endDate = this.getWeekEnd();
        break;
      case 'month':
        startDate = this.getMonthStart();
        endDate = this.getMonthEnd();
        break;
      default:
        return;
    }

    this.updateFilters({ datePreset: preset, startDate, endDate });
  }

  exportCsv(): void {
    const filters = this.filtersSubject.value;
    const params: TimeEntryFilterParams = {
      startDate: filters.startDate,
      endDate: filters.endDate,
      projectId: filters.projectId,
      isBillable: filters.isBillable,
      search: filters.search
    };

    this.timeLogService.exportCsv(params).subscribe({
      next: blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'time-logs.csv';
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: err => console.error('Failed to export CSV:', err)
    });
  }

  deleteEntry(id: string): void {
    this.timeLogService.deleteTimeEntry(id).subscribe({
      next: () => {
        this.loadEntries();
        this.loadSummary();
      },
      error: err => console.error('Failed to delete entry:', err)
    });
  }

  private getWeekStart(): string {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(now.setDate(diff));
    return this.formatDate(monday);
  }

  private getWeekEnd(): string {
    const start = new Date(this.getWeekStart());
    start.setDate(start.getDate() + 6);
    return this.formatDate(start);
  }

  private getMonthStart(): string {
    const now = new Date();
    return this.formatDate(new Date(now.getFullYear(), now.getMonth(), 1));
  }

  private getMonthEnd(): string {
    const now = new Date();
    return this.formatDate(new Date(now.getFullYear(), now.getMonth() + 1, 0));
  }

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }
}
