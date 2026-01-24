import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Observable, of, throwError } from 'rxjs';
import { TaskFormComponent } from './task-form.component';
import { TaskService } from '../services/task.service';
import { TaskPriority, TaskStatus, TaskType } from '../../../shared/models/task.model';

describe('TaskFormComponent', () => {
  let component: TaskFormComponent;
  let fixture: ComponentFixture<TaskFormComponent>;
  let taskService: Partial<TaskService>;
  let createTaskSpy: any;

  beforeEach(async () => {
    createTaskSpy = vi.fn();
    taskService = {
      createTask: createTaskSpy
    };

    await TestBed.configureTestingModule({
      imports: [
        TaskFormComponent,
        ReactiveFormsModule,
        NoopAnimationsModule
      ],
      providers: [
        { provide: TaskService, useValue: taskService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TaskFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form with default values', () => {
    expect(component.taskForm).toBeTruthy();
    expect(component.taskForm.get('name')?.value).toBe('');
    expect(component.taskForm.get('priority')?.value).toBe(TaskPriority.Medium);
    expect(component.taskForm.get('status')?.value).toBe(TaskStatus.ToDo);
    expect(component.taskForm.get('type')?.value).toBe(TaskType.Task);
  });

  it('should mark name as required', () => {
    const nameControl = component.taskForm.get('name');
    nameControl?.setValue('');
    expect(nameControl?.valid).toBeFalsy();
    expect(nameControl?.hasError('required')).toBeTruthy();
  });

  it('should be valid when name is provided', () => {
    component.taskForm.patchValue({
      name: 'Test Task',
      priority: TaskPriority.High,
      status: TaskStatus.ToDo,
      type: TaskType.Task
    });
    expect(component.taskForm.valid).toBeTruthy();
  });

  it('should not submit if form is invalid', () => {
    component.taskForm.patchValue({ name: '' });
    component.onSubmit();
    expect(createTaskSpy).not.toHaveBeenCalled();
  });

  it('should call TaskService.createTask on valid submit', () => {
    const mockTask = {
      id: '123',
      name: 'Test Task',
      description: null,
      parentTaskId: null,
      createdByUserId: 'user123',
      createdDate: new Date(),
      modifiedDate: new Date(),
      dueDate: null,
      priority: TaskPriority.High,
      status: TaskStatus.ToDo,
      progress: 0,
      type: TaskType.Task,
      isDeleted: false
    };

    createTaskSpy.mockReturnValue(of(mockTask));

    component.taskForm.patchValue({
      name: 'Test Task',
      description: 'Test Description',
      priority: TaskPriority.High,
      status: TaskStatus.ToDo,
      type: TaskType.Task
    });

    const emitSpy = vi.spyOn(component.taskCreated, 'emit');
    component.onSubmit();

    expect(createTaskSpy).toHaveBeenCalledWith(expect.objectContaining({
      name: 'Test Task',
      description: 'Test Description',
      priority: TaskPriority.High,
      status: TaskStatus.ToDo,
      type: TaskType.Task
    }));
    expect(emitSpy).toHaveBeenCalled();
  });

  it('should reset form after successful submit', async () => {
    const mockTask = {
      id: '123',
      name: 'Test Task',
      description: null,
      parentTaskId: null,
      createdByUserId: 'user123',
      createdDate: new Date(),
      modifiedDate: new Date(),
      dueDate: null,
      priority: TaskPriority.High,
      status: TaskStatus.ToDo,
      progress: 0,
      type: TaskType.Task,
      isDeleted: false
    };

    createTaskSpy.mockReturnValue(of(mockTask));

    component.taskForm.patchValue({
      name: 'Test Task',
      priority: TaskPriority.High,
      status: TaskStatus.ToDo,
      type: TaskType.Task
    });

    component.onSubmit();

    await new Promise(resolve => setTimeout(resolve, 100));

    expect(component.taskForm.get('name')?.value).toBeNull();
    expect(component.taskForm.get('priority')?.value).toBe(TaskPriority.Medium);
  });

  it('should display error message on submit failure', async () => {
    createTaskSpy.mockReturnValue(
      throwError(() => ({ error: { message: 'Creation failed' } }))
    );

    component.taskForm.patchValue({
      name: 'Test Task',
      priority: TaskPriority.Medium,
      status: TaskStatus.ToDo,
      type: TaskType.Task
    });

    component.onSubmit();

    await new Promise(resolve => setTimeout(resolve, 100));

    expect(component.errorMessage).toBe('Creation failed');
    expect(component.isSubmitting).toBeFalsy();
  });

  it('should show loading state during submission', () => {
    let subscribed = false;
    createTaskSpy.mockReturnValue(new Observable(observer => {
      subscribed = true;
      setTimeout(() => {
        observer.next({} as any);
        observer.complete();
      }, 100);
    }));

    component.taskForm.patchValue({
      name: 'Test Task',
      priority: TaskPriority.Medium,
      status: TaskStatus.ToDo,
      type: TaskType.Task
    });

    expect(component.isSubmitting).toBeFalsy();
    component.onSubmit();
    
    // Check that submission is in progress
    expect(subscribed).toBeTruthy();
    expect(component.isSubmitting).toBeTruthy();
  });

  it('should return correct error messages', () => {
    const nameControl = component.taskForm.get('name');
    nameControl?.setValue('');
    nameControl?.markAsTouched();
    
    expect(component.getErrorMessage('name')).toContain('required');
  });

  it('should convert enum values to labels', () => {
    expect(component.getPriorityLabel(TaskPriority.High)).toBe('High');
    expect(component.getStatusLabel(TaskStatus.InProgress)).toBe('InProgress');
    expect(component.getTypeLabel(TaskType.Task)).toBe('Task');
  });
});
