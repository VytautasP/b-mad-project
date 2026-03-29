import { Component, inject, OnInit, ViewChild, ElementRef, signal, computed, ChangeDetectionStrategy, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { TaskService, TimelineTask } from '../services/task.service';
import { TaskStatus } from '../../../shared/models/task.model';
import { TaskDetailDialog, TaskDetailDialogData } from '../task-detail-dialog/task-detail-dialog';
import { getDialogAnimationDurations } from '../../../shared/utils/motion.utils';
import { TimelineEmptyStateComponent } from './timeline-empty-state/timeline-empty-state';

export interface TaskGroup {
  name: string;
  expanded: boolean;
  tasks: TimelineTask[];
}

@Component({
  selector: 'app-timeline',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    TimelineEmptyStateComponent
  ],
  templateUrl: './timeline.html',
  styleUrl: './timeline.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TimelineComponent implements OnInit, OnDestroy {
  private readonly taskService = inject(TaskService);
  private readonly dialog = inject(MatDialog);
  private readonly router = inject(Router);
  private readonly destroy$ = new Subject<void>();

  @ViewChild('taskListBody', { static: false }) taskListBody?: ElementRef<HTMLDivElement>;
  @ViewChild('chartBody', { static: false }) chartBody?: ElementRef<HTMLDivElement>;
  @ViewChild('chartDateHeader', { static: false }) chartDateHeader?: ElementRef<HTMLDivElement>;

  allTasks = signal<TimelineTask[]>([]);
  isLoading = signal(false);
  viewMode = signal<'day' | 'week' | 'month'>('week');
  noDueDateCount = signal(0);

  // Date navigation state
  currentDate = signal(new Date());

  // Groups computed from tasks
  groups = signal<TaskGroup[]>([]);

  // Visible rows (respecting collapsed groups)
  visibleRows = computed(() => {
    const rows: { type: 'group' | 'task'; group: TaskGroup; task?: TimelineTask; isParent?: boolean }[] = [];
    for (const group of this.groups()) {
      rows.push({ type: 'group', group });
      if (group.expanded) {
        for (const task of group.tasks) {
          rows.push({ type: 'task', group, task, isParent: task.isGroup });
        }
      }
    }
    return rows;
  });

  // Date columns
  dateColumns = computed(() => this.buildDateColumns(this.viewMode(), this.currentDate()));

  // Chart total width
  chartWidth = computed(() => {
    const cols = this.dateColumns();
    return cols.reduce((sum, c) => sum + c.width, 0);
  });

  // Current date label for toolbar
  currentDateLabel = computed(() => {
    const d = this.currentDate();
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'];
    return `${months[d.getMonth()]} ${d.getFullYear()}`;
  });

  // Range boundaries for bar positioning
  rangeStart = computed(() => {
    const cols = this.dateColumns();
    return cols.length > 0 ? cols[0].start : new Date();
  });

  rangeEnd = computed(() => {
    const cols = this.dateColumns();
    return cols.length > 0 ? cols[cols.length - 1].end : new Date();
  });

  // Query range — extend well beyond visible to ensure API returns all relevant tasks
  private queryStartDate = new Date();
  private queryEndDate = new Date();

  ngOnInit(): void {
    const savedZoom = sessionStorage.getItem('timeline-zoom');
    if (savedZoom && (savedZoom === 'day' || savedZoom === 'week' || savedZoom === 'month')) {
      this.viewMode.set(savedZoom as 'day' | 'week' | 'month');
    }

    this.updateQueryRange();
    this.loadTimelineData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private updateQueryRange(): void {
    const d = this.currentDate();
    // Query 6 months around current date to have plenty of data
    this.queryStartDate = new Date(d.getFullYear(), d.getMonth() - 6, 1);
    this.queryEndDate = new Date(d.getFullYear(), d.getMonth() + 6, 0);
  }

  loadTimelineData(): void {
    this.isLoading.set(true);

    this.taskService.getTimelineTasks({
      startDate: this.queryStartDate.toISOString(),
      endDate: this.queryEndDate.toISOString()
    }).pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (tasks) => {
          let noDueCount = 0;
          const valid: TimelineTask[] = [];
          for (const t of tasks) {
            if (!t.endDate || new Date(t.endDate).getTime() === new Date(t.startDate).getTime()) {
              noDueCount++;
            }
            valid.push(t);
          }
          this.noDueDateCount.set(noDueCount);
          this.allTasks.set(valid);
          this.buildGroups(valid);
          this.isLoading.set(false);
        },
        error: () => {
          this.isLoading.set(false);
        }
      });
  }

  private buildGroups(tasks: TimelineTask[]): void {
    const groupMap = new Map<string, TaskGroup>();
    const ungrouped: TimelineTask[] = [];
    const existingGroups = this.groups();
    const rootParents: TimelineTask[] = [];

    for (const task of tasks) {
      // Root parent: isGroup=true AND no parentTaskId → will be unshifted to group front
      if (task.isGroup && !task.parentTaskId) {
        rootParents.push(task);
        continue;
      }

      const gName = task.groupName;
      if (gName) {
        let group = groupMap.get(gName);
        if (!group) {
          const existingExpanded = existingGroups.find(g => g.name === gName)?.expanded ?? true;
          group = { name: gName, expanded: existingExpanded, tasks: [] };
          groupMap.set(gName, group);
        }
        group.tasks.push(task);
      } else {
        ungrouped.push(task);
      }
    }

    // Insert root parent tasks at the beginning of their corresponding groups
    for (const parent of rootParents) {
      let group = groupMap.get(parent.name);
      if (!group) {
        const existingExpanded = existingGroups.find(g => g.name === parent.name)?.expanded ?? true;
        group = { name: parent.name, expanded: existingExpanded, tasks: [] };
        groupMap.set(parent.name, group);
      }
      group.tasks.unshift(parent);
    }

    const result: TaskGroup[] = [];
    for (const [, group] of groupMap) {
      result.push(group);
    }
    if (ungrouped.length > 0) {
      const existingExpanded = existingGroups.find(g => g.name === 'Ungrouped')?.expanded ?? true;
      result.push({ name: 'Ungrouped', expanded: existingExpanded, tasks: ungrouped });
    }

    this.groups.set(result);
  }

  // --- Toolbar actions ---

  changeViewMode(mode: 'day' | 'week' | 'month'): void {
    this.viewMode.set(mode);
    sessionStorage.setItem('timeline-zoom', mode);
  }

  navigatePrev(): void {
    const d = this.currentDate();
    const mode = this.viewMode();
    if (mode === 'day') {
      this.currentDate.set(new Date(d.getFullYear(), d.getMonth(), d.getDate() - 10));
    } else if (mode === 'week') {
      this.currentDate.set(new Date(d.getFullYear(), d.getMonth(), d.getDate() - 28));
    } else {
      this.currentDate.set(new Date(d.getFullYear(), d.getMonth() - 3, 1));
    }
    this.checkAndReload();
  }

  navigateNext(): void {
    const d = this.currentDate();
    const mode = this.viewMode();
    if (mode === 'day') {
      this.currentDate.set(new Date(d.getFullYear(), d.getMonth(), d.getDate() + 10));
    } else if (mode === 'week') {
      this.currentDate.set(new Date(d.getFullYear(), d.getMonth(), d.getDate() + 28));
    } else {
      this.currentDate.set(new Date(d.getFullYear(), d.getMonth() + 3, 1));
    }
    this.checkAndReload();
  }

  goToToday(): void {
    this.currentDate.set(new Date());
    this.checkAndReload();
  }

  private checkAndReload(): void {
    const d = this.currentDate();
    if (d < this.queryStartDate || d > this.queryEndDate) {
      this.updateQueryRange();
      this.loadTimelineData();
    }
  }

  toggleGroup(group: TaskGroup): void {
    const updated = this.groups().map(g =>
      g.name === group.name ? { ...g, expanded: !g.expanded } : g
    );
    this.groups.set(updated);
  }

  onAddTask(): void {
    this.router.navigate(['/tasks'], {
      queryParams: { openTaskForm: 'true', focusField: 'dueDate', returnTo: 'timeline' }
    });
  }

  onAddDueDateCta(): void {
    this.onAddTask();
  }

  onTaskClick(task: TimelineTask): void {
    // Fetch full task data before opening dialog
    this.taskService.getTaskById(task.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (fullTask) => {
          const dialogRef = this.dialog.open(TaskDetailDialog, {
            width: '100%',
            maxWidth: '512px',
            data: { task: fullTask, openerElement: null } as TaskDetailDialogData,
            disableClose: true,
            autoFocus: false,
            panelClass: 'quick-inspect-dialog-panel',
            backdropClass: 'quick-inspect-backdrop',
            ...getDialogAnimationDurations()
          });

          dialogRef.afterClosed().subscribe((result) => {
            if (result) {
              this.loadTimelineData();
            }
          });
        },
        error: () => {
          // Silently fail — task may have been deleted
        }
      });
  }

  // --- Synchronized scrolling ---

  onChartBodyScroll(event: Event): void {
    const el = event.target as HTMLElement;
    // Sync vertical scroll with task list
    if (this.taskListBody) {
      this.taskListBody.nativeElement.scrollTop = el.scrollTop;
    }
    // Sync horizontal scroll with date header
    if (this.chartDateHeader) {
      this.chartDateHeader.nativeElement.scrollLeft = el.scrollLeft;
    }
  }

  onTaskListScroll(event: Event): void {
    const el = event.target as HTMLElement;
    if (this.chartBody) {
      this.chartBody.nativeElement.scrollTop = el.scrollTop;
    }
  }

  // --- Date column generation ---

  private buildDateColumns(mode: 'day' | 'week' | 'month', anchor: Date): { label: string; start: Date; end: Date; width: number }[] {
    const columns: { label: string; start: Date; end: Date; width: number }[] = [];

    if (mode === 'day') {
      // Show ~20 days centered on anchor
      const startDay = new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate() - 10);
      for (let i = 0; i < 20; i++) {
        const d = new Date(startDay.getFullYear(), startDay.getMonth(), startDay.getDate() + i);
        const dEnd = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        columns.push({
          label: `${monthNames[d.getMonth()]} ${String(d.getDate()).padStart(2, '0')}`,
          start: d,
          end: dEnd,
          width: 60
        });
      }
    } else if (mode === 'week') {
      // Show ~8 weeks centered on anchor
      const startWeek = new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate() - anchor.getDay() - 21);
      for (let i = 0; i < 8; i++) {
        const wStart = new Date(startWeek.getFullYear(), startWeek.getMonth(), startWeek.getDate() + i * 7);
        const wEnd = new Date(wStart.getFullYear(), wStart.getMonth(), wStart.getDate() + 7);
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        columns.push({
          label: `${monthNames[wStart.getMonth()]} ${String(wStart.getDate()).padStart(2, '0')} - ${String(wEnd.getDate() - 1).padStart(2, '0')}`,
          start: wStart,
          end: wEnd,
          width: 240
        });
      }
    } else {
      // Show ~6 months centered on anchor
      for (let i = -2; i < 4; i++) {
        const mStart = new Date(anchor.getFullYear(), anchor.getMonth() + i, 1);
        const mEnd = new Date(anchor.getFullYear(), anchor.getMonth() + i + 1, 1);
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
          'July', 'August', 'September', 'October', 'November', 'December'];
        columns.push({
          label: `${monthNames[mStart.getMonth()]} ${mStart.getFullYear()}`,
          start: mStart,
          end: mEnd,
          width: 200
        });
      }
    }

    return columns;
  }

  // --- Bar positioning ---

  getBarStyle(task: TimelineTask): { [key: string]: string } {
    const totalWidth = this.chartWidth();
    const rangeStartMs = this.rangeStart().getTime();
    const rangeDuration = this.rangeEnd().getTime() - rangeStartMs;

    if (rangeDuration <= 0) return { display: 'none' };

    const taskStart = new Date(task.startDate).getTime();
    const taskEnd = new Date(task.endDate).getTime();

    // Clamp to visible range
    const clampedStart = Math.max(taskStart, rangeStartMs);
    const clampedEnd = Math.min(taskEnd, rangeStartMs + rangeDuration);

    if (clampedEnd <= clampedStart) return { display: 'none' };

    const leftPct = ((clampedStart - rangeStartMs) / rangeDuration) * 100;
    const widthPct = ((clampedEnd - clampedStart) / rangeDuration) * 100;
    const leftPx = (leftPct / 100) * totalWidth;
    const widthPx = Math.max((widthPct / 100) * totalWidth, 20); // minimum 20px width

    return {
      left: `${leftPx}px`,
      width: `${widthPx}px`
    };
  }

  // --- Today line position ---

  getTodayLinePosition(): string | null {
    const now = new Date();
    const rangeStartMs = this.rangeStart().getTime();
    const rangeDuration = this.rangeEnd().getTime() - rangeStartMs;
    if (rangeDuration <= 0) return null;

    const nowMs = now.getTime();
    if (nowMs < rangeStartMs || nowMs > rangeStartMs + rangeDuration) return null;

    const leftPct = ((nowMs - rangeStartMs) / rangeDuration) * 100;
    const leftPx = (leftPct / 100) * this.chartWidth();
    return `${leftPx}px`;
  }

  // --- Status helpers ---

  getStatusDotClass(status: TaskStatus | number): string {
    switch (status) {
      case TaskStatus.ToDo: return 'dot-todo';
      case TaskStatus.InProgress: return 'dot-in-progress';
      case TaskStatus.Blocked: return 'dot-blocked';
      case TaskStatus.Waiting: return 'dot-waiting';
      case TaskStatus.Done: return 'dot-done';
      default: return 'dot-todo';
    }
  }

  // Column offset helper for grid lines
  getColumnOffset(index: number): number {
    const cols = this.dateColumns();
    let offset = 0;
    for (let i = 0; i < index; i++) {
      offset += cols[i].width;
    }
    return offset;
  }

  // --- Group summary bar (aggregate date range of child tasks) ---

  getGroupBarStyle(group: TaskGroup): { [key: string]: string } {
    const totalWidth = this.chartWidth();
    const rangeStartMs = this.rangeStart().getTime();
    const rangeDuration = this.rangeEnd().getTime() - rangeStartMs;

    if (rangeDuration <= 0 || group.tasks.length === 0) return { display: 'none' };

    let earliest = Infinity;
    let latest = -Infinity;
    for (const task of group.tasks) {
      const s = new Date(task.startDate).getTime();
      const e = new Date(task.endDate).getTime();
      if (s < earliest) earliest = s;
      if (e > latest) latest = e;
    }

    if (earliest === Infinity || latest === -Infinity || latest <= earliest) return { display: 'none' };

    const clampedStart = Math.max(earliest, rangeStartMs);
    const clampedEnd = Math.min(latest, rangeStartMs + rangeDuration);

    if (clampedEnd <= clampedStart) return { display: 'none' };

    const leftPct = ((clampedStart - rangeStartMs) / rangeDuration) * 100;
    const widthPct = ((clampedEnd - clampedStart) / rangeDuration) * 100;
    const leftPx = (leftPct / 100) * totalWidth;
    const widthPx = Math.max((widthPct / 100) * totalWidth, 20);

    return {
      left: `${leftPx}px`,
      width: `${widthPx}px`
    };
  }
}

