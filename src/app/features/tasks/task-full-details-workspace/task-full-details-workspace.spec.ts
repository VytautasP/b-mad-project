import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { convertToParamMap, ActivatedRoute, ParamMap, Router } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { Location } from '@angular/common';
import { TaskFullDetailsWorkspaceComponent } from './task-full-details-workspace';
import { TaskService } from '../services/task.service';
import { NotificationService } from '../../../core/services/notification.service';
import { TimerStateService } from '../../../core/services/state/timer-state.service';
import { TimeTrackingService } from '../../../core/services/time-tracking.service';
import { Task, TaskPriority, TaskStatus, TaskType } from '../../../shared/models/task.model';
import { ActivityLogComponent } from '../../collaboration/activity-log/activity-log.component';
import { CommentThreadComponent } from '../../collaboration/comment-thread/comment-thread.component';
import { AssigneeList } from '../components/assignee-list/assignee-list';
import { TimeEntryList } from '../components/time-entry-list/time-entry-list';
import { UserPicker } from '../components/user-picker/user-picker';
import { TaskFormComponent } from '../task-form/task-form.component';

@Component({ selector: 'app-assignee-list', standalone: true, template: '' })
class AssigneeListStub {
  @Input() assignees: unknown[] = [];
  @Input() maxVisible = 0;
  @Input() showActions = false;
  @Output() removeAssignee = new EventEmitter<string>();
}

@Component({ selector: 'app-user-picker', standalone: true, template: '' })
class UserPickerStub {
  @Input() excludedUserIds: string[] = [];
  @Output() userSelected = new EventEmitter();
}

@Component({ selector: 'app-time-entry-list', standalone: true, template: '' })
class TimeEntryListStub {
  @Input() taskId = '';
  @Input() showHeader = true;
  @Output() timeEntryDeleted = new EventEmitter<void>();

  loadTimeEntries(): void {
    // noop
  }
}

@Component({ selector: 'app-comment-thread', standalone: true, template: '' })
class CommentThreadStub {
  @Input() taskId = '';
  @Input() showHeader = true;
  @Output() commentCountChange = new EventEmitter<number>();
  @Output() activityChanged = new EventEmitter<void>();
}

@Component({ selector: 'app-activity-log', standalone: true, template: '' })
class ActivityLogStub {
  @Input() taskId = '';
  @Input() refreshToken?: number | string;
}

@Component({ selector: 'app-task-form', standalone: true, template: '' })
class TaskFormStub {
  @Input() mode: 'create' | 'edit' = 'create';
  @Input() taskToEdit: Task | null = null;
  @Input() embedded = false;
  @Output() taskUpdated = new EventEmitter<Task>();
  @Output() cancelled = new EventEmitter<void>();
}

