import { MatDialogConfig } from '@angular/material/dialog';
import { Task } from '../models/task.model';
import { getDialogAnimationDurations } from './motion.utils';

export type TaskFormMode = 'create' | 'edit';
export type TaskFormInitialFocusField = 'taskName' | 'dueDate' | null;

export interface TaskFormDialogData {
  mode?: TaskFormMode;
  task?: Task | null;
  embedded?: boolean;
  initialFocusField?: TaskFormInitialFocusField;
}

export const CREATE_TASK_DIALOG_PANEL_CLASS = 'create-task-dialog-panel';
export const CREATE_TASK_DIALOG_BACKDROP_CLASS = 'create-task-dialog-backdrop';

export const getCreateTaskDialogConfig = (
  initialFocusField: TaskFormInitialFocusField = null
): MatDialogConfig<TaskFormDialogData> => ({
  width: '672px',
  maxWidth: 'calc(100vw - 32px)',
  maxHeight: 'calc(100vh - 32px)',
  autoFocus: false,
  restoreFocus: true,
  panelClass: CREATE_TASK_DIALOG_PANEL_CLASS,
  backdropClass: CREATE_TASK_DIALOG_BACKDROP_CLASS,
  ...getDialogAnimationDurations(),
  data: {
    mode: 'create',
    initialFocusField
  }
});