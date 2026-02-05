import { Component, inject, OnInit, AfterViewInit, ViewChild, ElementRef, signal, ChangeDetectionStrategy, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Timeline } from 'vis-timeline/standalone';
import { DataSet } from 'vis-data';
import { TaskService } from '../services/task.service';
import { Task, TaskStatus } from '../../../shared/models/task.model';

@Component({
  selector: 'app-timeline',
  standalone: true,
  imports: [
    CommonModule,
    MatProgressSpinnerModule,
    MatProgressBarModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatIconModule,
    MatCardModule
  ],
  templateUrl: './timeline.html',
  styleUrl: './timeline.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TimelineComponent implements OnInit, AfterViewInit, OnDestroy {
  private readonly taskService = inject(TaskService);
  private readonly destroy$ = new Subject<void>();
  
  @ViewChild('timelineContainer', { static: false }) timelineContainer?: ElementRef<HTMLDivElement>;
  
  tasks = signal<Task[]>([]);
  isLoading = signal(false);
  viewMode = signal<'day' | 'week' | 'month'>('week');
  
  private timelineInstance?: Timeline;
  private startDate: Date = new Date();
  private endDate: Date = new Date();

  ngOnInit(): void {
    // Calculate default date range (current month)
    const now = new Date();
    this.startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    this.endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    // Load timeline data
    this.loadTimelineData(this.startDate, this.endDate);
  }

  ngAfterViewInit(): void {
    // Gantt will be initialized after data loads
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Load timeline data from API
   */
  loadTimelineData(start: Date, end: Date): void {
    this.isLoading.set(true);
    
    const params = {
      startDate: start.toISOString(),
      endDate: end.toISOString()
    };
    
    this.taskService.getTimelineTasks(params)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (tasks) => {
          // Filter tasks that have due dates
          const tasksWithDueDates = tasks.filter(t => t.dueDate != null);
          this.tasks.set(tasksWithDueDates);
          this.isLoading.set(false);
          
          console.log('Timeline tasks loaded:', tasksWithDueDates.length);
          
          // Initialize or refresh Timeline after data loads
          if (tasksWithDueDates.length > 0) {
            setTimeout(() => this.initializeTimeline(), 0);
          }
        },
        error: (error) => {
          console.error('Failed to load timeline data:', error);
          this.isLoading.set(false);
        }
      });
  }

  /**
   * Initialize Timeline chart with task data
   */
  private initializeTimeline(): void {
    if (!this.timelineContainer) {
      console.error('Timeline container not found');
      return;
    }

    const container = this.timelineContainer.nativeElement;
    
    // Transform tasks to vis-timeline format
    const timelineItems = this.transformTasksToTimelineFormat(this.tasks());
    
    if (timelineItems.length === 0) {
      console.warn('No tasks to display');
      return;
    }

    console.log('Initializing Timeline with tasks:', timelineItems);

    // Create DataSet
    const items = new DataSet(timelineItems);

    // Timeline options
    const options: any = {
      start: this.startDate,
      end: this.endDate,
      orientation: 'top',
      showCurrentTime: true,
      zoomMin: 1000 * 60 * 60 * 24, // 1 day
      zoomMax: 1000 * 60 * 60 * 24 * 365, // 1 year
      editable: false,
      margin: {
        item: 10,
        axis: 5
      }
    };

    try {
      // Destroy existing timeline if it exists
      if (this.timelineInstance) {
        this.timelineInstance.destroy();
      }
      
      // Create new timeline
      this.timelineInstance = new Timeline(container, items, options);
      
      console.log('Timeline initialized successfully');
      
      // Fit to view based on current view mode
      setTimeout(() => this.fitTimelineToView(), 100);
    } catch (error) {
      console.error('Failed to initialize Timeline:', error);
    }
  }

  /**
   * Transform Task[] to vis-timeline format
   */
  private transformTasksToTimelineFormat(tasks: Task[]): any[] {
    return tasks.map(task => {
      // Use createdDate as start, dueDate as end
      const start = new Date(task.createdDate);
      const end = task.dueDate ? new Date(task.dueDate) : new Date(start);
      
      // Ensure end date is at least 1 day after start
      if (end <= start) {
        end.setDate(start.getDate() + 1);
      }
      
      return {
        id: task.id,
        content: task.name,
        start: start,
        end: end,
        type: 'range',
        className: this.getStatusClass(task.status),
        title: `${task.name} - ${this.getStatusLabel(task.status)}`
      };
    });
  }

  /**
   * Get CSS class based on task status for color coding
   */
  getStatusClass(status: TaskStatus): string {
    switch (status) {
      case TaskStatus.ToDo:
        return 'status-todo';
      case TaskStatus.InProgress:
        return 'status-in-progress';
      case TaskStatus.Blocked:
        return 'status-blocked';
      case TaskStatus.Waiting:
        return 'status-waiting';
      case TaskStatus.Done:
        return 'status-done';
      default:
        return 'status-todo';
    }
  }

  /**
   * Get status label for display
   */
  getStatusLabel(status: TaskStatus): string {
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
        return 'Unknown';
    }
  }



  /**
   * Change view mode and refresh timeline
   */
  changeViewMode(mode: 'day' | 'week' | 'month'): void {
    this.viewMode.set(mode);
    this.fitTimelineToView();
  }

  /**
   * Fit timeline to appropriate view range
   */
  private fitTimelineToView(): void {
    if (!this.timelineInstance) {
      return;
    }

    const now = new Date();
    let start: Date;
    let end: Date;

    switch (this.viewMode()) {
      case 'day':
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 3);
        end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7);
        break;
      case 'week':
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
        end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 21);
        break;
      case 'month':
        start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        end = new Date(now.getFullYear(), now.getMonth() + 2, 0);
        break;
      default:
        start = this.startDate;
        end = this.endDate;
    }

    this.timelineInstance.setWindow(start, end, { animation: true });
  }
}

