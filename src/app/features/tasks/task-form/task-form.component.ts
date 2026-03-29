import { AfterViewInit, Component, DestroyRef, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { filter } from 'rxjs/operators';
import { TaskService } from '../services/task.service';
import { Task, TaskCreateDto, TaskUpdateDto, TaskPriority, TaskStatus, TaskType } from '../../../shared/models/task.model';
import { TaskFormDialogData, TaskFormInitialFocusField, TaskFormMode } from '../../../shared/utils/task-form-dialog.utils';

@Component({
  selector: 'app-task-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './task-form.component.html',
  styleUrl: './task-form.component.scss'
})
export class TaskFormComponent implements OnInit, AfterViewInit {
  private readonly fb = inject(FormBuilder);
  private readonly taskService = inject(TaskService);
  private readonly dialogRef = inject(MatDialogRef<TaskFormComponent>, { optional: true });
  private readonly dialogData = inject<TaskFormDialogData | null>(MAT_DIALOG_DATA, { optional: true });
  private readonly destroyRef = inject(DestroyRef);

  @Input() mode: TaskFormMode = this.dialogData?.mode ?? 'create';
  @Input() taskToEdit: Task | null = this.dialogData?.task ?? null;
  @Input() initialFocusField: TaskFormInitialFocusField = this.dialogData?.initialFocusField ?? null;
  @Input() embedded = this.dialogData?.embedded ?? false;

  @ViewChild('taskNameInput') taskNameInput?: ElementRef<HTMLInputElement>;
  @ViewChild('dueDateInput') dueDateInput?: ElementRef<HTMLInputElement>;

  @Output() taskCreated = new EventEmitter<void>();
  @Output() taskUpdated = new EventEmitter<Task>();
  @Output() cancelled = new EventEmitter<void>();

  readonly dialogTitleId = 'task-form-dialog-title';
  taskForm: FormGroup;
  isSubmitting = false;
  errorMessage: string | null = null;
  private dismissHandlersBound = false;

  // Expose enums to template
  priorities = Object.values(TaskPriority).filter(v => typeof v === 'number') as number[];
  statuses = Object.values(TaskStatus).filter(v => typeof v === 'number') as number[];
  types = Object.values(TaskType).filter(v => typeof v === 'number') as number[];

  TaskPriority = TaskPriority;
  TaskStatus = TaskStatus;
  TaskType = TaskType;

  constructor() {
    this.taskForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(200)]],
      description: [''],
      dueDate: [null],
      priority: [TaskPriority.Medium, Validators.required],
      status: [TaskStatus.ToDo, Validators.required],
      type: [TaskType.Task, Validators.required]
    });
  }

  ngOnInit(): void {
    this.applyDialogDismissState();

    if (this.mode === 'edit' && this.taskToEdit) {
      this.populateEditForm();
    }

    if (this.dismissHandlersBound) {
      return;
    }

    this.dismissHandlersBound = true;

    this.dialogRef?.backdropClick()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.onDismissRequested();
      });

    this.dialogRef?.keydownEvents()
      .pipe(
        filter((event): event is KeyboardEvent => event.key === 'Escape'),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(event => {
        event.preventDefault();
        this.onDismissRequested();
      });
  }

  private populateEditForm(): void {
    if (this.mode === 'edit' && this.taskToEdit) {
      this.taskForm.patchValue({
        name: this.taskToEdit.name,
        description: this.taskToEdit.description,
        dueDate: this.taskToEdit.dueDate ? new Date(this.taskToEdit.dueDate) : null,
        priority: this.taskToEdit.priority,
        status: this.taskToEdit.status,
        type: this.taskToEdit.type
      });
    }
  }

  ngAfterViewInit(): void {
    const focusTarget = this.initialFocusField === 'dueDate'
      ? this.dueDateInput?.nativeElement
      : this.taskNameInput?.nativeElement;

    setTimeout(() => {
      focusTarget?.focus();
    }, 0);
  }

  get isDialogMode(): boolean {
    return Boolean(this.dialogRef) && !this.embedded;
  }

  get dialogTitle(): string {
    return this.mode === 'edit' ? 'Edit Task' : 'Create New Task';
  }

  get submitLabel(): string {
    return this.mode === 'edit' ? 'Update Task' : 'Create Task';
  }

  get submittingLabel(): string {
    return this.mode === 'edit' ? 'Updating...' : 'Creating...';
  }

  onEscapeKey(): void {
    this.onDismissRequested();
  }

  onClose(): void {
    this.onDismissRequested();
  }

  private applyDialogDismissState(): void {
    if (this.dialogRef) {
      this.dialogRef.disableClose = this.isSubmitting;
    }
  }

  private onDismissRequested(): void {
    if (this.isSubmitting) {
      return;
    }

    if (this.dialogRef) {
      this.dialogRef.close();
      return;
    }

    this.cancelled.emit();
  }

  onCancel(): void {
    this.onDismissRequested();
  }

  onSubmit(): void {
    if (this.taskForm.invalid) {
      this.taskForm.markAllAsTouched();
      this.taskNameInput?.nativeElement.focus();
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = null;
    this.applyDialogDismissState();

    if (this.mode === 'edit' && this.taskToEdit) {
      const dto: TaskUpdateDto = {
        name: this.taskForm.value.name,
        description: this.taskForm.value.description || null,
        dueDate: this.taskForm.value.dueDate || null,
        priority: this.taskForm.value.priority,
        status: this.taskForm.value.status,
        type: this.taskForm.value.type
      };

      this.taskService.updateTask(this.taskToEdit.id, dto).subscribe({
        next: (updatedTask) => {
          this.isSubmitting = false;
          this.applyDialogDismissState();
          this.taskUpdated.emit(updatedTask);
          if (this.dialogRef) {
            this.dialogRef.close(updatedTask);
          }
        },
        error: (error) => {
          this.errorMessage = error.error?.message || 'Failed to update task. Please try again.';
          this.isSubmitting = false;
          this.applyDialogDismissState();
        }
      });
    } else {
      const dto: TaskCreateDto = {
        name: this.taskForm.value.name,
        description: this.taskForm.value.description || null,
        dueDate: this.taskForm.value.dueDate || null,
        priority: this.taskForm.value.priority,
        status: this.taskForm.value.status,
        type: this.taskForm.value.type
      };

      this.taskService.createTask(dto).subscribe({
        next: () => {
          this.taskForm.reset({
            priority: TaskPriority.Medium,
            status: TaskStatus.ToDo,
            type: TaskType.Task
          });
          this.isSubmitting = false;
          this.applyDialogDismissState();
          this.taskCreated.emit();
          if (this.dialogRef) {
            this.dialogRef.close({ created: true });
          }
        },
        error: (error) => {
          this.errorMessage = error.error?.message || 'Failed to create task. Please try again.';
          this.isSubmitting = false;
          this.applyDialogDismissState();
        }
      });
    }
  }

  getErrorMessage(fieldName: string): string {
    const control = this.taskForm.get(fieldName);
    if (control?.hasError('required')) {
      return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} is required`;
    }
    if (control?.hasError('maxlength')) {
      return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} is too long`;
    }
    return '';
  }

  getPriorityLabel(priority: number): string {
    return TaskPriority[priority];
  }

  getStatusLabel(status: number): string {
    return TaskStatus[status];
  }

  getTypeLabel(type: number): string {
    return TaskType[type];
  }

  getTypeIcon(type: number): string {
    switch (type) {
      case TaskType.Project: return 'folder';
      case TaskType.Milestone: return 'flag_circle';
      case TaskType.Task: return 'task_alt';
      default: return 'task_alt';
    }
  }
}
