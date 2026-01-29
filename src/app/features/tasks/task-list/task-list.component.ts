import { Component, inject, OnInit, signal, ChangeDetectionStrategy, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatBadgeModule } from '@angular/material/badge';
import { Observable, Subject } from 'rxjs';
import { map, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { TaskService } from '../services/task.service';
import { Task, TaskPriority, TaskStatus, TaskType } from '../../../shared/models/task.model';
import { TaskFormComponent } from '../task-form/task-form.component';
import { TaskDetailDialog } from '../task-detail-dialog/task-detail-dialog';
import { ConfirmationDialogComponent, ConfirmationDialogData } from '../../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { AssigneeList } from '../components/assignee-list/assignee-list';

@Component({
  selector: 'app-task-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatTableModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatDialogModule,
    MatSnackBarModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonToggleModule,
    MatBadgeModule,
    AssigneeList
  ],
  templateUrl: './task-list.component.html',
  styleUrl: './task-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TaskListComponent implements OnInit, OnDestroy {
  private readonly taskService = inject(TaskService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroy$ = new Subject<void>();
  
  tasks$: Observable<Task[]>;
  isLoading = signal(true);
  displayedColumns: string[] = ['name', 'assignees', 'dueDate', 'priority', 'status', 'type', 'actions'];
  
  // Search and filter controls
  searchControl = new FormControl('');
  statusFilterControl = new FormControl<TaskStatus | null>(null);
  
  // Filter state
  searchTerm = '';
  statusFilter: TaskStatus | null = null;
  showMyTasksOnly: boolean = false;
  myTasksCount = signal(0);
  totalTaskCount = signal(0);
  filteredTaskCount = signal(0);
  
  TaskPriority = TaskPriority;
  TaskStatus = TaskStatus;
  TaskType = TaskType;
  
  // Status filter options
  statusOptions = [
    { value: null, label: 'All' },
    { value: TaskStatus.ToDo, label: 'To Do' },
    { value: TaskStatus.InProgress, label: 'In Progress' },
    { value: TaskStatus.Blocked, label: 'Blocked' },
    { value: TaskStatus.Waiting, label: 'Waiting' },
    { value: TaskStatus.Done, label: 'Done' }
  ];

  constructor() {
    // Subscribe to tasks with sorting
    this.tasks$ = this.taskService.tasks$.pipe(
      map(tasks => this.sortTasksByDate(tasks)),
      map(tasks => {
        this.filteredTaskCount.set(tasks.length);
        return tasks;
      })
    );
  }

  ngOnInit(): void {
    this.loadTasks();
    this.setupSearchDebounce();
    this.setupStatusFilter();
    this.loadMyTasksCount();
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  private setupSearchDebounce(): void {
    this.searchControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(searchTerm => {
      this.searchTerm = searchTerm || '';
      this.loadTasks();
    });
  }
  
  private setupStatusFilter(): void {
    this.statusFilterControl.valueChanges.pipe(
      takeUntil(this.destroy$)
    ).subscribe(status => {
      this.statusFilter = status;
      this.loadTasks();
    });
  }

  loadTasks(): void {
    this.isLoading.set(true);
    this.taskService.getTasks(this.searchTerm, this.statusFilter ?? undefined, this.showMyTasksOnly).subscribe({
      next: (tasks) => {
        console.log('Tasks loaded successfully:', tasks);
        this.isLoading.set(false);
        console.log('Loading state set to false, tasks count:', tasks.length);
      },
      error: (error) => {
        console.error('Failed to load tasks:', error);
        this.isLoading.set(false);
        this.snackBar.open('Failed to load tasks', 'Close', {
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'top'
        });
      }
    });
  }
  
  loadMyTasksCount(): void {
    this.taskService.getMyTasksCount().subscribe({
      next: (count) => {
        this.myTasksCount.set(count);
      },
      error: (error) => {
        console.error('Failed to load my tasks count:', error);
      }
    });
  }
  
  toggleMyTasks(): void {
    this.showMyTasksOnly = !this.showMyTasksOnly;
    this.loadTasks();
  }
  
  clearSearch(): void {
    this.searchControl.setValue('');
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

  onViewDetails(task: Task): void {
    this.dialog.open(TaskDetailDialog, {
      width: '700px',
      maxWidth: '90vw',
      data: { task }
    });
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
