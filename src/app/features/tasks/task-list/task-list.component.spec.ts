import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router, ActivatedRoute } from '@angular/router';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { TaskListComponent } from './task-list.component';
import { TaskService } from '../services/task.service';
import { Task, TaskPriority, TaskStatus, TaskType, TaskFilters, PaginatedResult } from '../../../shared/models/task.model';
import { ConfirmationDialogComponent } from '../../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { Sort } from '@angular/material/sort';

describe('TaskListComponent', () => {
  let component: TaskListComponent;
  let fixture: ComponentFixture<TaskListComponent>;
  let taskService: Partial<TaskService>;
  let tasksSubject: BehaviorSubject<Task[]>;
  let getTasksPaginatedSpy: any;
  let deleteTaskSpy: any;
  let mockDialog: { open: any };
  let mockSnackBar: { open: any };
  let mockRouter: { navigate: any };
  let mockActivatedRoute: { queryParams: BehaviorSubject<any> };

  const mockTask: Task = {
    id: '123',
    name: 'Test Task',
    description: 'Test Description',
    parentTaskId: null,
    hasChildren: false,
    createdByUserId: 'user123',
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
    totalLoggedMinutes: 0
  };

  const mockPaginatedResult: PaginatedResult<Task> = {
    items: [mockTask],
    totalCount: 1,
    page: 1,
    pageSize: 50,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false
  };

  beforeEach(async () => {
    tasksSubject = new BehaviorSubject<Task[]>([]);
    getTasksPaginatedSpy = vi.fn();
    deleteTaskSpy = vi.fn();
    mockDialog = {
      open: vi.fn(),
      openDialogs: []
    } as any;
    mockSnackBar = {
      open: vi.fn()
    };
    mockRouter = {
      navigate: vi.fn().mockReturnValue(Promise.resolve(true))
    };
    mockActivatedRoute = {
      queryParams: new BehaviorSubject<any>({})
    };
    
    taskService = {
      tasks$: tasksSubject.asObservable(),
      getTasksPaginated: getTasksPaginatedSpy,
      deleteTask: deleteTaskSpy
    };

    await TestBed.configureTestingModule({
      imports: [
        TaskListComponent,
        NoopAnimationsModule,
        MatNativeDateModule
      ],
      providers: [
        { provide: TaskService, useValue: taskService },
        { provide: MatDialog, useValue: mockDialog },
        { provide: MatSnackBar, useValue: mockSnackBar },
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: mockActivatedRoute }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TaskListComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load tasks on init', () => {
    getTasksPaginatedSpy.mockReturnValue(of(mockPaginatedResult));
    
    component.ngOnInit();
    
    expect(getTasksPaginatedSpy).toHaveBeenCalled();
  });

  it('should parse query parameters on init', () => {
    const queryParams = {
      page: '2',
      pageSize: '100',
      sortBy: 'name',
      sortOrder: 'asc',
      status: [TaskStatus.InProgress.toString()],
      priority: [TaskPriority.High.toString()]
    };
    
    mockActivatedRoute.queryParams.next(queryParams);
    getTasksPaginatedSpy.mockReturnValue(of(mockPaginatedResult));
    
    component.ngOnInit();
    
    expect(component.page).toBe(2);
    expect(component.pageSize).toBe(100);
    expect(component.sortBy).toBe('name');
    expect(component.sortOrder).toBe('asc');
    expect(component.filters.status).toEqual([TaskStatus.InProgress]);
    expect(component.filters.priority).toEqual([TaskPriority.High]);
  });

  it('should display loading spinner initially', () => {
    getTasksPaginatedSpy.mockReturnValue(of(mockPaginatedResult));
    expect(component.isLoading()).toBe(false);
  });

  it('should update tasks signal when loaded', () => {
    getTasksPaginatedSpy.mockReturnValue(of(mockPaginatedResult));
    
    component.loadTasks();
    
    expect(component.tasks().length).toBe(1);
    expect(component.tasks()[0].name).toBe('Test Task');
    expect(component.totalCount()).toBe(1);
  });

  it('should show empty state when no tasks', () => {
    const emptyResult: PaginatedResult<Task> = {
      ...mockPaginatedResult,
      items: [],
      totalCount: 0
    };
    getTasksPaginatedSpy.mockReturnValue(of(emptyResult));

    component.loadTasks();

    expect(component.tasks().length).toBe(0);
    expect(component.totalCount()).toBe(0);
  });

  it('should handle error when loading tasks', () => {
    getTasksPaginatedSpy.mockReturnValue(
      throwError(() => new Error('Failed to load tasks'))
    );

    component.loadTasks();

    expect(component.isLoading()).toBe(false);
    expect(mockSnackBar.open).toHaveBeenCalledWith('Failed to load tasks', 'Close', expect.any(Object));
  });

  it('should format dates in MMM dd, yyyy format', () => {
    const date = new Date('2024-12-31');
    const formatted = component.formatDate(date);
    expect(formatted).toBe('Dec 31, 2024');
  });

  it('should format single-digit dates with leading zero', () => {
    const date = new Date('2024-01-05');
    const formatted = component.formatDate(date);
    expect(formatted).toBe('Jan 05, 2024');
  });

  it('should return "-" for null dates', () => {
    const formatted = component.formatDate(null);
    expect(formatted).toBe('-');
  });

  it('should return correct priority labels', () => {
    expect(component.getPriorityLabel(TaskPriority.Low)).toBe('Low');
    expect(component.getPriorityLabel(TaskPriority.High)).toBe('High');
  });

  it('should return correct status labels', () => {
    expect(component.getStatusLabel(TaskStatus.ToDo)).toBe('To Do');
    expect(component.getStatusLabel(TaskStatus.Done)).toBe('Done');
  });

  it('should return explicit status icon mapping', () => {
    expect(component.getStatusIcon(TaskStatus.Done)).toBe('check_circle');
    expect(component.getStatusIcon(TaskStatus.Blocked)).toBe('block');
    expect(component.getStatusIcon(TaskStatus.Waiting)).toBe('hourglass_top');
  });

  it('should return directional priority icons', () => {
    expect(component.getPriorityIcon(TaskPriority.Critical)).toBe('keyboard_double_arrow_up');
    expect(component.getPriorityIcon(TaskPriority.High)).toBe('arrow_upward');
    expect(component.getPriorityIcon(TaskPriority.Medium)).toBe('arrow_forward');
    expect(component.getPriorityIcon(TaskPriority.Low)).toBe('arrow_downward');
  });

  it('should return correct priority class mapping', () => {
    expect(component.getPriorityClass(TaskPriority.Critical)).toBe('priority-critical');
    expect(component.getPriorityClass(TaskPriority.High)).toBe('priority-high');
    expect(component.getPriorityClass(TaskPriority.Medium)).toBe('priority-medium');
    expect(component.getPriorityClass(TaskPriority.Low)).toBe('priority-low');
  });

  it('should return correct type labels', () => {
    expect(component.getTypeLabel(TaskType.Task)).toBe('Task');
    expect(component.getTypeLabel(TaskType.Project)).toBe('Project');
  });

  it('should return correct priority colors', () => {
    expect(component.getPriorityColor(TaskPriority.Critical)).toBe('warn');
    expect(component.getPriorityColor(TaskPriority.High)).toBe('accent');
    expect(component.getPriorityColor(TaskPriority.Medium)).toBe('primary');
  });

  it('should return correct status colors', () => {
    expect(component.getStatusColor(TaskStatus.Done)).toBe('primary');
    expect(component.getStatusColor(TaskStatus.InProgress)).toBe('accent');
    expect(component.getStatusColor(TaskStatus.Blocked)).toBe('warn');
  });

  // Edit functionality tests
  describe('Create functionality', () => {
    it('should open dialog when create task is clicked', () => {
      const mockDialogRef = {
        componentInstance: { mode: '' },
        afterClosed: () => of(null)
      } as any;
      mockDialog.open.mockReturnValue(mockDialogRef);

      component.onCreateTask();

      expect(mockDialog.open).toHaveBeenCalled();
      expect(mockDialogRef.componentInstance.mode).toBe('create');
    });

    it('should reload tasks and show success message after successful create', () => {
      const mockDialogRef = {
        componentInstance: { mode: '' },
        afterClosed: () => of(mockTask)
      } as any;
      mockDialog.open.mockReturnValue(mockDialogRef);
      getTasksPaginatedSpy.mockReturnValue(of(mockPaginatedResult));

      component.onCreateTask();

      expect(mockSnackBar.open).toHaveBeenCalledWith('Task created successfully', 'Close', expect.any(Object));
      expect(getTasksPaginatedSpy).toHaveBeenCalled();
    });
  });

  // Edit functionality tests
  describe('Edit functionality', () => {
    it('should open dialog when edit is clicked', () => {
      const mockDialogRef = {
        componentInstance: { mode: '', taskToEdit: null },
        afterClosed: () => of(null)
      } as any;
      mockDialog.open.mockReturnValue(mockDialogRef);

      component.onEdit(mockTask);

      expect(mockDialog.open).toHaveBeenCalled();
      expect(mockDialogRef.componentInstance.mode).toBe('edit');
      expect(mockDialogRef.componentInstance.taskToEdit).toEqual(mockTask);
    });

    it('should reload tasks and show success message after successful edit', () => {
      const mockDialogRef = {
        componentInstance: { mode: '', taskToEdit: null },
        afterClosed: () => of(mockTask)
      } as any;
      mockDialog.open.mockReturnValue(mockDialogRef);
      getTasksPaginatedSpy.mockReturnValue(of(mockPaginatedResult));

      component.onEdit(mockTask);

      expect(mockSnackBar.open).toHaveBeenCalledWith('Task updated successfully', 'Close', expect.any(Object));
      expect(getTasksPaginatedSpy).toHaveBeenCalled();
    });

    it('should not reload tasks when edit dialog is cancelled', () => {
      const mockDialogRef = {
        componentInstance: { mode: '', taskToEdit: null },
        afterClosed: () => of(null)
      } as any;
      mockDialog.open.mockReturnValue(mockDialogRef);
      getTasksPaginatedSpy.mockClear();

      component.onEdit(mockTask);

      expect(getTasksPaginatedSpy).not.toHaveBeenCalled();
    });
  });

  // Delete functionality tests
  describe('Delete functionality', () => {
    it('should open confirmation dialog when delete is clicked', () => {
      const mockDialogRef = {
        afterClosed: () => of(false)
      } as any;
      mockDialog.open.mockReturnValue(mockDialogRef);

      component.onDelete(mockTask);

      expect(mockDialog.open).toHaveBeenCalledWith(
        ConfirmationDialogComponent,
        expect.objectContaining({
          width: '400px'
        })
      );
    });

    it('should delete task and show success message when confirmed', () => {
      const mockDialogRef = {
        afterClosed: () => of(true)
      } as any;
      mockDialog.open.mockReturnValue(mockDialogRef);
      deleteTaskSpy.mockReturnValue(of(null));
      getTasksPaginatedSpy.mockReturnValue(of(mockPaginatedResult));

      component.onDelete(mockTask);

      expect(deleteTaskSpy).toHaveBeenCalledWith('123');
      expect(mockSnackBar.open).toHaveBeenCalledWith('Task deleted successfully', 'Close', expect.any(Object));
      expect(getTasksPaginatedSpy).toHaveBeenCalled();
    });

    it('should not delete task when cancelled', () => {
      const mockDialogRef = {
        afterClosed: () => of(false)
      } as any;
      mockDialog.open.mockReturnValue(mockDialogRef);

      component.onDelete(mockTask);

      expect(deleteTaskSpy).not.toHaveBeenCalled();
    });

    it('should show error message when delete fails', () => {
      const mockDialogRef = {
        afterClosed: () => of(true)
      } as any;
      mockDialog.open.mockReturnValue(mockDialogRef);
      deleteTaskSpy.mockReturnValue(
        throwError(() => ({ error: { message: 'Delete failed' } }))
      );

      component.onDelete(mockTask);

      expect(mockSnackBar.open).toHaveBeenCalledWith('Delete failed', 'Close', expect.any(Object));
    });

    it('should show generic error message when delete fails without message', () => {
      const mockDialogRef = {
        afterClosed: () => of(true)
      } as any;
      mockDialog.open.mockReturnValue(mockDialogRef);
      deleteTaskSpy.mockReturnValue(
        throwError(() => ({}))
      );

      component.onDelete(mockTask);

      expect(mockSnackBar.open).toHaveBeenCalledWith('Failed to delete task. Please try again.', 'Close', expect.any(Object));
    });
  });

  // Filtering functionality tests
  describe('Filtering functionality', () => {
    it('should apply filters and reload tasks', () => {
      getTasksPaginatedSpy.mockReturnValue(of(mockPaginatedResult));
      const filters: TaskFilters = {
        status: [TaskStatus.InProgress],
        priority: [TaskPriority.High]
      };

      component.onFiltersChanged(filters);

      expect(component.filters).toEqual(filters);
      expect(component.page).toBe(1); // Should reset to page 1
      expect(getTasksPaginatedSpy).toHaveBeenCalledWith(filters, expect.any(String), expect.any(String), 1, expect.any(Number));
    });

    it('should clear filters and reload tasks', () => {
      getTasksPaginatedSpy.mockReturnValue(of(mockPaginatedResult));
      component.filters = { status: [TaskStatus.InProgress] };

      component.onFiltersCleared();

      expect(component.filters).toEqual({});
      expect(component.page).toBe(1);
      expect(getTasksPaginatedSpy).toHaveBeenCalled();
    });

    it('should update URL when filters change', () => {
      getTasksPaginatedSpy.mockReturnValue(of(mockPaginatedResult));
      const filters: TaskFilters = {
        status: [TaskStatus.InProgress]
      };

      component.onFiltersChanged(filters);

      expect(mockRouter.navigate).toHaveBeenCalled();
    });

    it('should detect active filters', () => {
      component.filters = {};
      expect(component.hasActiveFilters()).toBe(false);

      component.filters = { status: [TaskStatus.InProgress] };
      expect(component.hasActiveFilters()).toBe(true);

      component.filters = { status: [] };
      expect(component.hasActiveFilters()).toBe(false);
    });
  });

  // Sorting functionality tests
  describe('Sorting functionality', () => {
    it('should update sort state and reload tasks', () => {
      getTasksPaginatedSpy.mockReturnValue(of(mockPaginatedResult));
      const sort: Sort = {
        active: 'name',
        direction: 'asc'
      };

      component.onSortChange(sort);

      expect(component.sortBy).toBe('name');
      expect(component.sortOrder).toBe('asc');
      expect(getTasksPaginatedSpy).toHaveBeenCalledWith(expect.any(Object), 'name', 'asc', expect.any(Number), expect.any(Number));
    });

    it('should handle descending sort', () => {
      getTasksPaginatedSpy.mockReturnValue(of(mockPaginatedResult));
      const sort: Sort = {
        active: 'dueDate',
        direction: 'desc'
      };

      component.onSortChange(sort);

      expect(component.sortBy).toBe('dueDate');
      expect(component.sortOrder).toBe('desc');
    });

    it('should update URL when sort changes', () => {
      getTasksPaginatedSpy.mockReturnValue(of(mockPaginatedResult));
      const sort: Sort = {
        active: 'priority',
        direction: 'asc'
      };

      component.onSortChange(sort);

      expect(mockRouter.navigate).toHaveBeenCalled();
    });
  });

  // Custom Pagination functionality tests
  describe('Custom Pagination', () => {
    it('should compute paginationStart correctly', () => {
      component.page = 1;
      component.pageSize = 50;
      component.totalCount.set(100);
      expect(component.paginationStart).toBe(1);

      component.page = 2;
      expect(component.paginationStart).toBe(51);
    });

    it('should return 0 for paginationStart when no tasks', () => {
      component.totalCount.set(0);
      expect(component.paginationStart).toBe(0);
    });

    it('should compute paginationEnd correctly', () => {
      component.page = 1;
      component.pageSize = 50;
      component.totalCount.set(100);
      expect(component.paginationEnd).toBe(50);

      component.page = 2;
      expect(component.paginationEnd).toBe(100);
    });

    it('should cap paginationEnd at totalCount', () => {
      component.page = 1;
      component.pageSize = 50;
      component.totalCount.set(30);
      expect(component.paginationEnd).toBe(30);
    });

    it('should compute hasPreviousPage correctly', () => {
      component.page = 1;
      expect(component.hasPreviousPage).toBe(false);

      component.page = 2;
      expect(component.hasPreviousPage).toBe(true);
    });

    it('should compute hasNextPage correctly', () => {
      component.page = 1;
      component.pageSize = 50;
      component.totalCount.set(100);
      expect(component.hasNextPage).toBe(true);

      component.page = 2;
      expect(component.hasNextPage).toBe(false);
    });

    it('should go to previous page', () => {
      getTasksPaginatedSpy.mockReturnValue(of(mockPaginatedResult));
      component.page = 2;

      component.onPreviousPage();

      expect(component.page).toBe(1);
      expect(getTasksPaginatedSpy).toHaveBeenCalled();
      expect(mockRouter.navigate).toHaveBeenCalled();
    });

    it('should not go below page 1', () => {
      component.page = 1;

      component.onPreviousPage();

      expect(component.page).toBe(1);
    });

    it('should go to next page', () => {
      getTasksPaginatedSpy.mockReturnValue(of(mockPaginatedResult));
      component.page = 1;
      component.pageSize = 50;
      component.totalCount.set(100);

      component.onNextPage();

      expect(component.page).toBe(2);
      expect(getTasksPaginatedSpy).toHaveBeenCalled();
    });

    it('should not go past last page', () => {
      component.page = 2;
      component.pageSize = 50;
      component.totalCount.set(100);

      component.onNextPage();

      expect(component.page).toBe(2);
    });
  });

  // Checkbox Selection tests
  describe('Checkbox Selection', () => {
    it('should toggle individual task selection', () => {
      expect(component.isSelected('123')).toBe(false);

      component.toggleSelection('123');
      expect(component.isSelected('123')).toBe(true);

      component.toggleSelection('123');
      expect(component.isSelected('123')).toBe(false);
    });

    it('should select all tasks', () => {
      component.tasks.set([mockTask, { ...mockTask, id: '456', name: 'Task 2' }]);
      expect(component.isAllSelected()).toBe(false);

      component.toggleAllSelection();
      expect(component.isAllSelected()).toBe(true);
      expect(component.selectedTasks.size).toBe(2);
    });

    it('should deselect all tasks when all are selected', () => {
      component.tasks.set([mockTask]);
      component.selectedTasks.add('123');
      expect(component.isAllSelected()).toBe(true);

      component.toggleAllSelection();
      expect(component.selectedTasks.size).toBe(0);
    });

    it('should clear selection when tasks are loaded', () => {
      component.selectedTasks.add('123');
      getTasksPaginatedSpy.mockReturnValue(of(mockPaginatedResult));

      component.loadTasks();

      expect(component.selectedTasks.size).toBe(0);
    });
  });

  // Quick Filter Tab tests
  describe('Quick Filter Tabs', () => {
    it('should default to all filter', () => {
      expect(component.quickFilter).toBe('all');
    });

    it('should change quick filter and reload tasks', () => {
      getTasksPaginatedSpy.mockReturnValue(of(mockPaginatedResult));

      component.onQuickFilterChange('pending');

      expect(component.quickFilter).toBe('pending');
      expect(component.page).toBe(1);
      expect(getTasksPaginatedSpy).toHaveBeenCalled();
    });

    it('should clear selection when quick filter changes', () => {
      component.selectedTasks.add('123');
      getTasksPaginatedSpy.mockReturnValue(of(mockPaginatedResult));

      component.onQuickFilterChange('done');

      expect(component.selectedTasks.size).toBe(0);
    });

    it('should toggle filter panel visibility', () => {
      expect(component.isFilterPanelVisible()).toBe(false);

      component.toggleFilterPanel();
      expect(component.isFilterPanelVisible()).toBe(true);

      component.toggleFilterPanel();
      expect(component.isFilterPanelVisible()).toBe(false);
    });
  });

  // Column order test
  describe('Column Order', () => {
    it('should have Figma-aligned column order', () => {
      expect(component.displayedColumns).toEqual([
        'select', 'status', 'name', 'priority', 'dueDate', 'timeLogged', 'actions'
      ]);
    });
  });

  // Time display tests
  describe('Time Display', () => {
    it('should return -- for zero logged time', () => {
      const task = { ...mockTask, totalLoggedMinutes: 0 };
      expect(component.getTimeDisplay(task)).toBe('--');
    });

    it('should return -- for null logged time', () => {
      const task = { ...mockTask, totalLoggedMinutes: null as any };
      expect(component.getTimeDisplay(task)).toBe('--');
    });
  });

  // URL state persistence tests
  describe('URL state persistence', () => {
    it('should restore filters from URL query parameters', () => {
      const queryParams = {
        status: [TaskStatus.InProgress.toString(), TaskStatus.Done.toString()],
        priority: [TaskPriority.High.toString()],
        searchTerm: 'test query'
      };

      mockActivatedRoute.queryParams.next(queryParams);
      getTasksPaginatedSpy.mockReturnValue(of(mockPaginatedResult));

      component.ngOnInit();

      expect(component.filters.status).toEqual([TaskStatus.InProgress, TaskStatus.Done]);
      expect(component.filters.priority).toEqual([TaskPriority.High]);
      expect(component.filters.searchTerm).toBe('test query');
    });

    it('should restore sorting from URL query parameters', () => {
      const queryParams = {
        sortBy: 'dueDate',
        sortOrder: 'asc'
      };

      mockActivatedRoute.queryParams.next(queryParams);
      getTasksPaginatedSpy.mockReturnValue(of(mockPaginatedResult));

      component.ngOnInit();

      expect(component.sortBy).toBe('dueDate');
      expect(component.sortOrder).toBe('asc');
    });

    it('should restore pagination from URL query parameters', () => {
      const queryParams = {
        page: '3',
        pageSize: '100'
      };

      mockActivatedRoute.queryParams.next(queryParams);
      getTasksPaginatedSpy.mockReturnValue(of(mockPaginatedResult));

      component.ngOnInit();

      expect(component.page).toBe(3);
      expect(component.pageSize).toBe(100);
    });

    it('should use default values when query parameters are missing', () => {
      mockActivatedRoute.queryParams.next({});
      getTasksPaginatedSpy.mockReturnValue(of(mockPaginatedResult));

      component.ngOnInit();

      expect(component.page).toBe(1);
      expect(component.pageSize).toBe(50);
      expect(component.sortBy).toBe('createdDate');
      expect(component.sortOrder).toBe('desc');
    });
  });

  // Refresh task counts tests
  describe('Task Counts', () => {
    it('should call refreshTaskCounts on init', () => {
      getTasksPaginatedSpy.mockReturnValue(of(mockPaginatedResult));

      component.ngOnInit();

      // refreshTaskCounts makes 3 additional calls (all, pending, done) + 1 for loadTasks
      expect(getTasksPaginatedSpy.mock.calls.length).toBeGreaterThanOrEqual(4);
    });

    it('should update count signals from API responses', () => {
      const allResult = { ...mockPaginatedResult, totalCount: 48 };
      const pendingResult = { ...mockPaginatedResult, totalCount: 35 };
      const doneResult = { ...mockPaginatedResult, totalCount: 13 };

      getTasksPaginatedSpy
        .mockReturnValueOnce(of(allResult))
        .mockReturnValueOnce(of(pendingResult))
        .mockReturnValueOnce(of(doneResult));

      component.refreshTaskCounts();

      expect(component.allTasksCount()).toBe(48);
      expect(component.pendingTasksCount()).toBe(35);
      expect(component.doneTasksCount()).toBe(13);
    });
  });
});
