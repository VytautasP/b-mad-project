import { Component, inject, OnInit, signal, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Subject, takeUntil } from 'rxjs';
import { Task, TaskPriority, TaskStatus, TaskType, TaskAssignmentDto } from '../../../shared/models/task.model';
import { User } from '../../../shared/models/user.model';
import { TaskService } from '../services/task.service';
import { NotificationService } from '../../../core/services/notification.service';
import { AssigneeList } from '../components/assignee-list/assignee-list';
import { UserPicker } from '../components/user-picker/user-picker';
import { TimerStateService, TimerState } from '../../../core/services/state/timer-state.service';
import { ConfirmationDialogComponent, ConfirmationDialogData } from '../../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { ManualTimeEntryForm, ManualTimeEntryFormData } from '../components/manual-time-entry-form/manual-time-entry-form';
import { TimeEntryList } from '../components/time-entry-list/time-entry-list';
import { formatDuration } from '../../../shared/utils/time.utils';
import { CommentThreadComponent } from '../../collaboration/comment-thread/comment-thread.component';
import { ActivityLogComponent } from '../../collaboration/activity-log/activity-log.component';

@Component({
  selector: 'app-task-details-page',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatTooltipModule,
    MatDialogModule,
    AssigneeList,
    UserPicker,
    TimeEntryList,
    CommentThreadComponent,
    ActivityLogComponent
  ],
  templateUrl: './task-details-page.html',
  styleUrl: './task-details-page.css'
})
export class TaskDetailsPageComponent implements OnInit, OnDestroy {
  @ViewChild('timeEntryList') timeEntryList?: TimeEntryList;

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly taskService = inject(TaskService);
  private readonly timerService = inject(TimerStateService);
  private readonly dialog = inject(MatDialog);
  private readonly notificationService = inject(NotificationService);
  private readonly destroy$ = new Subject<void>();

  task = signal<Task | null>(null);
  assignees = signal<TaskAssignmentDto[]>([]);
  showUserPicker = signal(false);
  isLoading = signal(true);
  isLoadingAssignees = signal(false);
  showDeferredSections = signal(false);
  showDeferredActivity = signal(false);
  currentTimerState: TimerState | null = null;
  activityRefreshVersion = 0;
  private deferredSectionsTimerId?: ReturnType<typeof setTimeout>;
  private deferredActivityTimerId?: ReturnType<typeof setTimeout>;

  TaskPriority = TaskPriority;
  TaskStatus = TaskStatus;
  TaskType = TaskType;

