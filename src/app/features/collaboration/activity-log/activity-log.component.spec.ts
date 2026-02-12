import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { ActivityLogComponent } from './activity-log.component';
import { ActivityLogService } from '../services/activity-log.service';
import { ActivityType, PaginatedActivityLogResult } from '../../../shared/models/activity-log.model';

describe('ActivityLogComponent', () => {
  let component: ActivityLogComponent;
  let fixture: ComponentFixture<ActivityLogComponent>;
  let mockService: { getTaskActivity: ReturnType<typeof vi.fn> };

  const pageOne: PaginatedActivityLogResult = {
    items: [
      {
        id: 'a-1',
        taskId: 'task-1',
        userId: 'u-1',
        userName: 'User One',
        activityType: ActivityType.Created,
        description: 'Task created',
        changedField: null,
        oldValue: null,
        newValue: null,
        timestamp: '2026-02-12T10:00:00Z'
      }
    ],
    totalCount: 2,
    page: 1,
    pageSize: 20,
    totalPages: 2,
    hasNextPage: true,
    hasPreviousPage: false
  };

  const pageTwo: PaginatedActivityLogResult = {
    ...pageOne,
    items: [
      {
        id: 'a-2',
        taskId: 'task-1',
        userId: 'u-2',
        userName: 'User Two',
        activityType: ActivityType.Commented,
        description: 'Comment added',
        changedField: null,
        oldValue: null,
        newValue: null,
        timestamp: '2026-02-12T09:00:00Z'
      }
    ],
    page: 2,
    hasNextPage: false,
    hasPreviousPage: true
  };

  beforeEach(async () => {
    mockService = {
      getTaskActivity: vi.fn().mockReturnValue(of(pageOne))
    };

    await TestBed.configureTestingModule({
      imports: [ActivityLogComponent],
      providers: [{ provide: ActivityLogService, useValue: mockService }]
    }).compileComponents();

    fixture = TestBed.createComponent(ActivityLogComponent);
    component = fixture.componentInstance;
    component.taskId = 'task-1';
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load initial activity on init', () => {
    fixture.detectChanges();
    expect(mockService.getTaskActivity).toHaveBeenCalledWith('task-1', 1, 20);
    expect(component.activities().length).toBe(1);
  });

  it('should show empty state when no activity', () => {
    mockService.getTaskActivity.mockReturnValueOnce(
      of({ ...pageOne, items: [], totalCount: 0, hasNextPage: false })
    );
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.empty-state')?.textContent).toContain('No activity yet');
  });

  it('should append items on load more', () => {
    mockService.getTaskActivity
      .mockReturnValueOnce(of(pageOne))
      .mockReturnValueOnce(of(pageTwo));

    fixture.detectChanges();
    component.onLoadMore();

    expect(mockService.getTaskActivity).toHaveBeenNthCalledWith(2, 'task-1', 2, 20);
    expect(component.activities().length).toBe(2);
  });

  it('should stop loading flags on error', () => {
    mockService.getTaskActivity.mockReturnValueOnce(throwError(() => new Error('fail')));
    fixture.detectChanges();
    expect(component.isLoading()).toBe(false);
  });

  it('should reload when refresh token changes', () => {
    fixture.detectChanges();
    const initialCalls = mockService.getTaskActivity.mock.calls.length;

    component.refreshToken = 2;
    component.ngOnChanges({
      refreshToken: {
        currentValue: 2,
        previousValue: 1,
        firstChange: false,
        isFirstChange: () => false
      }
    });

    expect(mockService.getTaskActivity.mock.calls.length).toBeGreaterThan(initialCalls);
  });
});