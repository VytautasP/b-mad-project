import { Component, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { Task, TaskPriority, TaskStatus } from '../../../shared/models/task.model';
import { AssigneeList } from '../components/assignee-list/assignee-list';
import { TaskService } from '../services/task.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ConfirmationDialogComponent, ConfirmationDialogData } from '../../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { TaskFormComponent } from '../task-form/task-form.component';
import { getDialogAnimationDurations } from '../../../shared/utils/motion.utils';
import { UiStatusBadge } from '../../../shared/ui/status-badge/ui-status-badge';
import { UiPriorityIndicator } from '../../../shared/ui/priority-indicator/ui-priority-indicator';

export interface TaskDetailDialogData {
  task: Task;
  openerElement?: HTMLElement | null;
}

@Component({
  selector: 'app-task-detail-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    AssigneeList,
    UiStatusBadge,
    UiPriorityIndicator
  ],
  templateUrl: './task-detail-dialog.html',
  styleUrl: './task-detail-dialog.css',
})
export class TaskDetailDialog {
  private readonly dialogRef = inject(MatDialogRef<TaskDetailDialog>);
  private readonly data: TaskDetailDialogData = inject(MAT_DIALOG_DATA);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  private readonly taskService = inject(TaskService);
  private readonly notificationService = inject(NotificationService);

  task: Task = this.data.task;

  TaskPriority = TaskPriority;
  TaskStatus = TaskStatus;

  getTaskId(): string {
    const idPart = this.task.id.replace(/[^a-zA-Z0-9]/g, '').slice(-4).toUpperCase();
    return `TF-${idPart}`;
  }

  formatDate(date: Date | null): string {
    if (!date) return 'No due date';
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  @HostListener('document:keydown.escape', ['$event'])
  onEscapeKey(event: Event): void {
    event.preventDefault();
    this.onClose();
  }

  onClose(): void {
    this.dialogRef.close();
    this.data.openerElement?.focus();
  }

  onOpenFullDetails(): void {
    this.router.navigate(['/tasks', this.task.id]);
    this.dialogRef.close();
  }

  onEditDetails(): void {
    this.dialogRef.close();
    const editDialogRef = this.dialog.open(TaskFormComponent, {
      width: '600px',
      ...getDialogAnimationDurations(),
      data: { mode: 'edit', task: this.task }
    });
    editDialogRef.componentInstance.mode = 'edit';
    editDialogRef.componentInstance.taskToEdit = this.task;
  }

  onArchiveTask(): void {
    const dialogData: ConfirmationDialogData = {
      title: 'Archive Task',
      message: `Are you sure you want to archive "${this.task.name}"? This action can be undone later.`,
      confirmText: 'Archive',
      cancelText: 'Cancel'
    };

    const confirmRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '400px',
      ...getDialogAnimationDurations(),
      data: dialogData
    });

    confirmRef.afterClosed().subscribe(confirmed => {
      if (confirmed === true) {
        this.taskService.deleteTask(this.task.id).subscribe({
          next: () => {
            this.notificationService.showSuccess('Task archived successfully');
            this.dialogRef.close({ archived: true });
            this.data.openerElement?.focus();
          },
          error: (error) => {
            const errorMessage = error.error?.message || 'Failed to archive task. Please try again.';
            this.notificationService.showError(errorMessage);
          }
        });
      }
    });
  }
}

