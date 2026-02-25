import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';
import { TimeEntryList } from './time-entry-list';
import { TimeTrackingService } from '../../../../core/services/time-tracking.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { AuthService } from '../../../../core/services/auth.service';
import { TimeEntryResponseDto } from '../../../../shared/models/time-entry.model';

describe('TimeEntryList', () => {
  let component: TimeEntryList;
  let fixture: ComponentFixture<TimeEntryList>;
  let mockTimeTrackingService: any;
  let mockNotificationService: any;
  let mockAuthService: any;
  let mockDialog: any;

  const mockTimeEntries: TimeEntryResponseDto[] = [
    {
      id: 'entry-1',
      taskId: 'task-1',
      userId: 'user-1',
      userName: 'John Doe',
      minutes: 90,
      entryDate: '2026-02-03T10:00:00Z',
      note: 'Worked on feature',
      entryType: 'Manual',
      createdAt: '2026-02-03T10:00:00Z'
    },
    {
      id: 'entry-2',
      taskId: 'task-1',
      userId: 'user-2',
      userName: 'Jane Smith',
      minutes: 120,
      entryDate: '2026-02-02T10:00:00Z',
      note: 'Code review',
      entryType: 'Timer',
      createdAt: '2026-02-02T10:00:00Z'
    }
  ];

  beforeEach(async () => {
    mockTimeTrackingService = { getTaskTimeEntries: vi.fn(), deleteTimeEntry: vi.fn() };
    mockNotificationService = { showSuccess: vi.fn(), showError: vi.fn() };
    mockAuthService = { getCurrentUser: vi.fn() };
    mockDialog = { open: vi.fn() };

    mockAuthService.getCurrentUser.mockReturnValue({ id: 'user-1', email: 'test@test.com', userName: 'Test User' });

    await TestBed.configureTestingModule({
      imports: [
        TimeEntryList,
        MatListModule,
        MatIconModule,
        MatButtonModule
      ],
      providers: [
        { provide: TimeTrackingService, useValue: mockTimeTrackingService },
        { provide: NotificationService, useValue: mockNotificationService },
        { provide: AuthService, useValue: mockAuthService },
        { provide: MatDialog, useValue: mockDialog }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TimeEntryList);
    component = fixture.componentInstance;
    component.taskId = 'task-1';
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Initialization', () => {
    it('should load time entries on init', () => {
      mockTimeTrackingService.getTaskTimeEntries.mockReturnValue(of(mockTimeEntries));
      component.ngOnInit();
      expect(mockTimeTrackingService.getTaskTimeEntries).toHaveBeenCalledWith('task-1');
      expect(component.timeEntries().length).toBe(2);
    });

    it('should sort time entries by date descending', () => {
      mockTimeTrackingService.getTaskTimeEntries.mockReturnValue(of(mockTimeEntries));
      component.ngOnInit();
      const entries = component.timeEntries();
      expect(entries[0].id).toBe('entry-1'); // Most recent first
      expect(entries[1].id).toBe('entry-2');
    });

    it('should handle error loading time entries', () => {
      mockTimeTrackingService.getTaskTimeEntries.mockReturnValue(throwError(() => new Error('API Error')));
      component.ngOnInit();
      expect(mockNotificationService.showError).toHaveBeenCalledWith('Failed to load time entries');
    });
  });

  describe('Duration Formatting', () => {
    beforeEach(() => {
      mockTimeTrackingService.getTaskTimeEntries.mockReturnValue(of([]));
      component.ngOnInit();
    });

    it('should format 0 minutes as "0m"', () => {
      expect(component.formatDuration(0)).toBe('0m');
    });

    it('should format minutes only', () => {
      expect(component.formatDuration(30)).toBe('30m');
    });

    it('should format hours only', () => {
      expect(component.formatDuration(120)).toBe('2h');
    });

    it('should format hours and minutes', () => {
      expect(component.formatDuration(90)).toBe('1h 30m');
    });

    it('should format large durations', () => {
      expect(component.formatDuration(1440)).toBe('24h');
    });
  });

  describe('Total Logged Time', () => {
    it('should calculate total logged time', () => {
      mockTimeTrackingService.getTaskTimeEntries.mockReturnValue(of(mockTimeEntries));
      component.ngOnInit();
      expect(component.getTotalLoggedTime()).toBe('3h 30m'); // 90 + 120 = 210 minutes
    });

    it('should return "0m" when no entries', () => {
      mockTimeTrackingService.getTaskTimeEntries.mockReturnValue(of([]));
      component.ngOnInit();
      expect(component.getTotalLoggedTime()).toBe('0m');
    });
  });

  describe('Entry Type Icon', () => {
    beforeEach(() => {
      mockTimeTrackingService.getTaskTimeEntries.mockReturnValue(of([]));
      component.ngOnInit();
    });

    it('should return timer icon for Timer entries', () => {
      expect(component.getEntryTypeIcon('Timer')).toBe('timer');
    });

    it('should return edit icon for Manual entries', () => {
      expect(component.getEntryTypeIcon('Manual')).toBe('edit');
    });
  });

  describe('Delete Entry', () => {
    beforeEach(() => {
      mockTimeTrackingService.getTaskTimeEntries.mockReturnValue(of(mockTimeEntries));
      component.ngOnInit();
    });

    it('should allow user to delete their own entry', () => {
      expect(component.canDeleteEntry(mockTimeEntries[0])).toBe(true);
    });

    it('should not allow user to delete others entry', () => {
      expect(component.canDeleteEntry(mockTimeEntries[1])).toBe(false);
    });

    it('should open confirmation dialog on delete', () => {
      const mockDialogRef: any = { afterClosed: vi.fn() };
      mockDialogRef.afterClosed.mockReturnValue(of(false));
      mockDialog.open.mockReturnValue(mockDialogRef);

      component.onDeleteEntry(mockTimeEntries[0]);

      expect(mockDialog.open).toHaveBeenCalled();
    });

    it('should delete entry when confirmed', () => {
      const mockDialogRef: any = { afterClosed: vi.fn() };
      mockDialogRef.afterClosed.mockReturnValue(of(true));
      mockDialog.open.mockReturnValue(mockDialogRef);
      mockTimeTrackingService.deleteTimeEntry.mockReturnValue(of(void 0));

      component.onDeleteEntry(mockTimeEntries[0]);

      expect(mockTimeTrackingService.deleteTimeEntry).toHaveBeenCalledWith('entry-1');
      expect(mockNotificationService.showSuccess).toHaveBeenCalledWith('Time entry deleted');
    });

    it('should handle error on delete', () => {
      const mockDialogRef: any = { afterClosed: vi.fn() };
      mockDialogRef.afterClosed.mockReturnValue(of(true));
      mockDialog.open.mockReturnValue(mockDialogRef);
      mockTimeTrackingService.deleteTimeEntry.mockReturnValue(throwError(() => new Error('API Error')));

      component.onDeleteEntry(mockTimeEntries[0]);

      expect(mockNotificationService.showError).toHaveBeenCalledWith('Failed to delete time entry');
    });
  });

  describe('Date Formatting', () => {
    beforeEach(() => {
      mockTimeTrackingService.getTaskTimeEntries.mockReturnValue(of([]));
      component.ngOnInit();
    });

    it('should format date string to locale date', () => {
      const dateString = '2026-02-03T10:00:00Z';
      const result = component.formatDate(dateString);
      expect(result).toBeTruthy(); // Just check it returns something, locale formatting varies
    });
  });
});
