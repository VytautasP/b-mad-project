import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BehaviorSubject, of } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { TimerWidgetComponent } from './timer-widget.component';
import { TimerStateService, TimerState } from '../../../core/services/state/timer-state.service';
import { TimeTrackingService } from '../../../core/services/time-tracking.service';
import { TaskService } from '../../../features/tasks/services/task.service';
import { NotificationService } from '../../../core/services/notification.service';

describe('TimerWidgetComponent', () => {
  let component: TimerWidgetComponent;
  let fixture: ComponentFixture<TimerWidgetComponent>;
  let mockTimerService: {
    timer$: BehaviorSubject<TimerState>;
    pauseTimer: ReturnType<typeof vi.fn>;
    resumeTimer: ReturnType<typeof vi.fn>;
    stopTimer: ReturnType<typeof vi.fn>;
  };
  let mockTimeTrackingService: { logTime: ReturnType<typeof vi.fn> };
  let mockTaskService: { getTasks: ReturnType<typeof vi.fn> };
  let mockNotificationService: { showSuccess: ReturnType<typeof vi.fn>; showError: ReturnType<typeof vi.fn> };
  let mockDialog: { open: ReturnType<typeof vi.fn> };
  let timerStateSubject: BehaviorSubject<TimerState>;

  const initialState: TimerState = {
    isRunning: false,
    isPaused: false,
    taskId: null,
    taskName: null,
    elapsedSeconds: 0,
    startTime: null
  };

  beforeEach(async () => {
    timerStateSubject = new BehaviorSubject<TimerState>(initialState);

    mockTimerService = {
      timer$: timerStateSubject,
      pauseTimer: vi.fn(),
      resumeTimer: vi.fn(),
      stopTimer: vi.fn().mockReturnValue(30)
    };
    mockTimeTrackingService = { logTime: vi.fn().mockReturnValue(of(undefined)) };
    mockTaskService = { getTasks: vi.fn().mockReturnValue(of([])) };
    mockNotificationService = { showSuccess: vi.fn(), showError: vi.fn() };
    mockDialog = { open: vi.fn().mockReturnValue({ afterClosed: () => of(null) }) };

    await TestBed.configureTestingModule({
      imports: [TimerWidgetComponent],
      providers: [
        { provide: TimerStateService, useValue: mockTimerService },
        { provide: TimeTrackingService, useValue: mockTimeTrackingService },
        { provide: TaskService, useValue: mockTaskService },
        { provide: NotificationService, useValue: mockNotificationService },
        { provide: MatDialog, useValue: mockDialog }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TimerWidgetComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display timer widget when timer is running', () => {
    timerStateSubject.next({
      ...initialState,
      isRunning: true,
      taskId: 'task-123',
      taskName: 'Test Task',
      elapsedSeconds: 60
    });
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.timer-widget')).toBeTruthy();
  });

  it('should hide timer widget when no timer is active', () => {
    timerStateSubject.next(initialState);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.timer-widget')).toBeFalsy();
  });

  it('should display task name and formatted time', () => {
    timerStateSubject.next({
      ...initialState,
      isRunning: true,
      taskId: 'task-123',
      taskName: 'Test Task',
      elapsedSeconds: 125
    });
    fixture.detectChanges();

    const taskName = fixture.nativeElement.querySelector('.task-name');
    const timerDisplay = fixture.nativeElement.querySelector('.timer-display');

    expect(taskName?.textContent).toContain('Test Task');
    expect(timerDisplay?.textContent).toBe('00:02:05');
  });

  it('should show pause button when running', () => {
    timerStateSubject.next({
      ...initialState,
      isRunning: true,
      taskId: 'task-123',
      taskName: 'Test Task'
    });
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[aria-label="Pause Timer"]')).toBeTruthy();
  });

  it('should show resume button when paused', () => {
    timerStateSubject.next({
      ...initialState,
      isRunning: true,
      isPaused: true,
      taskId: 'task-123',
      taskName: 'Test Task'
    });
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[aria-label="Resume Timer"]')).toBeTruthy();
  });

  it('should call timerState.pauseTimer on pause click', () => {
    component['onPause']();

    expect(mockTimerService.pauseTimer).toHaveBeenCalled();
  });

  it('should call timerState.resumeTimer on resume click', () => {
    component['onResume']();

    expect(mockTimerService.resumeTimer).toHaveBeenCalled();
  });

  it('should display pulsing indicator when timer is active', () => {
    timerStateSubject.next({
      ...initialState,
      isRunning: true,
      taskId: 'task-123',
      taskName: 'Test Task'
    });
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.timer-indicator.active')).toBeTruthy();
  });

  it('should format time correctly', () => {
    expect(component['formatTime'](0)).toBe('00:00:00');
    expect(component['formatTime'](59)).toBe('00:00:59');
    expect(component['formatTime'](60)).toBe('00:01:00');
    expect(component['formatTime'](3665)).toBe('01:01:05');
  });
});