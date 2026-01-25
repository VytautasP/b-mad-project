import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { TaskService } from '../services/task.service';
import { Task, TaskPriority, TaskStatus, TaskType } from '../../../shared/models/task.model';
import { TaskFormComponent } from '../task-form/task-form.component';
import { ConfirmationDialogComponent, ConfirmationDialogData } from '../../../shared/components/confirmation-dialog/confirmation-dialog.component';

@Component({
  selector: 'app-task-list',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatDialogModule,
    MatSnackBarModule
  ],
  templateUrl: './task-list.component.html',
  styleUrl: './task-list.component.scss'
})
export class TaskListComponent implements OnInit {
  private readonly taskService = inject(TaskService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  
  tasks$: Observable<Task[]>;
  isLoading = true;
  displayedColumns: string[] = ['name', 'dueDate', 'priority', 'status', 'type', 'actions'];
  
  TaskPriority = TaskPriority;
  TaskStatus = TaskStatus;
  TaskType = TaskType;

  constructor() {
    // Subscribe to tasks with sorting
    this.tasks$ = this.taskService.tasks$.pipe(
      map(tasks => this.sortTasksByDate(tasks))
    );
  }

  ngOnInit(): void {
    this.loadTasks();
  }

  loadTasks(): void {
    this.isLoading = true;
    this.taskService.getTasks().subscribe({
      next: () => {
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Failed to load tasks:', error);
        this.isLoading = false;
      }
    });
  }

  private sortTasksByDate(tasks: Task[]): Task[] {
    return [...tasks].sort((a, b) => {
      const dateA = new Date(a.createdDate).getTime();
      const dateB = new Date(b.createdDate).getTime();
      return dateB - dateA; // Newest first
    });
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

  getPriorityColor(priority: number): string {
    switch (priority) {
      case TaskPriority.Critical: return 'warn';
      case TaskPriority.High: return 'accent';
      case TaskPriority.Medium: return 'primary';
      case TaskPriority.Low: return '';
      default: return '';
    }
  }

  getStatusColor(status: number): string {
    switch (status) {
      case TaskStatus.Done: return 'primary';
      case TaskStatus.InProgress: return 'accent';
      case TaskStatus.Blocked: return 'warn';
      default: return '';
    }
  }

  formatDate(date: Date | null): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString();
  }

  onEdit(task: Task): void {
    const dialogRef = this.dialog.open(TaskFormComponent, {
      width: '600px',
      data: { mode: 'edit', task }
    });

    dialogRef.componentInstance.mode = 'edit';
    dialogRef.componentInstance.taskToEdit = task;

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadTasks();
        this.snackBar.open('Task updated successfully', 'Close', {
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'top'
        });
      }
    });
  }

  onDelete(task: Task): void {
    const dialogData: ConfirmationDialogData = {
      title: 'Delete Task',
      message: 'Are you sure you want to delete this task? This action cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Cancel'
    };

    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '400px',
      data: dialogData
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed === true) {
        this.taskService.deleteTask(task.id).subscribe({
          next: () => {
            this.loadTasks();
            this.snackBar.open('Task deleted successfully', 'Close', {
              duration: 3000,
              horizontalPosition: 'end',
              verticalPosition: 'top'
            });
          },
          error: (error) => {
            const errorMessage = error.error?.message || 'Failed to delete task. Please try again.';
            this.snackBar.open(errorMessage, 'Close', {
              duration: 5000,
              horizontalPosition: 'end',
              verticalPosition: 'top'
            });
          }
        });
      }
    });
  }
}
