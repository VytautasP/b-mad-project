import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { TaskService } from '../services/task.service';
import { Task, TaskPriority, TaskStatus, TaskType } from '../../../shared/models/task.model';

@Component({
  selector: 'app-task-list',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatChipsModule
  ],
  templateUrl: './task-list.component.html',
  styleUrl: './task-list.component.scss'
})
export class TaskListComponent implements OnInit {
  private readonly taskService = inject(TaskService);
  
  tasks$: Observable<Task[]>;
  isLoading = true;
  displayedColumns: string[] = ['name', 'dueDate', 'priority', 'status', 'type'];
  
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
}
