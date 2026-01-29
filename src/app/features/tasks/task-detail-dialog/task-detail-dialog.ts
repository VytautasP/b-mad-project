import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { Task, TaskPriority, TaskStatus, TaskType, TaskAssignmentDto } from '../../../shared/models/task.model';
import { User } from '../../../shared/models/user.model';
import { TaskService } from '../services/task.service';
import { NotificationService } from '../../../core/services/notification.service';
import { AssigneeList } from '../components/assignee-list/assignee-list';
import { UserPicker } from '../components/user-picker/user-picker';

export interface TaskDetailDialogData {
  task: Task;
}

@Component({
  selector: 'app-task-detail-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatChipsModule,
    AssigneeList,
    UserPicker
  ],
  templateUrl: './task-detail-dialog.html',
  styleUrl: './task-detail-dialog.css',
})
export class TaskDetailDialog implements OnInit {
  private readonly dialogRef = inject(MatDialogRef<TaskDetailDialog>);
  private readonly data: TaskDetailDialogData = inject(MAT_DIALOG_DATA);
  private readonly taskService = inject(TaskService);
  private readonly notificationService = inject(NotificationService);
  
  task = signal<Task>(this.data.task);
  assignees = signal<TaskAssignmentDto[]>(this.data.task.assignees || []);
  showUserPicker = signal(false);
  isLoadingAssignees = signal(false);
  
  TaskPriority = TaskPriority;
  TaskStatus = TaskStatus;
  TaskType = TaskType;
  
  ngOnInit(): void {
    this.loadAssignees();
  }
  
  loadAssignees(): void {
    this.isLoadingAssignees.set(true);
    this.taskService.getTaskAssignees(this.task().id).subscribe({
      next: (assignees) => {
        this.assignees.set(assignees);
        this.isLoadingAssignees.set(false);
      },
      error: (error) => {
        console.error('Failed to load assignees:', error);
        this.isLoadingAssignees.set(false);
      }
    });
  }
  
  toggleUserPicker(): void {
    this.showUserPicker.update(value => !value);
  }
  
  onAddAssignee(user: User): void {
    this.taskService.assignUser(this.task().id, user.id).subscribe({
      next: () => {
        this.notificationService.showSuccess('User assigned successfully');
        this.loadAssignees();
        this.showUserPicker.set(false);
      },
      error: (error) => {
        const errorMessage = this.getErrorMessage(error);
        this.notificationService.showError(errorMessage);
      }
    });
  }
  
  onRemoveAssignee(userId: string): void {
    // Simple confirmation
    if (!confirm('Remove this user from the task?')) {
      return;
    }
    
    this.taskService.unassignUser(this.task().id, userId).subscribe({
      next: () => {
        this.notificationService.showSuccess('User unassigned successfully');
        this.loadAssignees();
      },
      error: (error) => {
        const errorMessage = this.getErrorMessage(error);
        this.notificationService.showError(errorMessage);
      }
    });
  }
  
  getExcludedUserIds(): string[] {
    return this.assignees().map(a => a.userId);
  }
  
  getPriorityLabel(priority: number): string {
    return TaskPriority[priority];
  }
  
  getStatusLabel(status: number): string {
    return TaskStatus[status];
  }
  
  getTypeLabel(type: number): string {
    return TaskType[type];
  }
  
  formatDate(date: Date | null): string {
    if (!date) return 'No due date';
    return new Date(date).toLocaleDateString();
  }
  
  onClose(): void {
    this.dialogRef.close();
  }
  
  private getErrorMessage(error: any): string {
    if (error.status === 404) {
      return 'User not found';
    } else if (error.status === 403) {
      return "You don't have permission to modify assignments";
    } else {
      return 'Assignment failed. Please try again.';
    }
  }
}

