import { Component, inject, OnInit, signal, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
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
    MatChipsModule,
    MatTooltipModule,
    AssigneeList,
    UserPicker,
    TimeEntryList,
    CommentThreadComponent,
    ActivityLogComponent
  ],
  templateUrl: './task-detail-dialog.html',
  styleUrl: './task-detail-dialog.css',
})
export class TaskDetailDialog implements OnInit, OnDestroy {
  @ViewChild('timeEntryList') timeEntryList?: TimeEntryList;

  private readonly dialogRef = inject(MatDialogRef<TaskDetailDialog>);
  private readonly data: TaskDetailDialogData = inject(MAT_DIALOG_DATA);
  private readonly taskService = inject(TaskService);
  private readonly timerService = inject(TimerStateService);
  private readonly dialog = inject(MatDialog);
  private readonly notificationService = inject(NotificationService);
  private readonly destroy$ = new Subject<void>();
  
  task = signal<Task>(this.data.task);
  assignees = signal<TaskAssignmentDto[]>(this.data.task.assignees || []);
  showUserPicker = signal(false);
  isLoadingAssignees = signal(false);
  currentTimerState: TimerState | null = null;
  activityRefreshVersion = 0;
  
  TaskPriority = TaskPriority;
  TaskStatus = TaskStatus;
  TaskType = TaskType;
  
  ngOnInit(): void {
    this.loadAssignees();
    
    // Subscribe to timer state
    this.timerService.timer$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(state => {
      this.currentTimerState = state;
    });
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
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
    // Simple confirmation
    if (!confirm('Remove this user from the task?')) {
      return;
    }
    
    this.taskService.unassignUser(this.task().id, userId).subscribe({
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
  
  onClose(): void {
    this.dialogRef.close();
  }
  
  onStartTimer(): void {
    const task = this.task();
    
    // Check if another timer is running
    if (this.currentTimerState?.isRunning && this.currentTimerState.taskId !== task.id) {
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
          // Stop current timer and start new one
          this.timerService.stopTimer();
          this.timerService.startTimer(task.id, task.name);
          this.notificationService.showSuccess(`Timer started for "${task.name}"`);
        }
      });
    } else {
      // No timer running, start new one
      this.timerService.startTimer(task.id, task.name);
      this.notificationService.showSuccess(`Timer started for "${task.name}"`);
    }
  }

  isTimerRunning(): boolean {
    return this.currentTimerState?.isRunning === true && this.currentTimerState?.taskId === this.task().id;
  }

  isAnotherTimerRunning(): boolean {
    return this.currentTimerState?.isRunning === true && this.currentTimerState?.taskId !== this.task().id;
  }

  onLogTime(): void {
    const dialogData: ManualTimeEntryFormData = {
      taskId: this.task().id
    };

    const logTimeDialogRef = this.dialog.open(ManualTimeEntryForm, {
      width: '500px',
      maxWidth: '90vw',
      data: dialogData
    });

    logTimeDialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Refresh time entry list
        this.timeEntryList?.loadTimeEntries();
        // Reload task to update total logged time
        this.refreshTask();
        this.triggerActivityRefresh();
      }
    });
  }

  onTimeEntryDeleted(): void {
    // Reload task to update total logged time
    this.refreshTask();
    this.triggerActivityRefresh();
  }

  onCommentActivityChanged(): void {
    this.triggerActivityRefresh();
  }

  private refreshTask(): void {
    this.taskService.getTaskById(this.task().id).subscribe({
      next: (updatedTask) => {
        this.task.set(updatedTask);
      },
      error: (error) => {
        console.error('Failed to refresh task:', error);
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

  /**
   * Format duration using utility function
   */
  formatDuration(minutes: number): string {
    return formatDuration(minutes);
  }

  /**
   * Check if task has children with logged time
   */
  hasChildrenTime(): boolean {
    return this.task().childrenLoggedMinutes > 0;
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
}

