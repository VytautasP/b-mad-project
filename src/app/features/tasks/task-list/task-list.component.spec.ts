import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router, ActivatedRoute } from '@angular/router';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { TaskListComponent } from './task-list.component';
import { TaskService } from '../services/task.service';
import { Task, TaskPriority, TaskStatus, TaskType, TaskFilters, PaginatedResult } from '../../../shared/models/task.model';
import { ConfirmationDialogComponent } from '../../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { Sort } from '@angular/material/sort';
import { PageEvent } from '@angular/material/paginator';

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
        NoopAnimationsModule
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

  it('should format dates correctly', () => {
    const date = new Date('2024-12-31');
    const formatted = component.formatDate(date);
    expect(formatted).toContain('2024');
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
    expect(component.getStatusLabel(TaskStatus.ToDo)).toBe('ToDo');
    expect(component.getStatusLabel(TaskStatus.Done)).toBe('Done');
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

  // Pagination functionality tests
  describe('Pagination functionality', () => {
    it('should update page state and reload tasks', () => {
      getTasksPaginatedSpy.mockReturnValue(of(mockPaginatedResult));
      const pageEvent: PageEvent = {
        pageIndex: 1,
        pageSize: 50,
        length: 100
      };

      component.onPageChange(pageEvent);

      expect(component.page).toBe(2); // Convert from 0-based to 1-based
      expect(component.pageSize).toBe(50);
      expect(getTasksPaginatedSpy).toHaveBeenCalledWith(expect.any(Object), expect.any(String), expect.any(String), 2, 50);
    });

    it('should handle page size change', () => {
      getTasksPaginatedSpy.mockReturnValue(of(mockPaginatedResult));
      const pageEvent: PageEvent = {
        pageIndex: 0,
        pageSize: 100,
        length: 100
      };

      component.onPageChange(pageEvent);

      expect(component.pageSize).toBe(100);
    });

    it('should update URL when pagination changes', () => {
      getTasksPaginatedSpy.mockReturnValue(of(mockPaginatedResult));
      const pageEvent: PageEvent = {
        pageIndex: 2,
        pageSize: 100,
        length: 300
      };

      component.onPageChange(pageEvent);

      expect(mockRouter.navigate).toHaveBeenCalled();
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
});
