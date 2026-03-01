import { Component, inject, OnInit, signal, ChangeDetectionStrategy, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatSortModule, MatSort, Sort } from '@angular/material/sort';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatMenuModule } from '@angular/material/menu';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';
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
import { Router, ActivatedRoute } from '@angular/router';
import { Subject, Subscription } from 'rxjs';
import { takeUntil, take } from 'rxjs/operators';
import { TaskService } from '../services/task.service';
import { Task, TaskPriority, TaskStatus, TaskType, TaskFilters, PaginatedResult } from '../../../shared/models/task.model';
import { TaskFormComponent } from '../task-form/task-form.component';
import { TaskDetailDialog } from '../task-detail-dialog/task-detail-dialog';
import { ConfirmationDialogComponent, ConfirmationDialogData } from '../../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { AssigneeList } from '../components/assignee-list/assignee-list';
import { TaskFiltersComponent, User } from './components/task-filters/task-filters.component';
import { TimerStateService, TimerState } from '../../../core/services/state/timer-state.service';
import { formatDuration, formatDurationWithTotal } from '../../../shared/utils/time.utils';
import { getDialogAnimationDurations } from '../../../shared/utils/motion.utils';

@Component({
  selector: 'app-task-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatTableModule,
    MatSortModule,
    MatCheckboxModule,
    MatMenuModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatProgressBarModule,
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
    AssigneeList,
    TaskFiltersComponent
  ],
  templateUrl: './task-list.component.html',
  styleUrl: './task-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TaskListComponent implements OnInit, OnDestroy {
  private readonly taskService = inject(TaskService);
  private readonly timerService = inject(TimerStateService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroy$ = new Subject<void>();
  private loadSubscription?: Subscription;
  
  @ViewChild(MatSort) sort?: MatSort;

  // Task data
  tasks = signal<Task[]>([]);
  totalCount = signal(0);
  isLoading = signal(false);
  
  // Table columns — Figma order: Checkbox → Status → Task Name → Priority → Due Date → Time Logged → Actions
  displayedColumns: string[] = ['select', 'status', 'name', 'priority', 'dueDate', 'timeLogged', 'actions'];
  
  // Checkbox selection state
  selectedTasks = new Set<string>();
  
  // Quick-filter tab state
  quickFilter: 'all' | 'pending' | 'done' = 'all';
  
  // Task count signals for tab badges
  allTasksCount = signal(0);
  pendingTasksCount = signal(0);
  doneTasksCount = signal(0);
  
  // Filter panel visibility
  isFilterPanelVisible = signal(false);
  
  // Timer state
  currentTimerState: TimerState | null = null;
  
  // Filter, sort, and pagination state
  filters: TaskFilters = {};
  sortBy: string = 'createdDate';
  sortOrder: 'asc' | 'desc' = 'desc';
  page: number = 1;
  pageSize: number = 50;
  
  // Users for filter dropdown
  users = signal<User[]>([]);
  
  TaskPriority = TaskPriority;
  TaskStatus = TaskStatus;
  TaskType = TaskType;

  ngOnInit(): void {
    // Subscribe to timer state
    this.timerService.timer$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(state => {
      this.currentTimerState = state;
    });

    // Parse query parameters to restore state
    this.route.queryParams.pipe(take(1)).subscribe(params => {
      this.parseQueryParams(params);
      this.loadTasks();
      this.refreshTaskCounts();
    });

    // Load users for filter dropdown (mock for now - would come from UserService)
    this.loadUsers();
  }
  
  ngOnDestroy(): void {
    this.loadSubscription?.unsubscribe();
    this.destroy$.next();
    this.destroy$.complete();
  }

  private parseQueryParams(params: any): void {
    // Parse filters
    this.filters = {
      assigneeId: params['assigneeId'] ? (Array.isArray(params['assigneeId']) ? params['assigneeId'] : [params['assigneeId']]) : undefined,
      status: params['status'] ? this.parseEnumArray(params['status'], TaskStatus) : undefined,
      priority: params['priority'] ? this.parseEnumArray(params['priority'], TaskPriority) : undefined,
      type: params['type'] ? this.parseEnumArray(params['type'], TaskType) : undefined,
      dueDateFrom: params['dueDateFrom'] ? new Date(params['dueDateFrom']) : undefined,
      dueDateTo: params['dueDateTo'] ? new Date(params['dueDateTo']) : undefined,
      searchTerm: params['searchTerm'] || undefined
    };

    // Parse sorting
    this.sortBy = params['sortBy'] || 'createdDate';
    this.sortOrder = params['sortOrder'] === 'asc' ? 'asc' : 'desc';

    // Parse pagination
    this.page = params['page'] ? parseInt(params['page'], 10) : 1;
    this.pageSize = params['pageSize'] ? parseInt(params['pageSize'], 10) : 50;
  }

  private parseEnumArray(value: any, enumType: any): number[] {
    const values = Array.isArray(value) ? value : [value];
    return values.map(v => parseInt(v, 10)).filter(v => !isNaN(v));
  }

  private updateQueryParams(): void {
    const queryParams: any = {
      page: this.page,
      pageSize: this.pageSize,
      sortBy: this.sortBy,
      sortOrder: this.sortOrder
    };

    // Add filters to query params
    if (this.filters.assigneeId && this.filters.assigneeId.length > 0) {
      queryParams['assigneeId'] = this.filters.assigneeId;
    }
    if (this.filters.status && this.filters.status.length > 0) {
      queryParams['status'] = this.filters.status;
    }
    if (this.filters.priority && this.filters.priority.length > 0) {
      queryParams['priority'] = this.filters.priority;
    }
    if (this.filters.type && this.filters.type.length > 0) {
      queryParams['type'] = this.filters.type;
    }
    if (this.filters.dueDateFrom) {
      queryParams['dueDateFrom'] = this.filters.dueDateFrom.toISOString();
    }
    if (this.filters.dueDateTo) {
      queryParams['dueDateTo'] = this.filters.dueDateTo.toISOString();
    }
    if (this.filters.searchTerm) {
      queryParams['searchTerm'] = this.filters.searchTerm;
    }

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      queryParamsHandling: 'merge'
    });
  }

  private loadUsers(): void {
    // TODO: Load from UserService when available
    // For now, mock data
    this.users.set([]);
  }

  loadTasks(): void {
    this.loadSubscription?.unsubscribe();
    this.isLoading.set(true);
    
    // Merge quick-filter status with existing advanced filters
    const effectiveFilters = this.getEffectiveFilters();
    
    this.loadSubscription = this.taskService.getTasksPaginated(
      effectiveFilters,
      this.sortBy,
      this.sortOrder,
      this.page,
      this.pageSize
    ).subscribe({
      next: (result: PaginatedResult<Task>) => {
        this.tasks.set(result.items);
        this.totalCount.set(result.totalCount);
        this.isLoading.set(false);
        this.selectedTasks.clear();
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

  private getEffectiveFilters(): TaskFilters {
    const filters = { ...this.filters };
    if (this.quickFilter === 'pending') {
      filters.status = [TaskStatus.ToDo, TaskStatus.InProgress, TaskStatus.Blocked, TaskStatus.Waiting];
    } else if (this.quickFilter === 'done') {
      filters.status = [TaskStatus.Done];
    }
    return filters;
  }

  refreshTaskCounts(): void {
    this.taskService.getTasksPaginated({}, 'createdDate', 'desc', 1, 1).pipe(
      take(1), takeUntil(this.destroy$)
    ).subscribe(result => this.allTasksCount.set(result.totalCount));

    this.taskService.getTasksPaginated(
      { status: [TaskStatus.ToDo, TaskStatus.InProgress, TaskStatus.Blocked, TaskStatus.Waiting] },
      'createdDate', 'desc', 1, 1
    ).pipe(take(1), takeUntil(this.destroy$)).subscribe(result => this.pendingTasksCount.set(result.totalCount));

    this.taskService.getTasksPaginated(
      { status: [TaskStatus.Done] },
      'createdDate', 'desc', 1, 1
    ).pipe(take(1), takeUntil(this.destroy$)).subscribe(result => this.doneTasksCount.set(result.totalCount));
  }

  trackByTaskId(_index: number, task: Task): string {
    return task.id;
  }

  onFiltersChanged(filters: TaskFilters): void {
    this.filters = filters;
    this.page = 1; // Reset to first page when filters change
    this.updateQueryParams();
    this.loadTasks();
  }

  onFiltersCleared(): void {
    this.filters = {};
    this.page = 1;
    this.updateQueryParams();
    this.loadTasks();
  }

  onQuickFilterChange(filter: 'all' | 'pending' | 'done'): void {
    this.quickFilter = filter;
    this.page = 1;
    this.selectedTasks.clear();
    this.updateQueryParams();
    this.loadTasks();
  }

  toggleFilterPanel(): void {
    this.isFilterPanelVisible.update(v => !v);
  }

  onSortChange(sort: Sort): void {
    this.sortBy = sort.active;
    this.sortOrder = sort.direction === 'asc' ? 'asc' : 'desc';
    this.updateQueryParams();
    this.loadTasks();
  }

  // Custom pagination
  get paginationStart(): number {
    if (this.totalCount() === 0) return 0;
    return (this.page - 1) * this.pageSize + 1;
  }

  get paginationEnd(): number {
    return Math.min(this.page * this.pageSize, this.totalCount());
  }

  get totalPages(): number {
    return Math.ceil(this.totalCount() / this.pageSize);
  }

  get hasPreviousPage(): boolean {
    return this.page > 1;
  }

  get hasNextPage(): boolean {
    return this.page < this.totalPages;
  }

  onPreviousPage(): void {
    if (this.hasPreviousPage) {
      this.page--;
      this.updateQueryParams();
      this.loadTasks();
    }
  }

  onNextPage(): void {
    if (this.hasNextPage) {
      this.page++;
      this.updateQueryParams();
      this.loadTasks();
    }
  }

  // Checkbox selection
  isSelected(taskId: string): boolean {
    return this.selectedTasks.has(taskId);
  }

  isAllSelected(): boolean {
    return this.tasks().length > 0 && this.selectedTasks.size === this.tasks().length;
  }

  toggleSelection(taskId: string): void {
    if (this.selectedTasks.has(taskId)) {
      this.selectedTasks.delete(taskId);
    } else {
      this.selectedTasks.add(taskId);
    }
  }

  toggleAllSelection(): void {
    if (this.isAllSelected()) {
      this.selectedTasks.clear();
    } else {
      this.tasks().forEach(task => this.selectedTasks.add(task.id));
    }
  }

  hasActiveFilters(): boolean {
    return Object.keys(this.filters).some(key => {
      const value = this.filters[key as keyof TaskFilters];
      return value !== undefined && value !== null && 
             (Array.isArray(value) ? value.length > 0 : true);
    });
  }

  getPriorityLabel(priority: number): string {
    switch (priority) {
      case TaskPriority.Critical:
        return 'Critical';
      case TaskPriority.High:
        return 'High';
      case TaskPriority.Medium:
        return 'Medium';
      case TaskPriority.Low:
      default:
        return 'Low';
    }
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

  getStatusBadgeClass(status: number): string {
    switch (status) {
      case TaskStatus.Done:
        return 'status-badge status-done';
      case TaskStatus.InProgress:
        return 'status-badge status-in-progress';
      case TaskStatus.Blocked:
        return 'status-badge status-blocked';
      case TaskStatus.Waiting:
        return 'status-badge status-waiting';
      case TaskStatus.ToDo:
      default:
        return 'status-badge status-todo';
    }
  }

  getPriorityIcon(priority: number): string {
    switch (priority) {
      case TaskPriority.Critical:
        return 'keyboard_double_arrow_up';
      case TaskPriority.High:
        return 'arrow_upward';
      case TaskPriority.Medium:
        return 'arrow_forward';
      case TaskPriority.Low:
      default:
        return 'arrow_downward';
    }
  }

  getPriorityClass(priority: number): string {
    switch (priority) {
      case TaskPriority.Critical:
        return 'priority-critical';
      case TaskPriority.High:
        return 'priority-high';
      case TaskPriority.Medium:
        return 'priority-medium';
      case TaskPriority.Low:
      default:
        return 'priority-low';
    }
  }

  formatDate(date: Date | null): string {
    if (!date) return '-';
    const d = new Date(date);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[d.getMonth()]} ${String(d.getDate()).padStart(2, '0')}, ${d.getFullYear()}`;
  }

  onViewDetails(task: Task, event?: Event): void {
    const openerElement = event?.currentTarget instanceof HTMLElement ? event.currentTarget : null;

    this.dialog.open(TaskDetailDialog, {
      width: '700px',
      maxWidth: '90vw',
      disableClose: true,
      autoFocus: false,
      panelClass: 'quick-inspect-dialog-panel',
      ...getDialogAnimationDurations(),
      data: { task, openerElement }
    });
  }

  onCreateTask(): void {
    const dialogRef = this.dialog.open(TaskFormComponent, {
      width: '600px',
      ...getDialogAnimationDurations(),
      data: { mode: 'create' }
    });

    dialogRef.componentInstance.mode = 'create';

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadTasks();
        this.refreshTaskCounts();
        this.snackBar.open('Task created successfully', 'Close', {
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'top'
        });
      }
    });
  }

  onEdit(task: Task): void {
    const dialogRef = this.dialog.open(TaskFormComponent, {
      width: '600px',
      ...getDialogAnimationDurations(),
      data: { mode: 'edit', task }
    });

    dialogRef.componentInstance.mode = 'edit';
    dialogRef.componentInstance.taskToEdit = task;

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadTasks();
        this.refreshTaskCounts();
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
      ...getDialogAnimationDurations(),
      data: dialogData
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed === true) {
        this.taskService.deleteTask(task.id).subscribe({
          next: () => {
            this.loadTasks();
            this.refreshTaskCounts();
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

  onStartTimer(task: Task): void {
    // Check if another timer is running
    if (this.currentTimerState?.isRunning && this.currentTimerState.taskId !== task.id) {
      const dialogData: ConfirmationDialogData = {
        title: 'Switch Timer',
        message: `A timer is already running for "${this.currentTimerState.taskName}". Stop current timer and start new one?`,
        confirmText: 'Switch Timer',
        cancelText: 'Cancel'
      };

      const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
        width: '400px',
        ...getDialogAnimationDurations(),
        data: dialogData
      });

      dialogRef.afterClosed().subscribe(confirmed => {
        if (confirmed === true) {
          // Stop current timer and start new one
          this.timerService.stopTimer();
          this.timerService.startTimer(task.id, task.name);
          this.snackBar.open(`Timer started for "${task.name}"`, 'Close', {
            duration: 3000,
            horizontalPosition: 'end',
            verticalPosition: 'top'
          });
        }
      });
    } else {
      // No timer running, start new one
      this.timerService.startTimer(task.id, task.name);
      this.snackBar.open(`Timer started for "${task.name}"`, 'Close', {
        duration: 3000,
        horizontalPosition: 'end',
        verticalPosition: 'top'
      });
    }
  }

  isTimerRunning(taskId: string): boolean {
    return this.currentTimerState?.isRunning === true && this.currentTimerState?.taskId === taskId;
  }

  isAnotherTimerRunning(taskId: string): boolean {
    return this.currentTimerState?.isRunning === true && this.currentTimerState?.taskId !== taskId;
  }

  /**
   * Format duration using utility function
   */
  formatDuration(minutes: number): string {
    return formatDuration(minutes);
  }

  /**
   * Get formatted time display with visual indicator for parent tasks
   */
  getTimeDisplay(task: Task): string {
    if (!task.totalLoggedMinutes || task.totalLoggedMinutes === 0) {
      return '--';
    }
    return formatDurationWithTotal(task.totalLoggedMinutes, task.childrenLoggedMinutes > 0);
  }

  /**
   * Get tooltip text explaining time breakdown for parent tasks
   */
  getTimeTooltip(task: Task): string {
    if (task.childrenLoggedMinutes > 0) {
      return `Direct: ${formatDuration(task.directLoggedMinutes)} | Children: ${formatDuration(task.childrenLoggedMinutes)} | Total: ${formatDuration(task.totalLoggedMinutes)}`;
    }
    return `Total time logged: ${formatDuration(task.totalLoggedMinutes)}`;
  }
}
