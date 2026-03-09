import { CommonModule, Location } from '@angular/common';
import { AfterViewChecked, Component, DestroyRef, ElementRef, OnInit, ViewChild, inject, signal, computed } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Task, TaskAssignmentDto, TaskPriority, TaskStatus, TaskType } from '../../../shared/models/task.model';
import { User } from '../../../shared/models/user.model';
import { NotificationService } from '../../../core/services/notification.service';
import { TimeTrackingService } from '../../../core/services/time-tracking.service';
import { TimerState, TimerStateService } from '../../../core/services/state/timer-state.service';
import {
  ConfirmationDialogComponent,
  ConfirmationDialogData
} from '../../../shared/components/confirmation-dialog/confirmation-dialog.component';
import {
  StopTimerDialogComponent,
  StopTimerDialogData,
  StopTimerDialogResult
} from '../../../shared/components/stop-timer-dialog/stop-timer-dialog.component';
import { formatDuration } from '../../../shared/utils/time.utils';
import { CommentThreadComponent } from '../../collaboration/comment-thread/comment-thread.component';
import { ActivityLogComponent } from '../../collaboration/activity-log/activity-log.component';
import { AssigneeList } from '../components/assignee-list/assignee-list';
import { ManualTimeEntryForm, ManualTimeEntryFormData } from '../components/manual-time-entry-form/manual-time-entry-form';
import { TimeEntryList } from '../components/time-entry-list/time-entry-list';
import { UserPicker } from '../components/user-picker/user-picker';
import { TaskService } from '../services/task.service';

const COMMENTS_DELAY_MS = 120;
const ACTIVITY_DELAY_MS = 260;

@Component({
  selector: 'app-task-full-details-workspace',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatDatepickerModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatMenuModule,
    MatNativeDateModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    ActivityLogComponent,
    AssigneeList,
    CommentThreadComponent,
    TimeEntryList,
    UserPicker
  ],
  templateUrl: './task-full-details-workspace.html',
  styleUrl: './task-full-details-workspace.css'
})
export class TaskFullDetailsWorkspaceComponent implements OnInit, AfterViewChecked {
  @ViewChild('timeEntryList') timeEntryList?: TimeEntryList;
  @ViewChild('nameInput') nameInputRef?: ElementRef<HTMLInputElement>;
  @ViewChild('descInput') descInputRef?: ElementRef<HTMLTextAreaElement>;

  private needsFocusName = false;
  private needsFocusDesc = false;

  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly taskService = inject(TaskService);
  private readonly timerService = inject(TimerStateService);
  private readonly timeTrackingService = inject(TimeTrackingService);
  private readonly dialog = inject(MatDialog);
  private readonly notificationService = inject(NotificationService);

  readonly task = signal<Task | null>(null);
  readonly assignees = signal<TaskAssignmentDto[]>([]);
  readonly childTasks = signal<Task[]>([]);
  readonly isLoading = signal(true);
  readonly isLoadingAssignees = signal(false);
  readonly isLoadingSubtasks = signal(false);
  readonly hasLoadError = signal(false);
  readonly showUserPicker = signal(false);
  readonly showDeferredComments = signal(false);
  readonly showDeferredActivity = signal(false);
  readonly activityExpanded = signal(false);
  readonly commentCount = signal(0);
  readonly isEditingName = signal(false);
  readonly isEditingDescription = signal(false);
  editNameValue = '';
  editDescriptionValue = '';

  readonly completedSubtaskCount = computed(() =>
    this.childTasks().filter(t => t.status === TaskStatus.Done).length
  );

  readonly subtaskStatusSummary = computed(() => {
    const tasks = this.childTasks();
    if (tasks.length === 0) return '';
    const statusCounts = new Map<TaskStatus, number>();
    tasks.forEach(t => statusCounts.set(t.status, (statusCounts.get(t.status) || 0) + 1));
    const parts: string[] = [];
    statusCounts.forEach((count, status) => {
      parts.push(`${count} ${this.getStatusLabel(status)}`);
    });
    return parts.join(' · ');
  });

  currentTimerState: TimerState | null = null;
  activityRefreshVersion = 0;
  currentTaskId: string | null = null;

