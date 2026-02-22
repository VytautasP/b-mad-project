import { Component, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { Router } from '@angular/router';
import { Task, TaskPriority, TaskStatus } from '../../../shared/models/task.model';
import { AssigneeList } from '../components/assignee-list/assignee-list';

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
    MatChipsModule,
    AssigneeList
  ],
  templateUrl: './task-detail-dialog.html',
  styleUrl: './task-detail-dialog.css',
})
export class TaskDetailDialog {
  private readonly dialogRef = inject(MatDialogRef<TaskDetailDialog>);
  private readonly data: TaskDetailDialogData = inject(MAT_DIALOG_DATA);
  private readonly router = inject(Router);

  task: Task = this.data.task;

  TaskPriority = TaskPriority;
  TaskStatus = TaskStatus;
  
  getPriorityLabel(priority: number): string {
    return TaskPriority[priority];
  }
  
  getStatusLabel(status: number): string {
    switch (status) {
      case TaskStatus.ToDo:
        return 'To Do';
      case TaskStatus.InProgress:
        return 'In Progress';
      case TaskStatus.Blocked:
        return 'Blocked';
      case TaskStatus.Waiting:
        return 'Waiting';
      case TaskStatus.Done:
        return 'Done';
      default:
        return 'To Do';
    }
  }

  formatDate(date: Date | null): string {
    if (!date) return 'No due date';
    return new Date(date).toLocaleDateString();
  }

  getShortDescription(): string {
    const description = this.task.description || '';
    if (description.length <= 180) {
      return description;
    }

    return `${description.slice(0, 180)}...`;
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

  getStatusIcon(status: number): string {
    switch (status) {
      case TaskStatus.Done:
        return 'check_circle';
      case TaskStatus.Blocked:
        return 'block';
      case TaskStatus.Waiting:
        return 'hourglass_top';
      case TaskStatus.InProgress:
        return 'pending';
      case TaskStatus.ToDo:
      default:
        return 'radio_button_unchecked';
    }
  }

  getStatusClass(status: number): string {
    switch (status) {
      case TaskStatus.Done:
        return 'status-done';
      case TaskStatus.InProgress:
        return 'status-in-progress';
      case TaskStatus.Blocked:
        return 'status-blocked';
      case TaskStatus.Waiting:
        return 'status-waiting';
      case TaskStatus.ToDo:
      default:
        return 'status-todo';
    }
  }

  onOpenFullDetails(): void {
    this.router.navigate(['/tasks', this.task.id]);
    this.dialogRef.close();
  }
}

