import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { ManualTimeEntryForm, ManualTimeEntryFormData } from './manual-time-entry-form';
import { TimeTrackingService } from '../../../../core/services/time-tracking.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { TimeEntryResponseDto, EntryType } from '../../../../shared/models/time-entry.model';

describe('ManualTimeEntryForm', () => {
  let component: ManualTimeEntryForm;
  let fixture: ComponentFixture<ManualTimeEntryForm>;
  let mockDialogRef: any;
  let mockTimeTrackingService: any;
  let mockNotificationService: any;
  let mockData: ManualTimeEntryFormData;

  beforeEach(async () => {
    mockDialogRef = { close: vi.fn() };
    mockTimeTrackingService = { logTime: vi.fn() };
    mockNotificationService = { showSuccess: vi.fn(), showError: vi.fn() };
    mockData = { taskId: 'test-task-id' };

    await TestBed.configureTestingModule({
      imports: [
        ManualTimeEntryForm,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatDatepickerModule,
        MatNativeDateModule,
        MatIconModule,
        NoopAnimationsModule
      ],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: mockData },
        { provide: TimeTrackingService, useValue: mockTimeTrackingService },
        { provide: NotificationService, useValue: mockNotificationService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ManualTimeEntryForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form with default values', () => {
    expect(component.timeEntryForm.get('hours')?.value).toBe(0);
    expect(component.timeEntryForm.get('minutes')?.value).toBe(0);
    expect(component.timeEntryForm.get('note')?.value).toBe('');
    expect(component.timeEntryForm.get('date')?.value).toBeInstanceOf(Date);
  });

  describe('Form Validation', () => {
    it('should be invalid when total time is 0', () => {
      component.timeEntryForm.patchValue({ hours: 0, minutes: 0 });
      expect(component.timeEntryForm.hasError('totalTimeZero')).toBe(true);
    });

    it('should be invalid when total time is >= 24 hours', () => {
      component.timeEntryForm.patchValue({ hours: 24, minutes: 0 });
      expect(component.timeEntryForm.hasError('totalTimeTooLarge')).toBe(true);
    });

    it('should be invalid when hours exceed 23', () => {
      component.timeEntryForm.patchValue({ hours: 25, minutes: 0 });
      expect(component.timeEntryForm.get('hours')?.hasError('max')).toBe(true);
    });

    it('should be invalid when minutes exceed 59', () => {
      component.timeEntryForm.patchValue({ hours: 0, minutes: 60 });
      expect(component.timeEntryForm.get('minutes')?.hasError('max')).toBe(true);
    });

    it('should be valid for 1 hour 30 minutes', () => {
      component.timeEntryForm.patchValue({ hours: 1, minutes: 30 });
      expect(component.timeEntryForm.valid).toBe(true);
    });

    it('should be valid for 23 hours 59 minutes', () => {
      component.timeEntryForm.patchValue({ hours: 23, minutes: 59 });
      expect(component.timeEntryForm.valid).toBe(true);
    });

    it('should invalidate note over 500 characters', () => {
      const longNote = 'a'.repeat(501);
      component.timeEntryForm.patchValue({ note: longNote });
      expect(component.timeEntryForm.get('note')?.hasError('maxlength')).toBe(true);
    });
  });

  describe('Quick Log Buttons', () => {
    it('should set 15 minutes', () => {
      component.setQuickLog(15);
      expect(component.timeEntryForm.get('hours')?.value).toBe(0);
      expect(component.timeEntryForm.get('minutes')?.value).toBe(15);
    });

    it('should set 30 minutes', () => {
      component.setQuickLog(30);
      expect(component.timeEntryForm.get('hours')?.value).toBe(0);
      expect(component.timeEntryForm.get('minutes')?.value).toBe(30);
    });

    it('should set 1 hour', () => {
      component.setQuickLog(60);
      expect(component.timeEntryForm.get('hours')?.value).toBe(1);
      expect(component.timeEntryForm.get('minutes')?.value).toBe(0);
    });

    it('should set 2 hours', () => {
      component.setQuickLog(120);
      expect(component.timeEntryForm.get('hours')?.value).toBe(2);
      expect(component.timeEntryForm.get('minutes')?.value).toBe(0);
    });
  });

  describe('Submit', () => {
    it('should not submit if form is invalid', () => {
      component.timeEntryForm.patchValue({ hours: 0, minutes: 0 });
      component.onSubmit();
      expect(mockTimeTrackingService.logTime).not.toHaveBeenCalled();
    });

    it('should submit valid form and close dialog', () => {
      const mockResponse: TimeEntryResponseDto = {
        id: 'entry-1',
        taskId: 'test-task-id',
        userId: 'user-1',
        userName: 'Test User',
        minutes: 90,
        entryDate: new Date().toISOString(),
        note: 'Test note',
        entryType: 'Manual',
        createdAt: new Date().toISOString()
      };

      mockTimeTrackingService.logTime.mockReturnValue(of(mockResponse));
      component.timeEntryForm.patchValue({ hours: 1, minutes: 30, note: 'Test note' });
      
      component.onSubmit();
      
      expect(mockTimeTrackingService.logTime).toHaveBeenCalledWith(
        'test-task-id',
        90,
        'Test note',
        'Manual'
      );
      expect(mockNotificationService.showSuccess).toHaveBeenCalledWith('Time logged successfully');
      expect(mockDialogRef.close).toHaveBeenCalledWith(mockResponse);
    });

    it('should handle error on submit', () => {
      mockTimeTrackingService.logTime.mockReturnValue(throwError(() => new Error('API Error')));
      component.timeEntryForm.patchValue({ hours: 1, minutes: 0 });
      
      component.onSubmit();
      
      expect(mockNotificationService.showError).toHaveBeenCalledWith('Failed to log time. Please try again.');
      expect(mockDialogRef.close).not.toHaveBeenCalled();
    });
  });

  describe('Cancel', () => {
    it('should close dialog without data', () => {
      component.onCancel();
      expect(mockDialogRef.close).toHaveBeenCalledWith();
    });
  });

  describe('Error Messages', () => {
    it('should return correct error for zero time', () => {
      component.timeEntryForm.patchValue({ hours: 0, minutes: 0 });
      expect(component.getTotalTimeError()).toBe('Total time must be greater than 0 minutes');
    });

    it('should return correct error for time too large', () => {
      component.timeEntryForm.patchValue({ hours: 24, minutes: 0 });
      expect(component.getTotalTimeError()).toBe('Total time must be less than 24 hours');
    });

    it('should return empty string when no error', () => {
      component.timeEntryForm.patchValue({ hours: 1, minutes: 0 });
      expect(component.getTotalTimeError()).toBe('');
    });
  });
});
