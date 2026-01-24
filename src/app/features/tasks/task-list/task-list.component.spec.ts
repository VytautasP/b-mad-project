import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { TaskListComponent } from './task-list.component';
import { TaskService } from '../services/task.service';
import { Task, TaskPriority, TaskStatus, TaskType } from '../../../shared/models/task.model';

describe('TaskListComponent', () => {
  let component: TaskListComponent;
  let fixture: ComponentFixture<TaskListComponent>;
  let taskService: Partial<TaskService>;
  let tasksSubject: BehaviorSubject<Task[]>;
  let getTasksSpy: any;

  const mockTask: Task = {
    id: '123',
    name: 'Test Task',
    description: 'Test Description',
    parentTaskId: null,
    createdByUserId: 'user123',
    createdDate: new Date('2024-01-01'),
    modifiedDate: new Date('2024-01-01'),
    dueDate: new Date('2024-12-31'),
    priority: TaskPriority.Medium,
    status: TaskStatus.ToDo,
    progress: 0,
    type: TaskType.Task,
    isDeleted: false
  };

  beforeEach(async () => {
    tasksSubject = new BehaviorSubject<Task[]>([]);
    getTasksSpy = vi.fn();
    
    taskService = {
      tasks$: tasksSubject.asObservable(),
      getTasks: getTasksSpy
    };

    await TestBed.configureTestingModule({
      imports: [
        TaskListComponent,
        NoopAnimationsModule
      ],
      providers: [
        { provide: TaskService, useValue: taskService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TaskListComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display loading spinner initially', () => {
    getTasksSpy.mockReturnValue(of([]));
    expect(component.isLoading).toBeTruthy();
  });

  it('should load tasks on init', () => {
    getTasksSpy.mockReturnValue(of([mockTask]));
    
    component.ngOnInit();
    
    expect(getTasksSpy).toHaveBeenCalled();
  });

  it('should display tasks when loaded', async () => {
    const mockTasks = [mockTask];
    getTasksSpy.mockReturnValue(of(mockTasks));
    tasksSubject.next(mockTasks);

    component.ngOnInit();

    const tasks = await new Promise<Task[]>(resolve => {
      component.tasks$.subscribe(tasks => resolve(tasks));
    });

    expect(tasks.length).toBe(1);
    expect(tasks[0].name).toBe('Test Task');
  });

  it('should show empty state when no tasks', async () => {
    getTasksSpy.mockReturnValue(of([]));
    tasksSubject.next([]);

    component.ngOnInit();

    const tasks = await new Promise<Task[]>(resolve => {
      component.tasks$.subscribe(tasks => resolve(tasks));
    });

    expect(tasks.length).toBe(0);
  });

  it('should sort tasks by created date descending', async () => {
    const task1 = { ...mockTask, id: '1', createdDate: new Date('2024-01-01') };
    const task2 = { ...mockTask, id: '2', createdDate: new Date('2024-01-03') };
    const task3 = { ...mockTask, id: '3', createdDate: new Date('2024-01-02') };
    
    getTasksSpy.mockReturnValue(of([task1, task2, task3]));
    tasksSubject.next([task1, task2, task3]);

    component.ngOnInit();

    const tasks = await new Promise<Task[]>(resolve => {
      component.tasks$.subscribe(tasks => resolve(tasks));
    });

    expect(tasks[0].id).toBe('2'); // Newest first
    expect(tasks[1].id).toBe('3');
    expect(tasks[2].id).toBe('1');
  });

  it('should handle error when loading tasks', () => {
    getTasksSpy.mockReturnValue(
      throwError(() => new Error('Failed to load tasks'))
    );

    component.loadTasks();

    expect(component.isLoading).toBeFalsy();
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
});
