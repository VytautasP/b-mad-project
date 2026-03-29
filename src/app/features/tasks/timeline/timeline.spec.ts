import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { TimelineComponent } from './timeline';
import { TaskService, TimelineTask } from '../services/task.service';
import { Task, TaskPriority, TaskStatus, TaskType } from '../../../shared/models/task.model';

describe('TimelineComponent', () => {
  let component: TimelineComponent;
  let fixture: ComponentFixture<TimelineComponent>;
  let mockTaskService: {
    getTimelineTasks: ReturnType<typeof vi.fn>;
    getTaskById: ReturnType<typeof vi.fn>;
  };
  let mockDialog: { open: ReturnType<typeof vi.fn> };
  let mockRouter: { navigate: ReturnType<typeof vi.fn> };

  const mockTimelineTask: TimelineTask = {
    id: '1',
    name: 'Test Task',
    startDate: '2026-01-01T00:00:00.000Z',
    endDate: '2026-01-15T00:00:00.000Z',
    duration: 14,
    status: TaskStatus.InProgress,
    priority: TaskPriority.Medium,
    type: TaskType.Task,
    progress: 50,
    parentTaskId: null,
    groupName: 'Launch',
    isGroup: false,
    assignees: []
  };

  const mockParentTask: TimelineTask = {
    ...mockTimelineTask,
    id: 'parent-1',
    name: 'Launch',
    isGroup: true,
    parentTaskId: null,
    groupName: null
  };

  const mockTaskDetails: Task = {
    id: '1',
    name: 'Test Task',
    description: 'Timeline detail',
    parentTaskId: null,
    hasChildren: false,
    createdByUserId: 'user-1',
    createdByUserName: 'Jane Doe',
    createdDate: new Date('2026-01-01'),
    modifiedDate: new Date('2026-01-02'),
    dueDate: new Date('2026-01-15'),
    priority: TaskPriority.Medium,
    status: TaskStatus.InProgress,
    progress: 50,
    type: TaskType.Task,
    isDeleted: false,
    assignees: [],
    directLoggedMinutes: 0,
    childrenLoggedMinutes: 0,
    totalLoggedMinutes: 0
  };

  beforeEach(async () => {
    sessionStorage.clear();

    mockTaskService = {
      getTimelineTasks: vi.fn().mockReturnValue(of([mockParentTask, mockTimelineTask])),
      getTaskById: vi.fn().mockReturnValue(of(mockTaskDetails))
    };
    mockDialog = {
      open: vi.fn().mockReturnValue({ afterClosed: () => of(null) })
    };
    mockRouter = {
      navigate: vi.fn().mockResolvedValue(true)
    };

    await TestBed.configureTestingModule({
      imports: [TimelineComponent],
      providers: [
        { provide: TaskService, useValue: mockTaskService },
        { provide: MatDialog, useValue: mockDialog },
        { provide: Router, useValue: mockRouter }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TimelineComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should restore zoom level from session storage on init', () => {
    sessionStorage.setItem('timeline-zoom', 'day');

    component.ngOnInit();

    expect(component.viewMode()).toBe('day');
  });

  it('should load timeline tasks and build visible rows on init', () => {
    fixture.detectChanges();

    expect(mockTaskService.getTimelineTasks).toHaveBeenCalled();
    expect(component.allTasks().length).toBe(2);
    expect(component.groups().length).toBe(1);
    expect(component.visibleRows().length).toBe(3);
  });

  it('should persist zoom level when changing view mode', () => {
    component.changeViewMode('month');

    expect(sessionStorage.getItem('timeline-zoom')).toBe('month');
    expect(component.viewMode()).toBe('month');
  });

  it('should toggle group expansion', () => {
    fixture.detectChanges();
    const group = component.groups()[0];

    component.toggleGroup(group);

    expect(component.groups()[0].expanded).toBe(false);
  });

  it('should open task details dialog when a timeline task is clicked', () => {
    component.onTaskClick(mockTimelineTask);

    expect(mockTaskService.getTaskById).toHaveBeenCalledWith('1');
    expect(mockDialog.open).toHaveBeenCalled();
  });

  it('should navigate to task list date-edit context from empty-state CTA', () => {
    component.onAddDueDateCta();

    expect(mockRouter.navigate).toHaveBeenCalledWith(['/tasks'], {
      queryParams: {
        openTaskForm: 'true',
        focusField: 'dueDate',
        returnTo: 'timeline'
      }
    });
  });

  it('should track tasks without usable due dates when loading timeline data', () => {
    mockTaskService.getTimelineTasks.mockReturnValue(of([
      mockTimelineTask,
      { ...mockTimelineTask, id: '2', name: 'No due date task', endDate: mockTimelineTask.startDate },
      { ...mockTimelineTask, id: '3', name: 'Missing due date', endDate: '' }
    ]));

    component.loadTimelineData();

    expect(component.allTasks().length).toBe(3);
    expect(component.noDueDateCount()).toBe(2);
  });
});
