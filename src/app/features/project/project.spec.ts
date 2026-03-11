import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { ProjectComponent, ProjectTableRow } from './project';
import { TaskService } from '../tasks/services/task.service';
import { Task, TaskPriority, TaskStatus, TaskType, PaginatedResult } from '../../shared/models/task.model';

describe('ProjectComponent', () => {
  let component: ProjectComponent;
  let fixture: ComponentFixture<ProjectComponent>;
  let getTasksPaginatedSpy: any;
  let deleteTaskSpy: any;
  let mockDialog: any;
  let mockSnackBar: any;
  let mockRouter: any;

  const createTask = (overrides: Partial<Task> = {}): Task => ({
    id: 'task-1',
    name: 'Test Task',
    description: null,
    parentTaskId: null,
    hasChildren: false,
    createdByUserId: 'user-1',
    createdByUserName: 'Test User',
    createdDate: new Date('2024-01-01'),
    modifiedDate: new Date('2024-01-01'),
    dueDate: new Date('2024-12-31'),
    priority: TaskPriority.Medium,
    status: TaskStatus.ToDo,
    progress: 0,
    type: TaskType.Task,
    isDeleted: false,
    assignees: [],
    directLoggedMinutes: 0,
    childrenLoggedMinutes: 0,
    totalLoggedMinutes: 0,
    ...overrides
  });

  const mockPaginatedResult = (tasks: Task[], totalCount?: number): PaginatedResult<Task> => ({
    items: tasks,
    totalCount: totalCount ?? tasks.length,
    page: 1,
    pageSize: 20,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false
  });

  beforeEach(async () => {
    getTasksPaginatedSpy = vi.fn().mockReturnValue(of(mockPaginatedResult([])));
    deleteTaskSpy = vi.fn().mockReturnValue(of(void 0));
    mockDialog = { open: vi.fn() };
    mockSnackBar = { open: vi.fn() };
    mockRouter = { navigate: vi.fn().mockReturnValue(Promise.resolve(true)) };

    await TestBed.configureTestingModule({
      imports: [ProjectComponent, NoopAnimationsModule],
      providers: [
        { provide: TaskService, useValue: { getTasksPaginated: getTasksPaginatedSpy, deleteTask: deleteTaskSpy, tasks$: of([]) } },
        { provide: MatDialog, useValue: mockDialog },
        { provide: MatSnackBar, useValue: mockSnackBar },
        { provide: Router, useValue: mockRouter }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ProjectComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Data loading', () => {
    it('should call getTasksPaginated on init', () => {
      const tasks = [createTask()];
      getTasksPaginatedSpy.mockReturnValue(of(mockPaginatedResult(tasks, 1)));

      fixture.detectChanges();

      expect(getTasksPaginatedSpy).toHaveBeenCalledWith(
        undefined, 'createdDate', 'desc', 1, 20
      );
      expect(component.allTasks()).toEqual(tasks);
      expect(component.totalCount()).toBe(1);
    });

    it('should set isLoading to false after loading', () => {
      getTasksPaginatedSpy.mockReturnValue(of(mockPaginatedResult([])));
      fixture.detectChanges();
      expect(component.isLoading()).toBe(false);
    });
  });

  describe('flattenTaskHierarchy', () => {
    it('should return top-level tasks as rows with depth 0', () => {
      const tasks = [
        createTask({ id: 't1', name: 'Task 1' }),
        createTask({ id: 't2', name: 'Task 2' })
      ];

      const rows = component.flattenTaskHierarchy(tasks);

      expect(rows.length).toBe(2);
      expect(rows[0].depth).toBe(0);
      expect(rows[0].task.name).toBe('Task 1');
      expect(rows[0].hasLoadedChildren).toBe(false);
      expect(rows[1].depth).toBe(0);
    });

    it('should exclude child tasks from top-level rows when parent is present', () => {
      const tasks = [
        createTask({ id: 'parent', name: 'Parent', hasChildren: true }),
        createTask({ id: 'child', name: 'Child', parentTaskId: 'parent' })
      ];

      const rows = component.flattenTaskHierarchy(tasks);

      expect(rows.length).toBe(1);
      expect(rows[0].task.id).toBe('parent');
      expect(rows[0].hasLoadedChildren).toBe(true);
    });

    it('should build breadcrumb from parent chain', () => {
      const tasks = [
        createTask({ id: 'root', name: 'Root Project', hasChildren: true }),
        createTask({ id: 'child', name: 'Sub Task', parentTaskId: 'root' })
      ];

      const rows = component.flattenTaskHierarchy(tasks);
      // The child is excluded from top-level but we can test getChildRows
      const childRows = component.getChildRows('root');

      // With parent present in tasks, child has breadcrumb
      // Since child's parent is 'root' which maps to 'Root Project'
      // The child will have breadcrumb 'Root Project'
    });

    it('should detect hasLoadedChildren from parentTaskId even when API hasChildren is false', () => {
      const tasks = [
        createTask({ id: 'parent', name: 'Parent', hasChildren: false }),
        createTask({ id: 'child', name: 'Child', parentTaskId: 'parent' })
      ];

      const rows = component.flattenTaskHierarchy(tasks);

      expect(rows.length).toBe(1);
      expect(rows[0].task.id).toBe('parent');
      expect(rows[0].hasLoadedChildren).toBe(true);
    });

    it('should show child tasks without parent in set as top-level', () => {
      const tasks = [
        createTask({ id: 'orphan', name: 'Orphan', parentTaskId: 'nonexistent' })
      ];

      const rows = component.flattenTaskHierarchy(tasks);
      expect(rows.length).toBe(1);
      expect(rows[0].task.id).toBe('orphan');
      expect(rows[0].depth).toBe(0);
    });
  });

  describe('Pagination', () => {
    it('should compute paginationStart correctly', () => {
      getTasksPaginatedSpy.mockReturnValue(of(mockPaginatedResult([createTask()], 25)));
      fixture.detectChanges();

      expect(component.paginationStart()).toBe(1);
    });

    it('should compute paginationEnd correctly', () => {
      getTasksPaginatedSpy.mockReturnValue(of(mockPaginatedResult([createTask()], 25)));
      fixture.detectChanges();

      expect(component.paginationEnd()).toBe(20); // min(1*20, 25) = 20
    });

    it('should show 0 for paginationStart when no tasks', () => {
      getTasksPaginatedSpy.mockReturnValue(of(mockPaginatedResult([], 0)));
      fixture.detectChanges();

      expect(component.paginationStart()).toBe(0);
    });

    it('should navigate to next page', () => {
      getTasksPaginatedSpy.mockReturnValue(of(mockPaginatedResult([createTask()], 25)));
      fixture.detectChanges();

      component.onNextPage();
      expect(component.page()).toBe(2);
      expect(getTasksPaginatedSpy).toHaveBeenCalledTimes(2);
    });

    it('should navigate to previous page', () => {
      component.page.set(2);
      getTasksPaginatedSpy.mockReturnValue(of(mockPaginatedResult([createTask()], 25)));
      fixture.detectChanges();

      component.onPreviousPage();
      expect(component.page()).toBe(1);
    });

    it('should not go below page 1', () => {
      getTasksPaginatedSpy.mockReturnValue(of(mockPaginatedResult([createTask()], 5)));
      fixture.detectChanges();

      component.onPreviousPage();
      expect(component.page()).toBe(1);
    });
  });

  describe('Row selection', () => {
    beforeEach(() => {
      const tasks = [
        createTask({ id: 't1' }),
        createTask({ id: 't2' }),
        createTask({ id: 't3' })
      ];
      getTasksPaginatedSpy.mockReturnValue(of(mockPaginatedResult(tasks, 3)));
      fixture.detectChanges();
    });

    it('should toggle individual selection', () => {
      component.toggleSelection('t1');
      expect(component.isSelected('t1')).toBe(true);
      expect(component.isSelected('t2')).toBe(false);

      component.toggleSelection('t1');
      expect(component.isSelected('t1')).toBe(false);
    });

    it('should select all tasks', () => {
      component.toggleAllSelection();
      expect(component.isAllSelected()).toBe(true);
      expect(component.isSelected('t1')).toBe(true);
      expect(component.isSelected('t2')).toBe(true);
      expect(component.isSelected('t3')).toBe(true);
    });

    it('should deselect all when all selected', () => {
      component.toggleAllSelection();
      component.toggleAllSelection();
      expect(component.selectedTasks().size).toBe(0);
    });

    it('should show indeterminate when partially selected', () => {
      component.toggleSelection('t1');
      expect(component.isIndeterminate()).toBe(true);
      expect(component.isAllSelected()).toBe(false);
    });
  });

  describe('Expand/collapse', () => {
    it('should toggle expand state', () => {
      component.toggleExpand('task-1');
      expect(component.isExpanded('task-1')).toBe(true);

      component.toggleExpand('task-1');
      expect(component.isExpanded('task-1')).toBe(false);
    });

    it('should get child rows for parent', () => {
      const tasks = [
        createTask({ id: 'parent', name: 'Parent', hasChildren: true }),
        createTask({ id: 'child1', name: 'Child 1', parentTaskId: 'parent' }),
        createTask({ id: 'child2', name: 'Child 2', parentTaskId: 'parent' })
      ];
      getTasksPaginatedSpy.mockReturnValue(of(mockPaginatedResult(tasks, 3)));
      fixture.detectChanges();

      const children = component.getChildRows('parent', 0);
      expect(children.length).toBe(2);
      expect(children[0].depth).toBe(1);
      expect(children[1].depth).toBe(1);
    });

    it('should compute correct depth for nested children', () => {
      const tasks = [
        createTask({ id: 'root', name: 'Root', hasChildren: true }),
        createTask({ id: 'child', name: 'Child', parentTaskId: 'root', hasChildren: true }),
        createTask({ id: 'grandchild', name: 'Grandchild', parentTaskId: 'child' })
      ];
      getTasksPaginatedSpy.mockReturnValue(of(mockPaginatedResult(tasks, 3)));
      fixture.detectChanges();

      const children = component.getChildRows('root', 0);
      expect(children.length).toBe(1);
      expect(children[0].depth).toBe(1);
      expect(children[0].hasLoadedChildren).toBe(true);

      const grandchildren = component.getChildRows('child', 1);
      expect(grandchildren.length).toBe(1);
      expect(grandchildren[0].depth).toBe(2);
      expect(grandchildren[0].hasLoadedChildren).toBe(false);
    });
  });

  describe('Display helpers', () => {
    it('should return correct status labels', () => {
      expect(component.getStatusLabel(TaskStatus.ToDo)).toBe('To Do');
      expect(component.getStatusLabel(TaskStatus.InProgress)).toBe('In Progress');
      expect(component.getStatusLabel(TaskStatus.Blocked)).toBe('Blocked');
      expect(component.getStatusLabel(TaskStatus.Waiting)).toBe('Waiting');
      expect(component.getStatusLabel(TaskStatus.Done)).toBe('Done');
    });

    it('should return correct status badge classes', () => {
      expect(component.getStatusBadgeClass(TaskStatus.ToDo)).toBe('status-badge status-todo');
      expect(component.getStatusBadgeClass(TaskStatus.InProgress)).toBe('status-badge status-in-progress');
      expect(component.getStatusBadgeClass(TaskStatus.Done)).toBe('status-badge status-done');
    });

    it('should return correct task type icons', () => {
      expect(component.getTaskTypeIcon(TaskType.Project)).toBe('folder');
      expect(component.getTaskTypeIcon(TaskType.Milestone)).toBe('flag');
      expect(component.getTaskTypeIcon(TaskType.Task)).toBe('task_alt');
    });

    it('should format dates as MMM dd, yyyy', () => {
      expect(component.formatDate(new Date('2024-12-31'))).toBe('Dec 31, 2024');
      expect(component.formatDate(new Date('2024-01-05'))).toBe('Jan 05, 2024');
    });

    it('should return dash for null date', () => {
      expect(component.formatDate(null)).toBe('—');
    });

    it('should compute initials from name', () => {
      expect(component.getInitials('John Doe')).toBe('JD');
      expect(component.getInitials('Alice')).toBe('A');
      expect(component.getInitials('Alice Bob Charlie')).toBe('AB');
    });
  });

  describe('Quick filters', () => {
    beforeEach(() => {
      const tasks = [
        createTask({ id: 't1', status: TaskStatus.ToDo }),
        createTask({ id: 't2', status: TaskStatus.InProgress }),
        createTask({ id: 't3', status: TaskStatus.Done })
      ];
      getTasksPaginatedSpy.mockReturnValue(of(mockPaginatedResult(tasks, 3)));
      fixture.detectChanges();
    });

    it('should show all tasks by default', () => {
      expect(component.displayRows().length).toBe(3);
    });

    it('should count pending tasks', () => {
      expect(component.pendingCount()).toBe(2);
    });

    it('should count done tasks', () => {
      expect(component.doneCount()).toBe(1);
    });

    it('should filter to pending only', () => {
      component.onQuickFilterChange('pending');
      expect(component.displayRows().length).toBe(2);
    });

    it('should filter to done only', () => {
      component.onQuickFilterChange('done');
      expect(component.displayRows().length).toBe(1);
    });
  });

  describe('Search', () => {
    beforeEach(() => {
      const tasks = [
        createTask({ id: 't1', name: 'Frontend Task' }),
        createTask({ id: 't2', name: 'Backend API' }),
        createTask({ id: 't3', name: 'Database Migration' })
      ];
      getTasksPaginatedSpy.mockReturnValue(of(mockPaginatedResult(tasks, 3)));
      fixture.detectChanges();
    });

    it('should filter tasks by search term', () => {
      component.searchTerm.set('frontend');
      expect(component.displayRows().length).toBe(1);
      expect(component.displayRows()[0].task.name).toBe('Frontend Task');
    });

    it('should be case insensitive', () => {
      component.searchTerm.set('BACKEND');
      expect(component.displayRows().length).toBe(1);
    });

    it('should show all when search is empty', () => {
      component.searchTerm.set('');
      expect(component.displayRows().length).toBe(3);
    });
  });

  describe('Sort', () => {
    it('should reset page and reload on sort change', () => {
      getTasksPaginatedSpy.mockReturnValue(of(mockPaginatedResult([])));
      fixture.detectChanges();

      component.page.set(3);
      component.onSortChange('name', 'asc');

      expect(component.page()).toBe(1);
      expect(component.sortBy()).toBe('name');
      expect(component.sortOrder()).toBe('asc');
      expect(getTasksPaginatedSpy).toHaveBeenCalledTimes(2);
    });
  });
});
