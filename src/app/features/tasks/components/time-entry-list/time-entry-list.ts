import { Component, Input, Output, EventEmitter, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { TimeEntryResponseDto } from '../../../../shared/models/time-entry.model';
import { TimeTrackingService } from '../../../../core/services/time-tracking.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { AuthService } from '../../../../core/services/auth.service';
import { ConfirmationDialogComponent, ConfirmationDialogData } from '../../../../shared/components/confirmation-dialog/confirmation-dialog.component';

@Component({
  selector: 'app-time-entry-list',
  imports: [
    CommonModule,
    MatListModule,
    MatIconModule,
    MatButtonModule
  ],
  templateUrl: './time-entry-list.html',
  styleUrl: './time-entry-list.css',
})
export class TimeEntryList implements OnInit {
  @Input() taskId!: string;
  @Output() timeEntryDeleted = new EventEmitter<void>();

  private readonly timeTrackingService = inject(TimeTrackingService);
  private readonly notificationService = inject(NotificationService);
  private readonly authService = inject(AuthService);
  private readonly dialog = inject(MatDialog);

  timeEntries = signal<TimeEntryResponseDto[]>([]);
  isLoading = signal(false);
  hasLoadError = signal(false);
  currentUserId: string | null = null;

  ngOnInit(): void {
    this.currentUserId = this.authService.getCurrentUser()?.id || null;
    this.loadTimeEntries();
  }

  loadTimeEntries(): void {
    if (this.isLoading()) {
      return;
    }

    this.hasLoadError.set(false);
    this.isLoading.set(true);
    this.timeTrackingService.getTaskTimeEntries(this.taskId).subscribe({
      next: (entries) => {
        // Sort by date descending (most recent first)
        const sortedEntries = entries.sort((a, b) => 
          new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime()
        );
        this.timeEntries.set(sortedEntries);
        this.hasLoadError.set(false);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Failed to load time entries:', error);
        this.hasLoadError.set(true);
        this.isLoading.set(false);
      }
    });
  }

  onRetryLoadTimeEntries(): void {
    this.loadTimeEntries();
  }

  getTotalLoggedTime(): string {
    const totalMinutes = this.timeEntries().reduce((sum, entry) => sum + entry.minutes, 0);
    return this.formatDuration(totalMinutes);
  }

  formatDuration(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}m`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString();
  }

  getEntryTypeIcon(entryType: string): string {
    return entryType === 'Timer' ? 'timer' : 'edit';
  }

  canDeleteEntry(entry: TimeEntryResponseDto): boolean {
    return entry.userId === this.currentUserId;
  }

  onDeleteEntry(entry: TimeEntryResponseDto): void {
    const dialogData: ConfirmationDialogData = {
      title: 'Delete Time Entry',
      message: `Are you sure you want to delete this time entry (${this.formatDuration(entry.minutes)})?`,
      confirmText: 'Delete',
      cancelText: 'Cancel'
    };

    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '400px',
      data: dialogData
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed === true) {
        this.deleteEntry(entry.id);
      }
    });
  }

  private deleteEntry(entryId: string): void {
    this.timeTrackingService.deleteTimeEntry(entryId).subscribe({
      next: () => {
        this.notificationService.showSuccess('Time entry deleted');
        this.loadTimeEntries();
        this.timeEntryDeleted.emit();
      },
      error: (error) => {
        console.error('Failed to delete time entry:', error);
        this.notificationService.showError('Failed to delete time entry');
      }
    });
  }
}
