import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, interval, Subscription } from 'rxjs';

export interface TimerState {
  isRunning: boolean;
  isPaused: boolean;
  taskId: string | null;
  taskName: string | null;
  elapsedSeconds: number;
  startTime: number | null;
}

const TIMER_STORAGE_KEY = 'taskflow_timer';

@Injectable({
  providedIn: 'root'
})
export class TimerStateService implements OnDestroy {
  private readonly initialState: TimerState = {
    isRunning: false,
    isPaused: false,
    taskId: null,
    taskName: null,
    elapsedSeconds: 0,
    startTime: null
  };

  private timerSubject = new BehaviorSubject<TimerState>(this.initialState);
  public timer$: Observable<TimerState> = this.timerSubject.asObservable();
  
  private intervalSubscription?: Subscription;

  constructor() {
    this.loadTimerFromStorage();
  }

  ngOnDestroy(): void {
    if (this.intervalSubscription) {
      this.intervalSubscription.unsubscribe();
    }
  }

  startTimer(taskId: string, taskName: string): void {
    // Stop any existing timer
    if (this.intervalSubscription) {
      this.intervalSubscription.unsubscribe();
    }

    const newState: TimerState = {
      isRunning: true,
      isPaused: false,
      taskId,
      taskName,
      elapsedSeconds: 0,
      startTime: Date.now()
    };

    this.timerSubject.next(newState);
    this.saveToStorage(newState);
    this.startInterval();
  }

  pauseTimer(): void {
    const currentState = this.timerSubject.value;
    if (!currentState.isRunning || currentState.isPaused) {
      return;
    }

    if (this.intervalSubscription) {
      this.intervalSubscription.unsubscribe();
    }

    const updatedState: TimerState = {
      ...currentState,
      isPaused: true,
      isRunning: true
    };

    this.timerSubject.next(updatedState);
    this.saveToStorage(updatedState);
  }

  resumeTimer(): void {
    const currentState = this.timerSubject.value;
    if (!currentState.isPaused) {
      return;
    }

    const updatedState: TimerState = {
      ...currentState,
      isPaused: false,
      startTime: Date.now()
    };

    this.timerSubject.next(updatedState);
    this.saveToStorage(updatedState);
    this.startInterval();
  }

  stopTimer(): number {
    const currentState = this.timerSubject.value;
    
    if (this.intervalSubscription) {
      this.intervalSubscription.unsubscribe();
    }

    // Calculate elapsed minutes (rounded up)
    const elapsedMinutes = Math.ceil(currentState.elapsedSeconds / 60);

    // Reset to initial state
    this.timerSubject.next(this.initialState);
    this.removeFromStorage();

    return elapsedMinutes;
  }

  loadTimerFromStorage(): void {
    try {
      const storedData = localStorage.getItem(TIMER_STORAGE_KEY);
      if (!storedData) {
        return;
      }

      const state: TimerState = JSON.parse(storedData);
      
      // Validate state structure
      if (state.taskId && state.taskName !== undefined && state.elapsedSeconds >= 0) {
        this.timerSubject.next(state);
        
        // Resume timer if it was running
        if (state.isRunning && !state.isPaused) {
          this.startInterval();
        }
      }
    } catch (error) {
      console.error('Failed to load timer from storage:', error);
      this.removeFromStorage();
    }
  }

  private startInterval(): void {
    this.intervalSubscription = interval(1000).subscribe(() => {
      this.tick();
    });
  }

  private tick(): void {
    const currentState = this.timerSubject.value;
    
    if (!currentState.isRunning || currentState.isPaused) {
      return;
    }

    const updatedState: TimerState = {
      ...currentState,
      elapsedSeconds: currentState.elapsedSeconds + 1
    };

    this.timerSubject.next(updatedState);
  }

  private saveToStorage(state: TimerState): void {
    try {
      localStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error('Failed to save timer to storage:', error);
    }
  }

  private removeFromStorage(): void {
    try {
      localStorage.removeItem(TIMER_STORAGE_KEY);
    } catch (error) {
      console.error('Failed to remove timer from storage:', error);
    }
  }
}
