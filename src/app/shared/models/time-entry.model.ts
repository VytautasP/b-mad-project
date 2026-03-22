export enum EntryType {
  Manual = 'Manual',
  Timer = 'Timer'
}

export interface TimeEntry {
  id: string;
  taskId: string;
  userId: string;
  userName: string;
  minutes: number;
  entryDate: Date;
  note?: string;
  entryType: EntryType;
  isBillable: boolean;
  taskName: string;
  projectName: string;
  createdAt: Date;
}

export interface TimeEntryCreateDto {
  minutes: number;
  note?: string;
  entryDate?: Date;
  entryType: EntryType;
  isBillable?: boolean;
}

export interface TimeEntryResponseDto {
  id: string;
  taskId: string;
  userId: string;
  userName: string;
  minutes: number;
  entryDate: string;
  note?: string;
  entryType: string;
  isBillable: boolean;
  taskName: string;
  projectName: string;
  createdAt: string;
}

export interface TimeEntryFilterParams {
  page?: number;
  pageSize?: number;
  startDate?: string;
  endDate?: string;
  userId?: string;
  projectId?: string;
  isBillable?: boolean;
  search?: string;
}

export interface PaginatedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface TimeEntrySummary {
  totalMinutes: number;
  billableMinutes: number;
  nonBillableMinutes: number;
  previousPeriodTotalMinutes: number;
  previousPeriodBillableMinutes: number;
  previousPeriodNonBillableMinutes: number;
}