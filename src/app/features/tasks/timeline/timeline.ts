import { Component, inject, OnInit, AfterViewInit, ViewChild, ElementRef, signal, ChangeDetectionStrategy, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Timeline } from 'vis-timeline/standalone';
import { DataSet } from 'vis-data';
import { TaskService } from '../services/task.service';
import { Task, TaskStatus } from '../../../shared/models/task.model';
import { TaskDetailDialog, TaskDetailDialogData } from '../task-detail-dialog/task-detail-dialog';
import { TimelineEmptyStateComponent } from './timeline-empty-state/timeline-empty-state';

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
    MatCardModule,
    TimelineEmptyStateComponent
  ],
  templateUrl: './timeline.html',
  styleUrl: './timeline.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TimelineComponent implements OnInit, AfterViewInit, OnDestroy {
  private readonly taskService = inject(TaskService);
  private readonly dialog = inject(MatDialog);
  private readonly breakpointObserver = inject(BreakpointObserver);
  private readonly router = inject(Router);
  private readonly destroy$ = new Subject<void>();
  
  @ViewChild('timelineContainer', { static: false }) timelineContainer?: ElementRef<HTMLDivElement>;
  
  tasks = signal<Task[]>([]);
  isLoading = signal(false);
  isUpdating = signal(false);
  viewMode = signal<'day' | 'week' | 'month'>('week');
  isMobile = signal(false);
  noDueDateCount = signal(0);
  invalidDueDateCount = signal(0);
  
  private timelineInstance?: Timeline;
  private startDate: Date = new Date();
  private endDate: Date = new Date();

  ngOnInit(): void {
    // Detect mobile device
    this.breakpointObserver.observe([Breakpoints.Handset, Breakpoints.Tablet])
      .pipe(takeUntil(this.destroy$))
      .subscribe(result => {
        this.isMobile.set(result.matches);
      });
    
    // Restore zoom level from session storage
    const savedZoom = sessionStorage.getItem('timeline-zoom');
    if (savedZoom && (savedZoom === 'day' || savedZoom === 'week' || savedZoom === 'month')) {
      this.viewMode.set(savedZoom as 'day' | 'week' | 'month');
    }
    
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
          const { validTimelineTasks, noDueDateCount, invalidDueDateCount } = this.validateDueDateCoverage(tasks);
          this.noDueDateCount.set(noDueDateCount);
          this.invalidDueDateCount.set(invalidDueDateCount);
          this.tasks.set(validTimelineTasks);
          this.isLoading.set(false);
          
          console.log('Timeline tasks loaded:', validTimelineTasks.length);
          
          // Initialize or refresh Timeline after data loads
          if (validTimelineTasks.length > 0) {
            setTimeout(() => this.initializeTimeline(), 0);
          }
        },
        error: (error) => {
          console.error('Failed to load timeline data:', error);
          this.isLoading.set(false);
        }
      });
  }

  onAddDueDateCta(): void {
    this.router.navigate(['/dashboard'], {
      queryParams: {
        openTaskForm: 'true',
        focusField: 'dueDate',
        returnTo: 'timeline'
      }
    });
  }

  private validateDueDateCoverage(tasks: Task[]): {
    validTimelineTasks: Task[];
    noDueDateCount: number;
    invalidDueDateCount: number;
  } {
    let noDueDateCount = 0;
    let invalidDueDateCount = 0;
    const validTimelineTasks: Task[] = [];

    tasks.forEach((task) => {
      if (!task.dueDate) {
        noDueDateCount += 1;
        return;
      }

      const dueDate = new Date(task.dueDate);
      if (Number.isNaN(dueDate.getTime())) {
        invalidDueDateCount += 1;
        return;
      }

      validTimelineTasks.push(task);
    });

    return { validTimelineTasks, noDueDateCount, invalidDueDateCount };
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
      editable: {
        updateTime: !this.isMobile(), // Disable drag on mobile
        updateGroup: false,
        add: false,
        remove: false,
        overrideItems: false
      },
      snap: (date: Date) => {
        // Snap to day boundaries
        const snapped = new Date(date);
        snapped.setHours(0, 0, 0, 0);
        return snapped;
      },
      margin: {
        item: this.isMobile() ? 5 : 10,
        axis: this.isMobile() ? 3 : 5
      },
      onMoving: (item: any, callback: (item: any) => void) => {
        // Check if task is draggable before allowing move
        const task = this.tasks().find(t => t.id === item.id);
        if (!task || !this.isTaskDraggable(task)) {
          callback(null); // Cancel the move
          return;
        }
        
        // Apply visual feedback (semi-transparent)
        item.className = item.className + ' dragging';
        callback(item);
      },
      onMove: (item: any, callback: (item: any) => void) => {
        // Validate and update task via API
        this.onTaskDragEnd(item.id, new Date(item.start), new Date(item.end))
          .then((success: boolean) => {
            if (success) {
              callback(item); // Accept the change
            } else {
              callback(null); // Revert the change
            }
          });
      }
    };

    try {
      // Destroy existing timeline if it exists
      if (this.timelineInstance) {
        this.timelineInstance.destroy();
      }
      
      // Create new timeline
      this.timelineInstance = new Timeline(container, items, options);
      
      // Register click event handler
      this.timelineInstance.on('click', (properties) => {
        if (properties.item) {
          this.onTaskClick(properties.item);
        }
      });
      
      console.log('Timeline initialized successfully');
      
      // Fit to view based on current view mode
      setTimeout(() => this.fitTimelineToView(), 100);
    } catch (error) {
      console.error('Failed to initialize Timeline:', error);
    }
  }

  /**
   * Handle task bar click - open detail dialog
   */
  onTaskClick(taskId: string): void {
    const task = this.tasks().find(t => t.id === taskId);
    if (!task) {
      console.error('Task not found:', taskId);
      return;
    }

    // Open task detail dialog
    const dialogRef = this.dialog.open(TaskDetailDialog, {
      width: '800px',
      maxWidth: '95vw',
      data: {
        task,
        openerElement: this.timelineContainer?.nativeElement ?? null
      } as TaskDetailDialogData,
      disableClose: true,
      autoFocus: false,
      panelClass: 'task-detail-dialog'
    });

    // Refresh timeline when dialog closes (in case task was updated)
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        // Reload timeline data to reflect any changes
        this.loadTimelineData(this.startDate, this.endDate);
      }
    });
  }

  /**
   * Handle task drag end - update task due date via API
   */
  private async onTaskDragEnd(taskId: string, newStartDate: Date, newEndDate: Date): Promise<boolean> {
    const task = this.tasks().find(t => t.id === taskId);
    if (!task) {
      console.error('Task not found:', taskId);
      return false;
    }

    // Validate: newEndDate >= CreatedDate
    const createdDate = new Date(task.createdDate);
    if (newEndDate < createdDate) {
      this.showError('Due date cannot be before creation date');
      return false;
    }

    // Check parent task constraint
    if (task.parentTaskId) {
      const parentTask = this.tasks().find(t => t.id === task.parentTaskId);
      if (parentTask && parentTask.dueDate) {
        const parentDueDate = new Date(parentTask.dueDate);
        if (newEndDate > parentDueDate) {
          const confirmed = await this.showParentWarning();
          if (!confirmed) {
            return false;
          }
        }
      }
    }

    // Save scroll position
    const container = this.timelineContainer?.nativeElement;
    const scrollLeft = container ? container.scrollLeft : 0;

    // Update task via API
    this.isUpdating.set(true);
    
    return new Promise<boolean>((resolve) => {
      this.taskService.updateTask(taskId, { dueDate: newEndDate })
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (updatedTask) => {
            // Update local tasks array
            const currentTasks = this.tasks();
            const index = currentTasks.findIndex(t => t.id === taskId);
            if (index !== -1) {
              const newTasks = [...currentTasks];
              newTasks[index] = updatedTask;
              this.tasks.set(newTasks);
            }
            
            this.isUpdating.set(false);
            
            // Restore scroll position
            setTimeout(() => {
              if (container) {
                container.scrollLeft = scrollLeft;
              }
            }, 0);
            
            resolve(true);
          },
          error: (error) => {
            console.error('Failed to update task:', error);
            this.showError('Failed to update task date');
            this.isUpdating.set(false);
            resolve(false);
          }
        });
    });
  }

  /**
   * Check if task is draggable (not completed)
   */
  private isTaskDraggable(task: Task): boolean {
    return task.status !== TaskStatus.Done;
  }

  /**
   * Show error message
   */
  private showError(message: string): void {
    // TODO: Use notification service when available
    alert(message);
  }

  /**
   * Show warning dialog for parent task constraint
   */
  private async showParentWarning(): Promise<boolean> {
    return confirm('This task exceeds parent deadline. Continue anyway?');
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
      
      // Add 'locked' class for completed tasks
      const statusClass = this.getStatusClass(task.status);
      const lockedClass = task.status === TaskStatus.Done ? 'locked' : '';
      const className = `${statusClass} ${lockedClass}`.trim();
      
      return {
        id: task.id,
        content: task.status === TaskStatus.Done ? `🔒 ${task.name}` : task.name,
        start: start,
        end: end,
        type: 'range',
        className: className,
        title: `${task.name} - ${this.getStatusLabel(task.status)}${task.status === TaskStatus.Done ? ' (Locked)' : ''}`,
        editable: this.isTaskDraggable(task)
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
    
    // Persist zoom level in session storage
    sessionStorage.setItem('timeline-zoom', mode);
    
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

  /**
   * Handle keyboard shortcuts for zoom and scroll
   */
  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent): void {
    // Only handle if timeline is visible and focused
    if (!this.timelineInstance || this.tasks().length === 0) {
      return;
    }

    // Zoom in: '+' or '='
    if (event.key === '+' || event.key === '=') {
      event.preventDefault();
      this.zoomIn();
    }
    // Zoom out: '-'
    else if (event.key === '-') {
      event.preventDefault();
      this.zoomOut();
    }
    // Scroll left: ArrowLeft
    else if (event.key === 'ArrowLeft' && !event.ctrlKey && !event.shiftKey) {
      event.preventDefault();
      this.scrollTimeline('left');
    }
    // Scroll right: ArrowRight
    else if (event.key === 'ArrowRight' && !event.ctrlKey && !event.shiftKey) {
      event.preventDefault();
      this.scrollTimeline('right');
    }
  }

  /**
   * Zoom in (more detail)
   */
  private zoomIn(): void {
    const current = this.viewMode();
    if (current === 'month') {
      this.changeViewMode('week');
    } else if (current === 'week') {
      this.changeViewMode('day');
    }
    // Already at day level (most detailed)
  }

  /**
   * Zoom out (less detail)
   */
  private zoomOut(): void {
    const current = this.viewMode();
    if (current === 'day') {
      this.changeViewMode('week');
    } else if (current === 'week') {
      this.changeViewMode('month');
    }
    // Already at month level (least detailed)
  }

  /**
   * Scroll timeline horizontally
   */
  private scrollTimeline(direction: 'left' | 'right'): void {
    const container = this.timelineContainer?.nativeElement;
    if (!container) {
      return;
    }

    const scrollAmount = 100;
    if (direction === 'left') {
      container.scrollLeft -= scrollAmount;
    } else {
      container.scrollLeft += scrollAmount;
    }
  }
}

