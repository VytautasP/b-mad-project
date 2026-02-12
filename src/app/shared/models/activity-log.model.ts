import { PaginatedResult } from './task.model';

export enum ActivityType {
  Created = 0,
  Updated = 1,
  Deleted = 2,
  StatusChanged = 3,
  Assigned = 4,
  Unassigned = 5,
  TimeLogged = 6,
  Commented = 7
}

export interface ActivityLog {
  id: string;
  taskId: string;
  userId: string;
  userName: string;
  activityType: ActivityType;
  description: string;
  changedField: string | null;
  oldValue: string | null;
  newValue: string | null;
  timestamp: string;
}

export interface ActivityLogQuery {
  page?: number;
  pageSize?: number;
}

export type PaginatedActivityLogResult = PaginatedResult<ActivityLog>;