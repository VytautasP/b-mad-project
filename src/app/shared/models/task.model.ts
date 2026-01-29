// Task enums matching backend
export enum TaskPriority {
  Low = 0,
  Medium = 1,
  High = 2,
  Critical = 3
}

export enum TaskStatus {
  ToDo = 0,
  InProgress = 1,
  Blocked = 2,
  Waiting = 3,
  Done = 4
}

export enum TaskType {
  Project = 0,
  Milestone = 1,
  Task = 2
}

// Task Assignment DTO
export interface TaskAssignmentDto {
  userId: string;
  userName: string;
  userEmail: string;
  assignedDate: string;
  assignedByUserId: string;
  assignedByUserName: string;
}

// Full Task interface
export interface Task {
  id: string;
  name: string;
  description: string | null;
  parentTaskId: string | null;
  hasChildren: boolean;
  createdByUserId: string;
  createdByUserName: string;
  createdDate: Date;
  modifiedDate: Date;
  dueDate: Date | null;
  priority: TaskPriority;
  status: TaskStatus;
  progress: number;
  type: TaskType;
  isDeleted: boolean;
  assignees: TaskAssignmentDto[];
}

// Create DTO
export interface TaskCreateDto {
  name: string;
  description?: string | null;
  parentTaskId?: string | null;
  dueDate?: Date | null;
  priority: TaskPriority;
  status: TaskStatus;
  type: TaskType;
}

// Update DTO
export interface TaskUpdateDto {
  name?: string;
  description?: string | null;
  parentTaskId?: string | null;
  dueDate?: Date | null;
  priority?: TaskPriority;
  status?: TaskStatus;
  progress?: number;
  type?: TaskType;
}