describe('TaskFullDetailsWorkspaceComponent', () => {
  let fixture: ComponentFixture<TaskFullDetailsWorkspaceComponent>;
  let component: TaskFullDetailsWorkspaceComponent;
  let paramMap$: BehaviorSubject<ParamMap>;
  let timer$: BehaviorSubject<any>;
  let mockTaskService: {
    getTaskById: ReturnType<typeof vi.fn>;
    getTaskAssignees: ReturnType<typeof vi.fn>;
    assignUser: ReturnType<typeof vi.fn>;
    unassignUser: ReturnType<typeof vi.fn>;
  };

  const mockTask: Task = {
    id: 'task-1',
    name: 'Task workspace title',
    description: 'Detailed page description',
    parentTaskId: null,
    hasChildren: true,
    createdByUserId: 'user-1',
    createdByUserName: 'User One',
    createdDate: new Date('2026-03-01'),
    modifiedDate: new Date('2026-03-04'),
    dueDate: new Date('2026-03-12'),
    priority: TaskPriority.High,
    status: TaskStatus.InProgress,
    progress: 55,
    type: TaskType.Task,
    isDeleted: false,
    assignees: [],
    directLoggedMinutes: 90,
    childrenLoggedMinutes: 45,
    totalLoggedMinutes: 135
  };

  beforeEach(async () => {
    paramMap$ = new BehaviorSubject(convertToParamMap({ id: 'task-1' }));
    timer$ = new BehaviorSubject({
      isRunning: false,
      isPaused: false,
      taskId: null,
      taskName: null,
      elapsedSeconds: 0,
      startTime: null
    });

    mockTaskService = {
      getTaskById: vi.fn().mockReturnValue(of(mockTask)),
      getTaskAssignees: vi.fn().mockReturnValue(of([])),
      assignUser: vi.fn().mockReturnValue(of(undefined)),
      unassignUser: vi.fn().mockReturnValue(of(undefined))
    };

    await TestBed.configureTestingModule({
      imports: [TaskFullDetailsWorkspaceComponent, NoopAnimationsModule],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: paramMap$.asObservable()
          }
        },
        { provide: TaskService, useValue: mockTaskService },
        { provide: Router, useValue: { navigate: vi.fn().mockResolvedValue(true) } },
        {
          provide: TimerStateService,
          useValue: {
            timer$: timer$.asObservable(),
            startTimer: vi.fn(),
            stopTimer: vi.fn().mockReturnValue(15)
          }
        },
        { provide: TimeTrackingService, useValue: { logTime: vi.fn().mockReturnValue(of({})) } },
        {
          provide: NotificationService,
          useValue: { showSuccess: vi.fn(), showError: vi.fn(), showInfo: vi.fn() }
        },
        { provide: MatDialog, useValue: { open: vi.fn().mockReturnValue({ afterClosed: () => of(false) }) } },
        { provide: Location, useValue: { back: vi.fn() } }
      ]
    })
      .overrideComponent(TaskFullDetailsWorkspaceComponent, {
        remove: {
          imports: [
            AssigneeList,
            UserPicker,
            TimeEntryList,
            CommentThreadComponent,
            ActivityLogComponent,
            TaskFormComponent
          ]
        },
        add: {
          imports: [
            AssigneeListStub,
            UserPickerStub,
            TimeEntryListStub,
            CommentThreadStub,
            ActivityLogStub,
            TaskFormStub
          ]
        }
      })
      .compileComponents();

    fixture = TestBed.createComponent(TaskFullDetailsWorkspaceComponent);
    component = fixture.componentInstance;
  });

  it('should render the dedicated overview workspace for the route task', () => {
    fixture.detectChanges();

    expect(mockTaskService.getTaskById).toHaveBeenCalledWith('task-1');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Task workspace title');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Edit details');
  });

  it('should show stop enabled when the current task timer is running', () => {
    timer$.next({
      isRunning: true,
      isPaused: false,
      taskId: 'task-1',
      taskName: 'Task workspace title',
      elapsedSeconds: 3661,
      startTime: Date.now()
    });

    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const buttons = Array.from(element.querySelectorAll('.time-actions-row button')) as HTMLButtonElement[];

    expect(buttons[0].disabled).toBe(true);
    expect(buttons[1].disabled).toBe(false);
    expect(element.textContent).toContain('01:01:01');
  });

  it('should enter inline edit mode when edit details is selected', () => {
    fixture.detectChanges();

    component.onOpenEditor();
    fixture.detectChanges();

    expect(component.isEditingDetails()).toBe(true);
    expect(fixture.nativeElement.querySelector('app-task-form')).toBeTruthy();
  });

  it('should show the attachment scaffold state', () => {
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.textContent).toContain('No attachments have been added to this task yet.');
    expect(element.querySelectorAll('.attachment-tile').length).toBe(3);
  });

  it('should render the error state and recover on retry', () => {
    mockTaskService.getTaskById
      .mockReturnValueOnce(throwError(() => new Error('load failed')))
      .mockReturnValueOnce(of(mockTask));

    fixture.detectChanges();
    expect(component.hasLoadError()).toBe(true);

    component.onRetryTask();
    fixture.detectChanges();

    expect(mockTaskService.getTaskById).toHaveBeenCalledTimes(2);
    expect(component.hasLoadError()).toBe(false);
    expect(component.task()?.id).toBe('task-1');
  });
});