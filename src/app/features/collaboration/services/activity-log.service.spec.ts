import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { ActivityLogService } from './activity-log.service';
import { ActivityType, PaginatedActivityLogResult } from '../../../shared/models/activity-log.model';
import { environment } from '../../../../environments/environment';

describe('ActivityLogService', () => {
  let service: ActivityLogService;
  let httpMock: HttpTestingController;
  const apiUrl = environment.apiUrl + '/api';

  const mockResult: PaginatedActivityLogResult = {
    items: [
      {
        id: 'activity-1',
        taskId: 'task-1',
        userId: 'user-1',
        userName: 'Jane Doe',
        activityType: ActivityType.StatusChanged,
        description: 'Status changed from In Progress to Done',
        changedField: 'Status',
        oldValue: 'InProgress',
        newValue: 'Done',
        timestamp: '2026-02-12T10:15:00Z'
      }
    ],
    totalCount: 1,
    page: 1,
    pageSize: 20,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), ActivityLogService]
    });

    service = TestBed.inject(ActivityLogService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should request task activity with default pagination', () => {
    service.getTaskActivity('task-1').subscribe((result) => {
      expect(result).toEqual(mockResult);
    });

    const req = httpMock.expectOne((request) => {
      return (
        request.url === apiUrl + '/tasks/task-1/activity' &&
        request.params.get('page') === '1' &&
        request.params.get('pageSize') === '20'
      );
    });

    expect(req.request.method).toBe('GET');
    req.flush(mockResult);
  });

  it('should request task activity with explicit pagination', () => {
    service.getTaskActivity('task-42', 3, 50).subscribe((result) => {
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(20);
    });

    const req = httpMock.expectOne((request) => {
      return (
        request.url === apiUrl + '/tasks/task-42/activity' &&
        request.params.get('page') === '3' &&
        request.params.get('pageSize') === '50'
      );
    });

    expect(req.request.method).toBe('GET');
    req.flush(mockResult);
  });

  it('should propagate API errors', () => {
    service.getTaskActivity('task-1').subscribe({
      error: (error) => {
        expect(error).toBeTruthy();
      }
    });

    const req = httpMock.expectOne(apiUrl + '/tasks/task-1/activity?page=1&pageSize=20');
    req.flush('Server Error', { status: 500, statusText: 'Server Error' });
  });
});
