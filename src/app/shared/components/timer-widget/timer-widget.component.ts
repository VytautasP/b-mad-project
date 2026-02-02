import { Component, inject, computed, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TimerStateService } from '../../../core/services/state/timer-state.service';
import { TimeTrackingService } from '../../../core/services/time-tracking.service';
import { TaskService } from '../../../features/tasks/services/task.service';
import { StopTimerDialogComponent, StopTimerDialogData, StopTimerDialogResult } from '../stop-timer-dialog/stop-timer-dialog.component';
import { NotificationService } from '../../../core/services/notification.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-timer-widget',
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatTooltipModule
  ],
  templateUrl: './timer-widget.component.html',
  styleUrl: './timer-widget.component.scss'
})
export class TimerWidgetComponent implements OnDestroy {
  private timerService = inject(TimerStateService);
  private timeTrackingService = inject(TimeTrackingService);
  private taskService = inject(TaskService);
  private dialog = inject(MatDialog);
  private notificationService = inject(NotificationService);
  
  protected timerState = computed(() => {
    return this.timerService.timer$;
  });
  
  private subscription?: Subscription;
  protected currentState: any = null;

  constructor() {
    this.subscription = this.timerService.timer$.subscribe(state => {
      this.currentState = state;
    });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  protected formatTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    return `${this.pad(hours)}:${this.pad(minutes)}:${this.pad(secs)}`;
  }

  private pad(num: number): string {
    return num.toString().padStart(2, '0');
  }

  protected onPause(): void {
    this.timerService.pauseTimer();
  }

  protected onResume(): void {
    this.timerService.resumeTimer();
  }

  protected onStop(): void {
    const elapsedMinutes = this.timerService.stopTimer();
    
    const dialogRef = this.dialog.open<StopTimerDialogComponent, StopTimerDialogData, StopTimerDialogResult>(
      StopTimerDialogComponent,
      {
        width: '400px',
        data: { elapsedMinutes }
      }
    );

    dialogRef.afterClosed().subscribe(result => {
      if (result?.confirmed && this.currentState?.taskId) {
        this.timeTrackingService.logTime(
          this.currentState.taskId, 
          elapsedMinutes, 
          result.note || '', 
          'Timer'
        ).subscribe({
          next: () => {
            this.notificationService.showSuccess(`Logged ${elapsedMinutes} minutes to task`);
            // Refresh task list to update TotalLoggedMinutes display
            this.taskService.getTasks().subscribe({
              next: () => {
                console.log('Tasks refreshed after timer save');
              },
              error: (err) => {
                console.error('Failed to refresh tasks:', err);
              }
            });
          },
          error: (error) => {
            this.notificationService.showError('Failed to save time entry');
            console.error('Error saving time entry:', error);
          }
        });
      }
    });
  }
}