  readonly attachmentScaffolds = [
    {
      icon: 'draft',
      title: 'Project notes',
      description: 'File uploads are not part of this story yet.'
    },
    {
      icon: 'image',
      title: 'Design assets',
      description: 'Reference files will appear here when attachment APIs exist.'
    },
    {
      icon: 'link',
      title: 'Linked resources',
      description: 'This space is intentionally scaffolded and read-only for now.'
    }
  ];

  TaskPriority = TaskPriority;
  TaskStatus = TaskStatus;
  TaskType = TaskType;

  readonly allStatuses: { value: TaskStatus; label: string }[] = [
    { value: TaskStatus.ToDo, label: 'To Do' },
    { value: TaskStatus.InProgress, label: 'In Progress' },
    { value: TaskStatus.Blocked, label: 'Blocked' },
    { value: TaskStatus.Waiting, label: 'Waiting' },
    { value: TaskStatus.Done, label: 'Done' }
  ];

  readonly allPriorities: { value: TaskPriority; label: string }[] = [
    { value: TaskPriority.Low, label: 'Low' },
    { value: TaskPriority.Medium, label: 'Medium' },
    { value: TaskPriority.High, label: 'High' },
    { value: TaskPriority.Critical, label: 'Critical' }
  ];

  private deferredCommentsTimerId?: ReturnType<typeof setTimeout>;
  private deferredActivityTimerId?: ReturnType<typeof setTimeout>;

  constructor() {
    this.destroyRef.onDestroy(() => this.clearDeferredTimers());
  }

  ngAfterViewChecked(): void {
    if (this.needsFocusName && this.nameInputRef) {
      this.nameInputRef.nativeElement.focus();
      this.nameInputRef.nativeElement.select();
      this.needsFocusName = false;
    }
    if (this.needsFocusDesc && this.descInputRef) {
      this.descInputRef.nativeElement.focus();
      this.needsFocusDesc = false;
    }
  }