  ngOnInit(): void {
    this.timerService.timer$
      .pipe(takeUntil(this.destroy$))
      .subscribe(state => {
        this.currentTimerState = state;
      });

    this.route.paramMap
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        const taskId = params.get('id');
        if (!taskId) {
          this.router.navigate(['/dashboard']);
          return;
        }

        this.loadTask(taskId);
      });
  }

  ngOnDestroy(): void {
    this.clearDeferredTimers();
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadTask(taskId: string): void {
    this.isLoading.set(true);
    this.showDeferredSections.set(false);
    this.showDeferredActivity.set(false);
    this.clearDeferredTimers();

    this.taskService.getTaskById(taskId).subscribe({
      next: (task) => {
        this.task.set(task);
        this.assignees.set(task.assignees || []);
        this.isLoading.set(false);
        this.loadAssignees();
        this.queueDeferredSections();
      },
      error: () => {
        this.notificationService.showError('Failed to load task details.');
        this.isLoading.set(false);
      }
    });
  }

  loadAssignees(): void {
    const currentTask = this.task();
    if (!currentTask) {
      return;
    }

    this.isLoadingAssignees.set(true);
    this.taskService.getTaskAssignees(currentTask.id).subscribe({
      next: (assignees) => {
        this.assignees.set(assignees);
        this.isLoadingAssignees.set(false);
      },
      error: () => {
        this.isLoadingAssignees.set(false);
      }
    });
  }

  toggleUserPicker(): void {
    this.showUserPicker.update(value => !value);
  }

  onAddAssignee(user: User): void {
    const currentTask = this.task();
    if (!currentTask) {
      return;
    }

    this.taskService.assignUser(currentTask.id, user.id).subscribe({
      next: () => {
        this.notificationService.showSuccess('User assigned successfully');
        this.loadAssignees();
        this.triggerActivityRefresh();
        this.showUserPicker.set(false);
      },
      error: (error) => {
        const errorMessage = this.getErrorMessage(error);
        this.notificationService.showError(errorMessage);
      }
    });
  }

  onRemoveAssignee(userId: string): void {
    const currentTask = this.task();
    if (!currentTask) {
      return;
    }

    if (!confirm('Remove this user from the task?')) {
      return;
    }

    this.taskService.unassignUser(currentTask.id, userId).subscribe({
      next: () => {
        this.notificationService.showSuccess('User unassigned successfully');
        this.loadAssignees();
        this.triggerActivityRefresh();
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

  formatDate(date: Date | null): string {
    if (!date) return 'No due date';
    return new Date(date).toLocaleDateString();
  }

  onBack(): void {
    if (window.history.length > 1) {
      this.location.back();
      return;
    }

    this.router.navigate(['/dashboard']);
  }

  onStartTimer(): void {
    const currentTask = this.task();
    if (!currentTask) {
      return;
    }

    if (this.currentTimerState?.isRunning && this.currentTimerState.taskId !== currentTask.id) {
      const dialogData: ConfirmationDialogData = {
        title: 'Switch Timer',
        message: `A timer is already running for "${this.currentTimerState.taskName}". Stop current timer and start new one?`,
        confirmText: 'Switch Timer',
        cancelText: 'Cancel'
      };

      const confirmDialogRef = this.dialog.open(ConfirmationDialogComponent, {
        width: '400px',
        data: dialogData
      });

      confirmDialogRef.afterClosed().subscribe(confirmed => {
        if (confirmed === true) {
          this.timerService.stopTimer();
          this.timerService.startTimer(currentTask.id, currentTask.name);
          this.notificationService.showSuccess(`Timer started for "${currentTask.name}"`);
        }
      });
    } else {
      this.timerService.startTimer(currentTask.id, currentTask.name);
      this.notificationService.showSuccess(`Timer started for "${currentTask.name}"`);
    }
  }

  isTimerRunning(): boolean {
    const currentTask = this.task();
    return this.currentTimerState?.isRunning === true && this.currentTimerState?.taskId === currentTask?.id;
  }

  isAnotherTimerRunning(): boolean {
    const currentTask = this.task();
    return this.currentTimerState?.isRunning === true && this.currentTimerState?.taskId !== currentTask?.id;
  }

  onLogTime(): void {
    const currentTask = this.task();
    if (!currentTask) {
      return;
    }

    const dialogData: ManualTimeEntryFormData = {
      taskId: currentTask.id
    };

    const logTimeDialogRef = this.dialog.open(ManualTimeEntryForm, {
      width: '500px',
      maxWidth: '90vw',
      data: dialogData
    });

    logTimeDialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.timeEntryList?.loadTimeEntries();
        this.refreshTask();
        this.triggerActivityRefresh();
      }
    });
  }

  onTimeEntryDeleted(): void {
    this.refreshTask();
    this.triggerActivityRefresh();
  }

  onCommentActivityChanged(): void {
    this.triggerActivityRefresh();
  }

  private refreshTask(): void {
    const currentTask = this.task();
    if (!currentTask) {
      return;
    }

    this.taskService.getTaskById(currentTask.id).subscribe({
      next: (updatedTask) => {
        this.task.set(updatedTask);
      }
    });
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

  formatDuration(minutes: number): string {
    return formatDuration(minutes);
  }

  hasChildrenTime(): boolean {
    const currentTask = this.task();
    return (currentTask?.childrenLoggedMinutes || 0) > 0;
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

  private triggerActivityRefresh(): void {
    this.activityRefreshVersion += 1;
  }

  private queueDeferredSections(): void {
    this.clearDeferredTimers();

    this.deferredSectionsTimerId = setTimeout(() => {
      this.showDeferredSections.set(true);
    }, 120);

    this.deferredActivityTimerId = setTimeout(() => {
      this.showDeferredActivity.set(true);
    }, 260);
  }

  private clearDeferredTimers(): void {
    if (this.deferredSectionsTimerId) {
      clearTimeout(this.deferredSectionsTimerId);
      this.deferredSectionsTimerId = undefined;
    }

    if (this.deferredActivityTimerId) {
      clearTimeout(this.deferredActivityTimerId);
      this.deferredActivityTimerId = undefined;
    }
  }
}