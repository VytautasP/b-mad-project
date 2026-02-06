// @ts-nocheck
import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { TimerStateService, TimerState } from './timer-state.service';

describe('TimerStateService', () => {
  let service: TimerStateService;
  let mockLocalStorage: { [key: string]: string };

  beforeEach(() => {
    // Mock localStorage
    mockLocalStorage = {};
    const getItemSpy = jasmine.createSpy('getItem').and.callFake((key: string) => mockLocalStorage[key] || null);
    const setItemSpy = jasmine.createSpy('setItem').and.callFake((key: string, value: string) => {
      mockLocalStorage[key] = value;
      return undefined;
    });
    const removeItemSpy = jasmine.createSpy('removeItem').and.callFake((key: string) => {
      delete mockLocalStorage[key];
      return undefined;
    });

    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: getItemSpy,
        setItem: setItemSpy,
        removeItem: removeItemSpy
      },
      writable: true
    });

    TestBed.configureTestingModule({
      providers: [TimerStateService]
    });
    service = TestBed.inject(TimerStateService);
  });

  afterEach(() => {
    if (service.ngOnDestroy) {
      service.ngOnDestroy();
    }
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should start timer and update state', fakeAsync(() => {
    let currentState: TimerState = service['initialState'];
    service.timer$.subscribe(state => {
      currentState = state;
    });

    service.startTimer('task-123', 'Test Task');
    tick();

    expect(currentState).toBeTruthy();
    expect(currentState.isRunning).toBe(true);
    expect(currentState.isPaused).toBe(false);
    expect(currentState.taskId).toBe('task-123');
    expect(currentState.taskName).toBe('Test Task');
    expect(currentState.elapsedSeconds).toBe(0);
  }));

  it('should pause timer and stop ticking', fakeAsync(() => {
    let currentState: TimerState = service['initialState'];
    service.timer$.subscribe(state => {
      currentState = state;
    });

    service.startTimer('task-123', 'Test Task');
    tick(3000); // Wait 3 seconds

    expect(currentState.elapsedSeconds).toBe(3);

    service.pauseTimer();
    const pausedSeconds = currentState.elapsedSeconds;
    tick(2000); // Wait 2 more seconds

    expect(currentState.isPaused).toBe(true);
    expect(currentState.elapsedSeconds).toBe(pausedSeconds);
  }));

  it('should resume timer and continue ticking', fakeAsync(() => {
    let currentState: TimerState = service['initialState'];
    service.timer$.subscribe(state => {
      currentState = state;
    });

    service.startTimer('task-123', 'Test Task');
    tick(2000);

    service.pauseTimer();
    const pausedSeconds = currentState.elapsedSeconds;
    
    service.resumeTimer();
    tick(2000);

    expect(currentState.isPaused).toBe(false);
    expect(currentState.elapsedSeconds).toBeGreaterThan(pausedSeconds);
  }));

  it('should stop timer and return elapsed minutes (rounded up)', fakeAsync(() => {
    service.startTimer('task-123', 'Test Task');
    tick(90000); // 90 seconds = 1.5 minutes

    const elapsedMinutes = service.stopTimer();

    expect(elapsedMinutes).toBe(2); // Rounded up from 1.5
  }));

  it('should persist timer state to localStorage', fakeAsync(() => {
    service.startTimer('task-123', 'Test Task');
    tick();

    expect(localStorage.setItem).toHaveBeenCalledWith(
      'taskflow_timer',
      jasmine.any(String)
    );
  }));

  it('should clear localStorage when timer stopped', fakeAsync(() => {
    service.startTimer('task-123', 'Test Task');
    tick();

    service.stopTimer();

    expect(localStorage.removeItem).toHaveBeenCalledWith('taskflow_timer');
  }));

  it('should increment elapsed seconds every second', fakeAsync(() => {
    let currentState: TimerState = service['initialState'];
    service.timer$.subscribe(state => {
      currentState = state;
    });

    service.startTimer('task-123', 'Test Task');
    tick(1000);
    expect(currentState.elapsedSeconds).toBe(1);
    
    tick(1000);
    expect(currentState.elapsedSeconds).toBe(2);
    
    tick(1000);
    expect(currentState.elapsedSeconds).toBe(3);
  }));
});