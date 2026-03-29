import { TestBed } from '@angular/core/testing';
import { TimerStateService, TimerState } from './timer-state.service';

describe('TimerStateService', () => {
  let service: TimerStateService;
  let mockLocalStorage: { [key: string]: string };
  let getItemSpy: ReturnType<typeof vi.fn>;
  let setItemSpy: ReturnType<typeof vi.fn>;
  let removeItemSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.useFakeTimers();

    // Mock localStorage
    mockLocalStorage = {};
    getItemSpy = vi.fn((key: string) => mockLocalStorage[key] || null);
    setItemSpy = vi.fn((key: string, value: string) => {
      mockLocalStorage[key] = value;
      return undefined;
    });
    removeItemSpy = vi.fn((key: string) => {
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
    vi.useRealTimers();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should start timer and update state', () => {
    let currentState: TimerState = service['initialState'];
    service.timer$.subscribe(state => {
      currentState = state;
    });

    service.startTimer('task-123', 'Test Task');
    vi.advanceTimersByTime(0);

    expect(currentState).toBeTruthy();
    expect(currentState.isRunning).toBe(true);
    expect(currentState.isPaused).toBe(false);
    expect(currentState.taskId).toBe('task-123');
    expect(currentState.taskName).toBe('Test Task');
    expect(currentState.elapsedSeconds).toBe(0);
  });

  it('should pause timer and stop ticking', () => {
    let currentState: TimerState = service['initialState'];
    service.timer$.subscribe(state => {
      currentState = state;
    });

    service.startTimer('task-123', 'Test Task');
    vi.advanceTimersByTime(3000);

    expect(currentState.elapsedSeconds).toBe(3);

    service.pauseTimer();
    const pausedSeconds = currentState.elapsedSeconds;
    vi.advanceTimersByTime(2000);

    expect(currentState.isPaused).toBe(true);
    expect(currentState.elapsedSeconds).toBe(pausedSeconds);
  });

  it('should resume timer and continue ticking', () => {
    let currentState: TimerState = service['initialState'];
    service.timer$.subscribe(state => {
      currentState = state;
    });

    service.startTimer('task-123', 'Test Task');
    vi.advanceTimersByTime(2000);

    service.pauseTimer();
    const pausedSeconds = currentState.elapsedSeconds;
    
    service.resumeTimer();
    vi.advanceTimersByTime(2000);

    expect(currentState.isPaused).toBe(false);
    expect(currentState.elapsedSeconds).toBeGreaterThan(pausedSeconds);
  });

  it('should stop timer and return elapsed minutes (rounded up)', () => {
    service.startTimer('task-123', 'Test Task');
    vi.advanceTimersByTime(90000);

    const elapsedMinutes = service.stopTimer();

    expect(elapsedMinutes).toBe(2); // Rounded up from 1.5
  });

  it('should persist timer state to localStorage', () => {
    service.startTimer('task-123', 'Test Task');
    vi.advanceTimersByTime(0);

    expect(localStorage.setItem).toHaveBeenCalledWith(
      'taskflow_timer',
      expect.any(String)
    );
  });

  it('should clear localStorage when timer stopped', () => {
    service.startTimer('task-123', 'Test Task');
    vi.advanceTimersByTime(0);

    service.stopTimer();

    expect(localStorage.removeItem).toHaveBeenCalledWith('taskflow_timer');
  });

  it('should increment elapsed seconds every second', () => {
    let currentState: TimerState = service['initialState'];
    service.timer$.subscribe(state => {
      currentState = state;
    });

    service.startTimer('task-123', 'Test Task');
    vi.advanceTimersByTime(1000);
    expect(currentState.elapsedSeconds).toBe(1);
    
    vi.advanceTimersByTime(1000);
    expect(currentState.elapsedSeconds).toBe(2);
    
    vi.advanceTimersByTime(1000);
    expect(currentState.elapsedSeconds).toBe(3);
  });
});