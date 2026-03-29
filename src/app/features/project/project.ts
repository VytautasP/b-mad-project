import { Component, inject, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { TaskService } from '../tasks/services/task.service';
import { Task, TaskStatus, TaskType, PaginatedResult } from '../../shared/models/task.model';
import { TaskFormComponent } from '../tasks/task-form/task-form.component';
import { TaskDetailDialog } from '../tasks/task-detail-dialog/task-detail-dialog';
import { ConfirmationDialogComponent, ConfirmationDialogData } from '../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { getDialogAnimationDurations } from '../../shared/utils/motion.utils';

/** Flat row model for the project table view */
export interface ProjectTableRow {
  task: Task;
  depth: number;
  breadcrumb: string;
  hasLoadedChildren: boolean;
}

@Component({
  selector: 'app-project',
  imports: [
    CommonModule,
    MatIconModule,
    MatMenuModule,
    MatButtonModule
  ],
  templateUrl: './project.html',
  styleUrl: './project.css'
})
export class ProjectComponent implements OnInit, OnDestroy {
  private readonly taskService = inject(TaskService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly router = inject(Router);
  private readonly destroy$ = new Subject<void>();

  // Data state
  allTasks = signal<Task[]>([]);
  totalCount = signal(0);
  isLoading = signal(false);

  // UI state
  searchTerm = signal('');
  quickFilter = signal<'all' | 'pending' | 'done'>('all');
  isFilterPanelVisible = signal(false);
  selectedTasks = signal(new Set<string>());
  expandedRows = signal(new Set<string>());
  hoveredRowId = signal<string | null>(null);
  sortBy = signal('createdDate');
  sortOrder = signal<'asc' | 'desc'>('desc');
  page = signal(1);
  pageSize = signal(20);

  // Derived counts
  pendingCount = computed(() => {
    return this.allTasks().filter(t => t.status !== TaskStatus.Done).length;
  });

  doneCount = computed(() => {
    return this.allTasks().filter(t => t.status === TaskStatus.Done).length;
  });

  // Build flat display rows from tasks with hierarchy
  displayRows = computed(() => {
    const tasks = this.filteredTasks();
    return this.flattenTaskHierarchy(tasks);
  });

  // Filter tasks based on quick filter and search
  private filteredTasks = computed(() => {
    let tasks = this.allTasks();
    const filter = this.quickFilter();
    const search = this.searchTerm().toLowerCase().trim();

    if (filter === 'pending') {
      tasks = tasks.filter(t => t.status !== TaskStatus.Done);
    } else if (filter === 'done') {
      tasks = tasks.filter(t => t.status === TaskStatus.Done);
    }

    if (search) {
      tasks = tasks.filter(t => t.name.toLowerCase().includes(search));
    }

    return tasks;
  });

  // Pagination
  paginationStart = computed(() => {
    const total = this.totalCount();
    if (total === 0) return 0;
    return (this.page() - 1) * this.pageSize() + 1;
  });

  paginationEnd = computed(() => {
    return Math.min(this.page() * this.pageSize(), this.totalCount());
  });

  // Selection helpers
  isAllSelected = computed(() => {
    const rows = this.displayRows();
    const selected = this.selectedTasks();
    return rows.length > 0 && rows.every(r => selected.has(r.task.id));
  });

  isIndeterminate = computed(() => {
    const rows = this.displayRows();
    const selected = this.selectedTasks();
    const selectedCount = rows.filter(r => selected.has(r.task.id)).length;
    return selectedCount > 0 && selectedCount < rows.length;
  });

  ngOnInit(): void {
    this.loadTasks();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadTasks(): void {
    this.isLoading.set(true);
    this.taskService.getTasksPaginated(
      undefined,
      this.sortBy(),
      this.sortOrder(),
      this.page(),
      this.pageSize()
    ).pipe(takeUntil(this.destroy$)).subscribe({
      next: (result: PaginatedResult<Task>) => {
        this.allTasks.set(result.items);
        this.totalCount.set(result.totalCount);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.snackBar.open('Failed to load tasks', 'Close', { duration: 3000 });
      }
    });
  }

  /** Build flat row model with indent level and breadcrumb from parentId */
  flattenTaskHierarchy(tasks: Task[]): ProjectTableRow[] {
    const taskMap = new Map<string, Task>();
    tasks.forEach(t => taskMap.set(t.id, t));

    // Compute which tasks have children in the loaded set
    const parentIds = new Set<string>();
    tasks.forEach(t => {
      if (t.parentTaskId && taskMap.has(t.parentTaskId)) {
        parentIds.add(t.parentTaskId);
      }
    });

    const rows: ProjectTableRow[] = [];
    // Only display top-level tasks (no parent or parent not in current set)
    const topLevel = tasks.filter(t => !t.parentTaskId || !taskMap.has(t.parentTaskId));

    for (const task of topLevel) {
      rows.push({
        task,
        depth: 0,
        breadcrumb: this.buildBreadcrumb(task, taskMap),
        hasLoadedChildren: parentIds.has(task.id) || task.hasChildren
      });
    }

    return rows;
  }

  /** Build breadcrumb path string from parent chain */
  private buildBreadcrumb(task: Task, taskMap: Map<string, Task>): string {
    const parts: string[] = [];
    let current = task.parentTaskId ? taskMap.get(task.parentTaskId) : undefined;
    while (current) {
      parts.unshift(current.name);
      current = current.parentTaskId ? taskMap.get(current.parentTaskId) : undefined;
    }
    return parts.join(' / ');
  }

  /** Get child rows for expanded parent */
  getChildRows(parentId: string, parentDepth: number = 0): ProjectTableRow[] {
    const tasks = this.filteredTasks();
    const taskMap = new Map<string, Task>();
    tasks.forEach(t => taskMap.set(t.id, t));

    // Compute which tasks have children in the loaded set
    const parentIds = new Set<string>();
    tasks.forEach(t => {
      if (t.parentTaskId && taskMap.has(t.parentTaskId)) {
        parentIds.add(t.parentTaskId);
      }
    });

    return tasks
      .filter(t => t.parentTaskId === parentId)
      .map(t => ({
        task: t,
        depth: parentDepth + 1,
        breadcrumb: this.buildBreadcrumb(t, taskMap),
        hasLoadedChildren: parentIds.has(t.id) || t.hasChildren
      }));
  }

  // === Event handlers ===

  onSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchTerm.set(value);
  }

  onQuickFilterChange(filter: 'all' | 'pending' | 'done'): void {
    this.quickFilter.set(filter);
  }

  onSortChange(sortBy: string, sortOrder: 'asc' | 'desc'): void {
    this.sortBy.set(sortBy);
    this.sortOrder.set(sortOrder);
    this.page.set(1);
    this.loadTasks();
  }

  toggleFilterPanel(): void {
    this.isFilterPanelVisible.update(v => !v);
  }

  onPreviousPage(): void {
    if (this.page() > 1) {
      this.page.update(p => p - 1);
      this.loadTasks();
    }
  }

  onNextPage(): void {
    if (this.paginationEnd() < this.totalCount()) {
      this.page.update(p => p + 1);
      this.loadTasks();
    }
  }

  // Selection
  toggleSelection(taskId: string): void {
    this.selectedTasks.update(set => {
      const next = new Set(set);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  }

  toggleAllSelection(): void {
    if (this.isAllSelected()) {
      this.selectedTasks.set(new Set());
    } else {
      const allIds = new Set(this.displayRows().map(r => r.task.id));
      this.selectedTasks.set(allIds);
    }
  }

  isSelected(taskId: string): boolean {
    return this.selectedTasks().has(taskId);
  }

  // Expand/collapse
  toggleExpand(taskId: string): void {
    this.expandedRows.update(set => {
      const next = new Set(set);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  }

  isExpanded(taskId: string): boolean {
    return this.expandedRows().has(taskId);
  }

  // Task actions
  onCreateTask(): void {
    const dialogRef = this.dialog.open(TaskFormComponent, {
      width: '600px',
      ...getDialogAnimationDurations(),
      data: { mode: 'create' }
    });
    dialogRef.componentInstance.mode = 'create';
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.snackBar.open('Task created successfully!', 'Close', { duration: 3000 });
        this.loadTasks();
      }
    });
  }

  onViewDetails(task: Task): void {
    this.dialog.open(TaskDetailDialog, {
      width: '100%',
      maxWidth: '512px',
      disableClose: true,
      autoFocus: false,
      panelClass: 'quick-inspect-dialog-panel',
      backdropClass: 'quick-inspect-backdrop',
      ...getDialogAnimationDurations(),
      data: { task }
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
      }
    });
  }

  onDelete(task: Task): void {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '400px',
      ...getDialogAnimationDurations(),
      data: {
        title: 'Delete Task',
        message: `Are you sure you want to delete "${task.name}"?`,
        confirmText: 'Delete',
        cancelText: 'Cancel',
        confirmColor: 'warn'
      } as ConfirmationDialogData
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.taskService.deleteTask(task.id).pipe(takeUntil(this.destroy$)).subscribe({
          next: () => {
            this.snackBar.open('Task deleted', 'Close', { duration: 3000 });
            this.loadTasks();
          },
          error: () => {
            this.snackBar.open('Failed to delete task', 'Close', { duration: 3000 });
          }
        });
      }
    });
  }

  // Display helpers
  getStatusLabel(status: TaskStatus): string {
    switch (status) {
      case TaskStatus.InProgress: return 'In Progress';
      case TaskStatus.Blocked: return 'Blocked';
      case TaskStatus.Waiting: return 'Waiting';
      case TaskStatus.Done: return 'Done';
      default: return 'To Do';
    }
  }

  getStatusBadgeClass(status: TaskStatus): string {
    switch (status) {
      case TaskStatus.Done: return 'status-badge status-done';
      case TaskStatus.InProgress: return 'status-badge status-in-progress';
      case TaskStatus.Blocked: return 'status-badge status-blocked';
      case TaskStatus.Waiting: return 'status-badge status-waiting';
      default: return 'status-badge status-todo';
    }
  }

  getTaskTypeIcon(type: TaskType): string {
    switch (type) {
      case TaskType.Project: return 'folder';
      case TaskType.Milestone: return 'flag';
      default: return 'task_alt';
    }
  }

  formatDate(date: Date | null): string {
    if (!date) return '—';
    const d = new Date(date);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[d.getMonth()]} ${String(d.getDate()).padStart(2, '0')}, ${d.getFullYear()}`;
  }

  getInitials(name: string): string {
    return name.split(' ').map(n => n.charAt(0)).join('').substring(0, 2).toUpperCase();
  }
}
