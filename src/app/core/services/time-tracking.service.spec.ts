import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TimeTrackingService } from './time-tracking.service';
import { TimeEntryCreateDto, TimeEntryResponseDto, EntryType } from '../../shared/models/time-entry.model';
import { environment } from '../../../environments/environment';

describe('TimeTrackingService', () => {
  let service: TimeTrackingService;
  let httpMock: HttpTestingController;
  const apiUrl = `${environment.apiUrl}/api/tasks`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [TimeTrackingService]
    });
    service = TestBed.inject(TimeTrackingService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('logTime', () => {
    it('should log time with Manual entry type', () => {
      const taskId = 'task-1';
      const minutes = 90;
      const note = 'Test note';
      const mockResponse: TimeEntryResponseDto = {
        id: 'entry-1',
        taskId,
        userId: 'user-1',
        userName: 'Test User',
        minutes,
        entryDate: new Date().toISOString(),
        note,
        entryType: 'Manual',
        createdAt: new Date().toISOString()
      };

      service.logTime(taskId, minutes, note, 'Manual').subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${apiUrl}/${taskId}/timeentries`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body.minutes).toBe(minutes);
      expect(req.request.body.note).toBe(note);
      expect(req.request.body.entryType).toBe(EntryType.Manual);
      req.flush(mockResponse);
    });

    it('should log time with Timer entry type', () => {
      const taskId = 'task-1';
      const minutes = 60;
      const note = 'Timer note';

      service.logTime(taskId, minutes, note, 'Timer').subscribe();

      const req = httpMock.expectOne(`${apiUrl}/${taskId}/timeentries`);
      expect(req.request.body.entryType).toBe(EntryType.Timer);
      req.flush({});
    });

    it('should handle empty note', () => {
      const taskId = 'task-1';
      const minutes = 30;

      service.logTime(taskId, minutes, '', 'Manual').subscribe();

      const req = httpMock.expectOne(`${apiUrl}/${taskId}/timeentries`);
      expect(req.request.body.note).toBeUndefined();
      req.flush({});
    });

    it('should handle error', () => {
      const taskId = 'task-1';
      const errorMessage = 'Failed to log time';

      service.logTime(taskId, 60, 'Note', 'Manual').subscribe({
        next: () => {
          throw new Error('should have failed');
        },
        error: (error) => {
          expect(error.status).toBe(500);
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/${taskId}/timeentries`);
      req.flush(errorMessage, { status: 500, statusText: 'Server Error' });
    });
  });

  describe('getTaskTimeEntries', () => {
    it('should retrieve time entries for a task', () => {
      const taskId = 'task-1';
      const mockEntries: TimeEntryResponseDto[] = [
        {
          id: 'entry-1',
          taskId,
          userId: 'user-1',
          userName: 'User 1',
          minutes: 60,
          entryDate: new Date().toISOString(),
          note: 'Note 1',
          entryType: 'Manual',
          createdAt: new Date().toISOString()
        },
        {
          id: 'entry-2',
          taskId,
          userId: 'user-2',
          userName: 'User 2',
          minutes: 120,
          entryDate: new Date().toISOString(),
          note: 'Note 2',
          entryType: 'Timer',
          createdAt: new Date().toISOString()
        }
      ];

      service.getTaskTimeEntries(taskId).subscribe(entries => {
        expect(entries.length).toBe(2);
        expect(entries).toEqual(mockEntries);
      });

      const req = httpMock.expectOne(`${apiUrl}/${taskId}/timeentries`);
      expect(req.request.method).toBe('GET');
      req.flush(mockEntries);
    });

    it('should return empty array when no entries', () => {
      const taskId = 'task-1';

      service.getTaskTimeEntries(taskId).subscribe(entries => {
        expect(entries.length).toBe(0);
      });

      const req = httpMock.expectOne(`${apiUrl}/${taskId}/timeentries`);
      req.flush([]);
    });

    it('should handle error', () => {
      const taskId = 'task-1';

      service.getTaskTimeEntries(taskId).subscribe({
        next: () => {
          throw new Error('should have failed');
        },
        error: (error) => {
          expect(error.status).toBe(404);
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/${taskId}/timeentries`);
      req.flush('Not found', { status: 404, statusText: 'Not Found' });
    });
  });

  describe('deleteTimeEntry', () => {
    it('should delete time entry', () => {
      const entryId = 'entry-1';

      service.deleteTimeEntry(entryId).subscribe(response => {
        expect(response).toBeUndefined();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/timeentries/${entryId}`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });

    it('should handle error', () => {
      const entryId = 'entry-1';

      service.deleteTimeEntry(entryId).subscribe({
        next: () => {
          throw new Error('should have failed');
        },
        error: (error) => {
          expect(error.status).toBe(403);
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/timeentries/${entryId}`);
      req.flush('Forbidden', { status: 403, statusText: 'Forbidden' });
    });
  });
});
