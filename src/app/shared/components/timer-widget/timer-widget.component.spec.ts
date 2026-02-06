// @ts-nocheck
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogModule } from '@angular/material/dialog';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { BehaviorSubject } from 'rxjs';
import { TimerWidgetComponent } from './timer-widget.component';
import { TimerStateService, TimerState } from '../../../core/services/state/timer-state.service';
import { TimeTrackingService } from '../../../core/services/time-tracking.service';
import { NotificationService } from '../../../core/services/notification.service';

describe('TimerWidgetComponent', () => {
  let component: TimerWidgetComponent;
  let fixture: ComponentFixture<TimerWidgetComponent>;
  let mockTimerService: jasmine.SpyObj<TimerStateService>;
  let mockTimeTrackingService: jasmine.SpyObj<TimeTrackingService>;
  let mockNotificationService: jasmine.SpyObj<NotificationService>;
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

    mockTimerService = jasmine.createSpyObj('TimerStateService', 
      ['pauseTimer', 'resumeTimer', 'stopTimer'],
      { timer$: timerStateSubject.asObservable() }
    );
    
    mockTimeTrackingService = jasmine.createSpyObj('TimeTrackingService', ['logTime']);
    mockNotificationService = jasmine.createSpyObj('NotificationService', ['showSuccess', 'showError']);

    await TestBed.configureTestingModule({
      imports: [
        TimerWidgetComponent,
        MatDialogModule,
        MatCardModule,
        MatButtonModule,
        MatIconModule,
        MatTooltipModule
      ],
      providers: [
        { provide: TimerStateService, useValue: mockTimerService },
        { provide: TimeTrackingService, useValue: mockTimeTrackingService },
        { provide: NotificationService, useValue: mockNotificationService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TimerWidgetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display timer widget when timer is running', () => {
    const runningState: TimerState = {
      ...initialState,
      isRunning: true,
      taskId: 'task-123',
      taskName: 'Test Task',
      elapsedSeconds: 60
    };
    
    timerStateSubject.next(runningState);
    fixture.detectChanges();

    const widget = fixture.nativeElement.querySelector('.timer-widget');
    expect(widget).toBeTruthy();
  });

  it('should hide timer widget when no timer active', () => {
    timerStateSubject.next(initialState);
    fixture.detectChanges();

    const widget = fixture.nativeElement.querySelector('.timer-widget');
    expect(widget).toBeFalsy();
  });

  it('should display task name and formatted time', () => {
    const runningState: TimerState = {
      ...initialState,
      isRunning: true,
      taskId: 'task-123',
      taskName: 'Test Task',
      elapsedSeconds: 125 // 2 minutes 5 seconds
    };
    
    timerStateSubject.next(runningState);
    fixture.detectChanges();

    const taskName = fixture.nativeElement.querySelector('.task-name');
    const timerDisplay = fixture.nativeElement.querySelector('.timer-display');
    
    expect(taskName?.textContent).toContain('Test Task');
    expect(timerDisplay?.textContent).toBe('00:02:05');
  });

  it('should show pause button when running', () => {
    const runningState: TimerState = {
      ...initialState,
      isRunning: true,
      isPaused: false,
      taskId: 'task-123',
      taskName: 'Test Task'
    };
    
    timerStateSubject.next(runningState);
    fixture.detectChanges();

    const pauseButton = fixture.nativeElement.querySelector('[matTooltip="Pause Timer"]');
    expect(pauseButton).toBeTruthy();
  });

  it('should show resume button when paused', () => {
    const pausedState: TimerState = {
      ...initialState,
      isRunning: true,
      isPaused: true,
      taskId: 'task-123',
      taskName: 'Test Task'
    };
    
    timerStateSubject.next(pausedState);
    fixture.detectChanges();

    const resumeButton = fixture.nativeElement.querySelector('[matTooltip="Resume Timer"]');
    expect(resumeButton).toBeTruthy();
  });

  it('should call timerState.pauseTimer() on pause click', () => {
    const runningState: TimerState = {
      ...initialState,
      isRunning: true,
      isPaused: false,
      taskId: 'task-123',
      taskName: 'Test Task'
    };
    
    timerStateSubject.next(runningState);
    fixture.detectChanges();

    component.onPause();

    expect(mockTimerService.pauseTimer).toHaveBeenCalled();
  });

  it('should call timerState.resumeTimer() on resume click', () => {
    const pausedState: TimerState = {
      ...initialState,
      isRunning: true,
      isPaused: true,
      taskId: 'task-123',
      taskName: 'Test Task'
    };
    
    timerStateSubject.next(pausedState);
    fixture.detectChanges();

    component.onResume();

    expect(mockTimerService.resumeTimer).toHaveBeenCalled();
  });

  it('should display pulsing indicator when active', () => {
    const runningState: TimerState = {
      ...initialState,
      isRunning: true,
      isPaused: false,
      taskId: 'task-123',
      taskName: 'Test Task'
    };
    
    timerStateSubject.next(runningState);
    fixture.detectChanges();

    const indicator = fixture.nativeElement.querySelector('.timer-indicator.active');
    expect(indicator).toBeTruthy();
  });

  it('should format time correctly', () => {
    expect(component['formatTime'](0)).toBe('00:00:00');
    expect(component['formatTime'](59)).toBe('00:00:59');
    expect(component['formatTime'](60)).toBe('00:01:00');
    expect(component['formatTime'](3665)).toBe('01:01:05');
  });
});