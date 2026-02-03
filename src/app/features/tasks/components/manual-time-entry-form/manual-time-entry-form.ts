import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { TimeTrackingService } from '../../../../core/services/time-tracking.service';
import { NotificationService } from '../../../../core/services/notification.service';

export interface ManualTimeEntryFormData {
  taskId: string;
}

@Component({
  selector: 'app-manual-time-entry-form',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatIconModule
  ],
  templateUrl: './manual-time-entry-form.html',
  styleUrl: './manual-time-entry-form.css',
})
export class ManualTimeEntryForm implements OnInit {
  private readonly dialogRef = inject(MatDialogRef<ManualTimeEntryForm>);
  private readonly data: ManualTimeEntryFormData = inject(MAT_DIALOG_DATA);
  private readonly fb = inject(FormBuilder);
  private readonly timeTrackingService = inject(TimeTrackingService);
  private readonly notificationService = inject(NotificationService);

  timeEntryForm!: FormGroup;
  isSubmitting = false;

  ngOnInit(): void {
    this.timeEntryForm = this.fb.group({
      hours: [0, [Validators.required, Validators.min(0), Validators.max(23)]],
      minutes: [0, [Validators.required, Validators.min(0), Validators.max(59)]],
      note: ['', [Validators.maxLength(500)]],
      date: [new Date(), Validators.required]
    }, { validators: this.totalTimeValidator });
  }

  /**
   * Custom validator to ensure total time is > 0 and < 24 hours (1440 minutes)
   */
  private totalTimeValidator(control: AbstractControl): ValidationErrors | null {
    const hours = control.get('hours')?.value || 0;
    const minutes = control.get('minutes')?.value || 0;
    const totalMinutes = (hours * 60) + minutes;

    if (totalMinutes <= 0) {
      return { totalTimeZero: true };
    }

    if (totalMinutes >= 1440) {
      return { totalTimeTooLarge: true };
    }

    return null;
  }

  /**
   * Quick log button handlers
   */
  setQuickLog(minutes: number): void {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    this.timeEntryForm.patchValue({
      hours,
      minutes: mins
    });
  }

  onSubmit(): void {
    if (this.timeEntryForm.invalid) {
      this.timeEntryForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    const formValue = this.timeEntryForm.value;
    const totalMinutes = (formValue.hours * 60) + formValue.minutes;

    this.timeTrackingService.logTime(
      this.data.taskId,
      totalMinutes,
      formValue.note,
      'Manual'
    ).subscribe({
      next: (entry) => {
        this.notificationService.showSuccess('Time logged successfully');
        this.dialogRef.close(entry);
      },
      error: (error) => {
        console.error('Failed to log time:', error);
        this.notificationService.showError('Failed to log time. Please try again.');
        this.isSubmitting = false;
      }
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  getTotalTimeError(): string {
    if (this.timeEntryForm.hasError('totalTimeZero')) {
      return 'Total time must be greater than 0 minutes';
    }
    if (this.timeEntryForm.hasError('totalTimeTooLarge')) {
      return 'Total time must be less than 24 hours';
    }
    return '';
  }
}
