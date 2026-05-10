// @ts-nocheck
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDialogRef } from '@angular/material/dialog';
import { Observable, Subject, of, throwError } from 'rxjs';
import { TaskFormComponent } from './task-form.component';
import { TaskService } from '../services/task.service';
import { Task, TaskPriority, TaskStatus, TaskType } from '../../../shared/models/task.model';

describe('TaskFormComponent', () => {
  let component: TaskFormComponent;
  let fixture: ComponentFixture<TaskFormComponent>;
  let createTaskSpy: any;
  let updateTaskSpy: any;
  let backdropClick$: Subject<void>;
  let keydownEvents$: Subject<KeyboardEvent>;
  let mockDialogRef: {
    close: any;
    disableClose: boolean;
    backdropClick: () => Subject<void>;
    keydownEvents: () => Subject<KeyboardEvent>;
  };

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

  beforeEach(async () => {
    createTaskSpy = vi.fn();
    updateTaskSpy = vi.fn();
    backdropClick$ = new Subject<void>();
    keydownEvents$ = new Subject<KeyboardEvent>();
    mockDialogRef = {
      close: vi.fn(),
      disableClose: false,
      backdropClick: () => backdropClick$,
      keydownEvents: () => keydownEvents$
    };

    await TestBed.configureTestingModule({
      imports: [TaskFormComponent, NoopAnimationsModule, MatNativeDateModule],
      providers: [
        {
          provide: TaskService,
          useValue: {
            createTask: createTaskSpy,
            updateTask: updateTaskSpy
          }
        },
        { provide: MatDialogRef, useValue: mockDialogRef }
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
    expect(component.taskForm.get('name')?.value).toBe('');
    expect(component.taskForm.get('priority')?.value).toBe(TaskPriority.Medium);
    expect(component.taskForm.get('status')?.value).toBe(TaskStatus.ToDo);
    expect(component.taskForm.get('type')?.value).toBe(TaskType.Task);
  });

  it('should render the dialog shell structure', () => {
    expect(fixture.nativeElement.querySelector('.task-form__header')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.task-form__body')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.task-form__footer')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.task-form__close')?.getAttribute('aria-label')).toBe('Close task dialog');
    expect(fixture.nativeElement.querySelector('ui-text-input')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('ui-textarea')).toBeTruthy();
    expect(fixture.nativeElement.querySelectorAll('ui-select').length).toBe(2);
    expect(fixture.nativeElement.querySelector('ui-datepicker')).toBeTruthy();
  });

  it('should not submit if form is invalid', () => {
    component.taskForm.patchValue({ name: '' });

    component.onSubmit();

    expect(createTaskSpy).not.toHaveBeenCalled();
  });

  it('should call TaskService.createTask on valid submit', () => {
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
    expect(mockDialogRef.close).toHaveBeenCalledWith({ created: true });
  });

  it('should preserve entered values and show inline error on create failure', () => {
    createTaskSpy.mockReturnValue(
      throwError(() => ({ error: { message: 'Creation failed' } }))
    );

    component.taskForm.patchValue({
      name: 'Test Task',
      description: 'Keep this value',
      priority: TaskPriority.Medium,
      status: TaskStatus.ToDo,
      type: TaskType.Task
    });

    component.onSubmit();
    fixture.detectChanges();

    expect(component.errorMessage).toBe('Creation failed');
    expect(component.taskForm.get('name')?.value).toBe('Test Task');
    expect(component.taskForm.get('description')?.value).toBe('Keep this value');
    expect(fixture.nativeElement.querySelector('.task-form__error')?.textContent).toContain('Creation failed');
  });

  it('should show loading state during submission without allowing dialog dismissal', () => {
    createTaskSpy.mockReturnValue(new Observable(() => {
      return undefined;
    }));

    component.taskForm.patchValue({
      name: 'Test Task',
      priority: TaskPriority.Medium,
      status: TaskStatus.ToDo,
      type: TaskType.Task
    });

    component.onSubmit();
    component.onCancel();
    component.onClose();
    component.onEscapeKey();

    expect(component.isSubmitting).toBe(true);
    expect(mockDialogRef.disableClose).toBe(true);
    expect(mockDialogRef.close).not.toHaveBeenCalled();
  });

  it('should dismiss from cancel, close button, backdrop, and Escape when not submitting', () => {
    component.onCancel();
    component.onClose();
    backdropClick$.next();
    keydownEvents$.next(new KeyboardEvent('keydown', { key: 'Escape' }));

    expect(mockDialogRef.close).toHaveBeenCalledTimes(4);
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

  describe('Edit mode', () => {
    beforeEach(() => {
      component.mode = 'edit';
      component.taskToEdit = mockTask;
      component.ngOnInit();
      fixture.detectChanges();
    });

    it('should pre-populate form fields in edit mode', () => {
      expect(component.taskForm.get('name')?.value).toBe('Test Task');
      expect(component.taskForm.get('description')?.value).toBe('Test Description');
      expect(component.taskForm.get('priority')?.value).toBe(TaskPriority.Medium);
      expect(component.taskForm.get('status')?.value).toBe(TaskStatus.ToDo);
      expect(component.taskForm.get('type')?.value).toBe(TaskType.Task);
    });

    it('should render edit title and update CTA', () => {
      expect(fixture.nativeElement.querySelector('.task-form__title')?.textContent).toContain('Edit Task');
      expect(fixture.nativeElement.querySelector('.task-form__submit')?.textContent).toContain('Update Task');
    });

    it('should call TaskService.updateTask on submit in edit mode', () => {
      const updatedTask = { ...mockTask, name: 'Updated Task' };
      updateTaskSpy.mockReturnValue(of(updatedTask));

      component.taskForm.patchValue({ name: 'Updated Task' });
      const emitSpy = vi.spyOn(component.taskUpdated, 'emit');

      component.onSubmit();

      expect(updateTaskSpy).toHaveBeenCalledWith('123', expect.objectContaining({
        name: 'Updated Task'
      }));
      expect(emitSpy).toHaveBeenCalledWith(updatedTask);
      expect(mockDialogRef.close).toHaveBeenCalledWith(updatedTask);
    });

    it('should keep values and error in-modal on update failure', () => {
      updateTaskSpy.mockReturnValue(
        throwError(() => ({ error: { message: 'Update failed' } }))
      );

      component.onSubmit();

      expect(component.errorMessage).toBe('Update failed');
      expect(component.taskForm.get('name')?.value).toBe('Test Task');
      expect(component.isSubmitting).toBe(false);
    });
  });
});