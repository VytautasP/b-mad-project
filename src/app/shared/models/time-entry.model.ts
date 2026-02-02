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
  createdAt: Date;
}

export interface TimeEntryCreateDto {
  minutes: number;
  note?: string;
  entryDate?: Date;
  entryType: EntryType;
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
  createdAt: string;
}