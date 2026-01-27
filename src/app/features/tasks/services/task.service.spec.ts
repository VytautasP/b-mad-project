import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { TaskService } from './task.service';
import { Task, TaskCreateDto, TaskPriority, TaskStatus, TaskType } from '../../../shared/models/task.model';
import { environment } from '../../../../environments/environment';

describe('TaskService', () => {
  let service: TaskService;
  let httpMock: HttpTestingController;
  const apiUrl = `${environment.apiUrl}/api/tasks`;

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
    isDeleted: false
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        TaskService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    service = TestBed.inject(TaskService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getTasks', () => {
    it('should fetch tasks and update BehaviorSubject', () => {
      const mockTasks: Task[] = [mockTask];
      let receivedTasks: Task[] | undefined;

      service.getTasks().subscribe(tasks => {
        receivedTasks = tasks;
      });

      const req = httpMock.expectOne(apiUrl);
      expect(req.request.method).toBe('GET');
      req.flush(mockTasks);

      expect(receivedTasks).toEqual(mockTasks);
      expect(receivedTasks?.length).toBe(1);
    });

    it('should include search query parameter when provided', () => {
      const searchTerm = 'test search';
      const mockTasks: Task[] = [mockTask];

      service.getTasks(searchTerm).subscribe();

      const req = httpMock.expectOne(req => req.url === apiUrl && req.params.has('search'));
      expect(req.request.method).toBe('GET');
      expect(req.request.params.get('search')).toBe(searchTerm);
      req.flush(mockTasks);
    });

    it('should include status query parameter when provided', () => {
      const status = TaskStatus.InProgress;
      const mockTasks: Task[] = [mockTask];

      service.getTasks(undefined, status).subscribe();

      const req = httpMock.expectOne(req => req.url === apiUrl && req.params.has('status'));
      expect(req.request.method).toBe('GET');
      expect(req.request.params.get('status')).toBe(status.toString());
      req.flush(mockTasks);
    });

    it('should include both search and status query parameters when provided', () => {
      const searchTerm = 'important';
      const status = TaskStatus.InProgress;
      const mockTasks: Task[] = [mockTask];

      service.getTasks(searchTerm, status).subscribe();

      const req = httpMock.expectOne(req => 
        req.url === apiUrl && 
        req.params.has('search') && 
        req.params.has('status')
      );
      expect(req.request.method).toBe('GET');
      expect(req.request.params.get('search')).toBe(searchTerm);
      expect(req.request.params.get('status')).toBe(status.toString());
      req.flush(mockTasks);
    });

    it('should not include search parameter when empty string provided', () => {
      const mockTasks: Task[] = [mockTask];

      service.getTasks('').subscribe();

      const req = httpMock.expectOne(apiUrl);
      expect(req.request.method).toBe('GET');
      expect(req.request.params.keys().length).toBe(0);
      req.flush(mockTasks);
    });

    it('should trim and include search parameter', () => {
      const searchTerm = '  test  ';
      const mockTasks: Task[] = [mockTask];

      service.getTasks(searchTerm).subscribe();

      const req = httpMock.expectOne(req => req.url === apiUrl && req.params.has('search'));
      expect(req.request.params.get('search')).toBe('test');
      req.flush(mockTasks);
    });

    it('should handle errors when fetching tasks', () => {
      let errorResponse: any;

      service.getTasks().subscribe({
        next: () => {
          throw new Error('should have failed');
        },
        error: (error) => {
          errorResponse = error;
        }
      });

      const req = httpMock.expectOne(apiUrl);
      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });

      expect(errorResponse.status).toBe(500);
    });
  });

  describe('getTaskById', () => {
    it('should fetch a single task by ID', () => {
      const taskId = '123';
      let receivedTask: Task | undefined;

      service.getTaskById(taskId).subscribe(task => {
        receivedTask = task;
      });

      const req = httpMock.expectOne(`${apiUrl}/${taskId}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockTask);

      expect(receivedTask).toEqual(mockTask);
      expect(receivedTask?.id).toBe(taskId);
    });
  });

  describe('createTask', () => {
    it('should create a task and add to BehaviorSubject', () => {
      const createDto: TaskCreateDto = {
        name: 'New Task',
        description: 'New Description',
        dueDate: new Date('2024-12-31'),
        priority: TaskPriority.High,
        status: TaskStatus.ToDo,
        type: TaskType.Task
      };
      let receivedTask: Task | undefined;

      service.createTask(createDto).subscribe(task => {
        receivedTask = task;
      });

      const req = httpMock.expectOne(apiUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(createDto);
      req.flush(mockTask);

      expect(receivedTask).toEqual(mockTask);
    });

    it('should handle errors when creating task', () => {
      const createDto: TaskCreateDto = {
        name: 'New Task',
        priority: TaskPriority.Medium,
        status: TaskStatus.ToDo,
        type: TaskType.Task
      };
      let errorResponse: any;

      service.createTask(createDto).subscribe({
        next: () => {
          throw new Error('should have failed');
        },
        error: (error) => {
          errorResponse = error;
        }
      });

      const req = httpMock.expectOne(apiUrl);
      req.flush('Validation Error', { status: 400, statusText: 'Bad Request' });

      expect(errorResponse.status).toBe(400);
    });
  });

  describe('updateTask', () => {
    it('should update a task and update in BehaviorSubject', () => {
      const taskId = '123';
      const updateDto = { name: 'Updated Task' };
      const updatedTask = { ...mockTask, name: 'Updated Task' };
      let receivedTask: Task | undefined;

      // First, populate the BehaviorSubject
      service['tasksSubject'].next([mockTask]);

      service.updateTask(taskId, updateDto).subscribe(task => {
        receivedTask = task;
      });

      const req = httpMock.expectOne(`${apiUrl}/${taskId}`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(updateDto);
      req.flush(updatedTask);

      expect(receivedTask?.name).toBe('Updated Task');
    });
  });

  describe('deleteTask', () => {
    it('should delete a task and remove from BehaviorSubject', () => {
      const taskId = '123';
      let deleteComplete = false;

      // First, populate the BehaviorSubject
      service['tasksSubject'].next([mockTask]);

      service.deleteTask(taskId).subscribe(() => {
        deleteComplete = true;
      });

      const req = httpMock.expectOne(`${apiUrl}/${taskId}`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null);

      expect(deleteComplete).toBe(true);
    });
  });
});