  ngOnInit(): void {
    this.timerService.timer$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((state) => {
        this.currentTimerState = state;
      });

    this.route.paramMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        const taskId = params.get('id');
        if (!taskId) {
          this.router.navigate(['/dashboard']);
          return;
        }

        this.currentTaskId = taskId;
        this.loadTask(taskId);
      });
  }

  onBack(): void {
    if (window.history.length > 1) {
      this.location.back();
      return;
    }

    this.router.navigate(['/dashboard']);
  }

  onRetryTask(): void {
    if (this.currentTaskId) {
      this.loadTask(this.currentTaskId);
    }
  }

  refreshTask(showToast = false): void {
    const currentTask = this.task();
    if (!currentTask) {
      return;
    }

    this.taskService.getTaskById(currentTask.id).subscribe({
      next: (updatedTask) => {
        this.task.set(updatedTask);
        this.assignees.set(updatedTask.assignees || []);
        if (showToast) {
          this.notificationService.showSuccess('Task details refreshed');
        }
      }
    });
  }

  onChangeStatus(status: TaskStatus): void {
    const currentTask = this.task();
    if (!currentTask || currentTask.status === status) return;

    this.taskService.updateTask(currentTask.id, { status }).subscribe({
      next: (updated) => {
        this.task.set(updated);
        this.notificationService.showSuccess(`Status changed to ${this.getStatusLabel(status)}`);
        this.triggerActivityRefresh();
      },
      error: () => this.notificationService.showError('Failed to update status')
    });
  }

  onChangePriority(priority: TaskPriority): void {
    const currentTask = this.task();
    if (!currentTask || currentTask.priority === priority) return;

    this.taskService.updateTask(currentTask.id, { priority }).subscribe({
      next: (updated) => {
        this.task.set(updated);
        this.notificationService.showSuccess(`Priority changed to ${this.getPriorityLabel(priority)}`);
        this.triggerActivityRefresh();
      },
      error: () => this.notificationService.showError('Failed to update priority')
    });
  }

  onChangeDueDate(event: any): void {
    const currentTask = this.task();
    if (!currentTask) return;
    const date = event.value as Date | null;

    this.taskService.updateTask(currentTask.id, { dueDate: date }).subscribe({
      next: (updated) => {
        this.task.set(updated);
        this.notificationService.showSuccess('Due date updated');
        this.triggerActivityRefresh();
      },
      error: () => this.notificationService.showError('Failed to update due date')
    });
  }

  onStartEditName(): void {
    const currentTask = this.task();
    if (!currentTask) return;
    this.editNameValue = currentTask.name;
    this.isEditingName.set(true);
    this.needsFocusName = true;
  }

  onSaveName(): void {
    const currentTask = this.task();
    const trimmed = this.editNameValue.trim();
    if (!currentTask || !trimmed || trimmed === currentTask.name) {
      this.isEditingName.set(false);
      return;
    }

    this.taskService.updateTask(currentTask.id, { name: trimmed }).subscribe({
      next: (updated) => {
        this.task.set(updated);
        this.isEditingName.set(false);
        this.notificationService.showSuccess('Task name updated');
        this.triggerActivityRefresh();
      },
      error: () => {
        this.isEditingName.set(false);
        this.notificationService.showError('Failed to update task name');
      }
    });
  }

  onCancelEditName(): void {
    this.isEditingName.set(false);
  }

  onStartEditDescription(): void {
    const currentTask = this.task();
    if (!currentTask) return;
    this.editDescriptionValue = currentTask.description || '';
    this.isEditingDescription.set(true);
    this.needsFocusDesc = true;
  }

  onSaveDescription(): void {
    const currentTask = this.task();
    if (!currentTask) {
      this.isEditingDescription.set(false);
      return;
    }
    const val = this.editDescriptionValue.trim();
    const oldVal = (currentTask.description || '').trim();
    if (val === oldVal) {
      this.isEditingDescription.set(false);
      return;
    }

    this.taskService.updateTask(currentTask.id, { description: val || null }).subscribe({
      next: (updated) => {
        this.task.set(updated);
        this.isEditingDescription.set(false);
        this.notificationService.showSuccess('Description updated');
        this.triggerActivityRefresh();
      },
      error: () => {
        this.isEditingDescription.set(false);
        this.notificationService.showError('Failed to update description');
      }
    });
  }

  onCancelEditDescription(): void {
    this.isEditingDescription.set(false);
  }

  onNameKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.onSaveName();
    } else if (event.key === 'Escape') {
      this.onCancelEditName();
    }
  }

  onDescriptionKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.onCancelEditDescription();
    }
  }

  toggleUserPicker(): void {
    this.showUserPicker.update((value) => !value);
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
        this.notificationService.showError(this.getAssignmentErrorMessage(error));
      }
    });
  }

  onRemoveAssignee(userId: string): void {
    const currentTask = this.task();
    if (!currentTask) {
      return;
    }

    const dialogData: ConfirmationDialogData = {
      title: 'Remove Assignee',
      message: 'Remove this person from the task?',
      confirmText: 'Remove',
      cancelText: 'Cancel'
    };

    this.dialog.open(ConfirmationDialogComponent, {
      width: '400px',
      data: dialogData
    }).afterClosed().subscribe((confirmed) => {
      if (confirmed !== true) {
        return;
      }

      this.taskService.unassignUser(currentTask.id, userId).subscribe({
        next: () => {
          this.notificationService.showSuccess('User unassigned successfully');
          this.loadAssignees();
          this.triggerActivityRefresh();
        },
        error: (error) => {
          this.notificationService.showError(this.getAssignmentErrorMessage(error));
        }
      });
    });
  }

  onStartTimer(): void {
    const currentTask = this.task();
    if (!currentTask) {
      return;
    }

    if (this.isAnotherTimerRunning()) {
      const dialogData: ConfirmationDialogData = {
        title: 'Switch Timer',
        message: `A timer is already running for "${this.currentTimerState?.taskName}". Stop it and start this one instead?`,
        confirmText: 'Switch Timer',
        cancelText: 'Cancel'
      };

      this.dialog.open(ConfirmationDialogComponent, {
        width: '400px',
        data: dialogData
      }).afterClosed().subscribe((confirmed) => {
        if (confirmed === true) {
          this.timerService.stopTimer();
          this.timerService.startTimer(currentTask.id, currentTask.name);
          this.notificationService.showSuccess(`Timer started for "${currentTask.name}"`);
        }
      });
      return;
    }

    this.timerService.startTimer(currentTask.id, currentTask.name);
    this.notificationService.showSuccess(`Timer started for "${currentTask.name}"`);
  }

  onStopTimer(): void {
    if (!this.isTimerRunningForCurrentTask() || !this.currentTimerState?.taskId) {
      return;
    }

    const taskId = this.currentTimerState.taskId;
    const elapsedMinutes = this.timerService.stopTimer();

    this.dialog.open<StopTimerDialogComponent, StopTimerDialogData, StopTimerDialogResult>(
      StopTimerDialogComponent,
      {
        width: '400px',
        data: { elapsedMinutes }
      }
    ).afterClosed().subscribe((result) => {
      if (!result?.confirmed) {
        return;
      }

      this.timeTrackingService.logTime(taskId, elapsedMinutes, result.note || '', 'Timer').subscribe({
        next: () => {
          this.notificationService.showSuccess(`Logged ${elapsedMinutes} minutes to task`);
          this.timeEntryList?.loadTimeEntries();
          this.refreshTask();
          this.triggerActivityRefresh();
        },
        error: () => {
          this.notificationService.showError('Failed to save time entry');
        }
      });
    });
  }

  onLogTime(): void {
    const currentTask = this.task();
    if (!currentTask) {
      return;
    }

    const dialogData: ManualTimeEntryFormData = {
      taskId: currentTask.id
    };

    this.dialog.open(ManualTimeEntryForm, {
      width: '500px',
      maxWidth: '90vw',
      data: dialogData
    }).afterClosed().subscribe((result) => {
      if (!result) {
        return;
      }

      this.timeEntryList?.loadTimeEntries();
      this.refreshTask();
      this.triggerActivityRefresh();
    });
  }

  onTimeEntryDeleted(): void {
    this.refreshTask();
    this.triggerActivityRefresh();
  }

  onCommentCountChanged(count: number): void {
    this.commentCount.set(count);
  }

  onCommentActivityChanged(): void {
    this.triggerActivityRefresh();
  }

  toggleActivityExpanded(): void {
    this.activityExpanded.update((value) => !value);
  }

  getExcludedUserIds(): string[] {
    return this.assignees().map((assignee) => assignee.userId);
  }

  getTaskReference(task: Task): string {
    return `TF-${task.id.replace(/[^a-zA-Z0-9]/g, '').slice(-4).toUpperCase()}`;
  }

  getPriorityLabel(priority: number): string {
    return TaskPriority[priority];
  }

  getPriorityClass(priority: number): string {
    switch (priority) {
      case TaskPriority.Critical:
        return 'priority-critical';
      case TaskPriority.High:
        return 'priority-high';
      case TaskPriority.Low:
        return 'priority-low';
      case TaskPriority.Medium:
      default:
        return 'priority-medium';
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

  getTypeLabel(type: number): string {
    return TaskType[type];
  }

  formatDate(date: Date | null): string {
    if (!date) {
      return 'No due date';
    }

    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  formatElapsedTime(seconds: number): string {
    const safeSeconds = Math.max(seconds, 0);
    const hours = Math.floor(safeSeconds / 3600);
    const minutes = Math.floor((safeSeconds % 3600) / 60);
    const remainingSeconds = safeSeconds % 60;

    return [hours, minutes, remainingSeconds]
      .map((value) => value.toString().padStart(2, '0'))
      .join(':');
  }

  formatDuration(minutes: number): string {
    return formatDuration(minutes);
  }

  hasChildrenTime(): boolean {
    return (this.task()?.childrenLoggedMinutes || 0) > 0;
  }

  formatShortDate(date: Date | null): string {
    if (!date) {
      return '—';
    }
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  }

  isOverdue(date: Date | null): boolean {
    if (!date) return false;
    return new Date(date) < new Date();
  }

  getPrioritySidebarClass(priority: number): string {
    switch (priority) {
      case TaskPriority.Critical:
        return 'priority-sidebar-critical';
      case TaskPriority.High:
        return 'priority-sidebar-high';
      case TaskPriority.Low:
        return 'priority-sidebar-low';
      case TaskPriority.Medium:
      default:
        return 'priority-sidebar-medium';
    }
  }

  getPriorityIcon(priority: number): string {
    switch (priority) {
      case TaskPriority.Critical:
        return 'error';
      case TaskPriority.High:
        return 'local_fire_department';
      case TaskPriority.Low:
        return 'arrow_downward';
      case TaskPriority.Medium:
      default:
        return 'local_fire_department';
    }
  }

  onToggleSubtaskStatus(subtask: Task): void {
    const newStatus = subtask.status === TaskStatus.Done ? TaskStatus.ToDo : TaskStatus.Done;
    this.taskService.updateTask(subtask.id, { status: newStatus }).subscribe({
      next: () => {
        this.loadChildTasks();
        this.refreshTask();
        this.triggerActivityRefresh();
      },
      error: () => {
        this.notificationService.showError('Failed to update subtask status');
      }
    });
  }

  onNavigateToSubtask(subtask: Task): void {
    this.router.navigate(['/tasks', subtask.id]);
  }

  onAddSubtask(): void {
    const currentTask = this.task();
    if (!currentTask) return;

    const dto = {
      name: 'New subtask',
      parentTaskId: currentTask.id,
      priority: TaskPriority.Medium,
      status: TaskStatus.ToDo,
      type: TaskType.Task
    };

    this.taskService.createTask(dto).subscribe({
      next: () => {
        this.loadChildTasks();
        this.refreshTask();
        this.notificationService.showSuccess('Subtask created');
        this.triggerActivityRefresh();
      },
      error: () => {
        this.notificationService.showError('Failed to create subtask');
      }
    });
  }

  getSubtaskInitials(userName: string): string {
    return userName
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  isTimerRunningForCurrentTask(): boolean {
    const currentTask = this.task();
    return this.currentTimerState?.isRunning === true && this.currentTimerState.taskId === currentTask?.id;
  }

  isAnotherTimerRunning(): boolean {
    const currentTask = this.task();
    return this.currentTimerState?.isRunning === true && this.currentTimerState.taskId !== currentTask?.id;
  }

  private loadTask(taskId: string): void {
    this.isLoading.set(true);
    this.hasLoadError.set(false);
    this.showUserPicker.set(false);
    this.showDeferredComments.set(false);
    this.showDeferredActivity.set(false);
    this.clearDeferredTimers();

    this.taskService.getTaskById(taskId).subscribe({
      next: (task) => {
        this.task.set(task);
        this.assignees.set(task.assignees || []);
        this.isLoading.set(false);
        this.loadAssignees();
        this.loadChildTasks();
        this.queueDeferredSections();
      },
      error: () => {
        this.task.set(null);
        this.assignees.set([]);
        this.hasLoadError.set(true);
        this.isLoading.set(false);
        this.notificationService.showError('Failed to load task details.');
      }
    });
  }

  private loadAssignees(): void {
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

  private loadChildTasks(): void {
    const currentTask = this.task();
    if (!currentTask) {
      return;
    }

    this.isLoadingSubtasks.set(true);
    this.taskService.getChildTasks(currentTask.id).subscribe({
      next: (children) => {
        this.childTasks.set(children);
        this.isLoadingSubtasks.set(false);
      },
      error: () => {
        this.childTasks.set([]);
        this.isLoadingSubtasks.set(false);
      }
    });
  }

  private queueDeferredSections(): void {
    this.clearDeferredTimers();

    this.deferredCommentsTimerId = setTimeout(() => {
      this.showDeferredComments.set(true);
    }, COMMENTS_DELAY_MS);

    this.deferredActivityTimerId = setTimeout(() => {
      this.showDeferredActivity.set(true);
    }, ACTIVITY_DELAY_MS);
  }

  private clearDeferredTimers(): void {
    if (this.deferredCommentsTimerId) {
      clearTimeout(this.deferredCommentsTimerId);
      this.deferredCommentsTimerId = undefined;
    }

    if (this.deferredActivityTimerId) {
      clearTimeout(this.deferredActivityTimerId);
      this.deferredActivityTimerId = undefined;
    }
  }

  private triggerActivityRefresh(): void {
    this.activityRefreshVersion += 1;
  }

  private getAssignmentErrorMessage(error: { status?: number }): string {
    if (error.status === 404) {
      return 'User not found';
    }

    if (error.status === 403) {
      return `You don't have permission to modify assignments`;
    }

    return 'Assignment failed. Please try again.';
  }
}