import { Component, inject, Output, EventEmitter, Input, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialogRef } from '@angular/material/dialog';
import { TaskService } from '../services/task.service';
import { Task, TaskCreateDto, TaskUpdateDto, TaskPriority, TaskStatus, TaskType } from '../../../shared/models/task.model';

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
    MatProgressSpinnerModule
  ],
  templateUrl: './task-form.component.html',
  styleUrl: './task-form.component.scss'
})
export class TaskFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly taskService = inject(TaskService);
  private readonly dialogRef = inject(MatDialogRef<TaskFormComponent>, { optional: true });
  
  @Input() mode: 'create' | 'edit' = 'create';
  @Input() taskToEdit: Task | null = null;
  
  @Output() taskCreated = new EventEmitter<void>();
  @Output() taskUpdated = new EventEmitter<Task>();
  
  taskForm: FormGroup;
  isSubmitting = false;
  errorMessage: string | null = null;
  
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

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    if (this.dialogRef) {
      this.dialogRef.close();
    }
  }

  onSubmit(): void {
    if (this.taskForm.invalid) {
      this.taskForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = null;

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
          setTimeout(() => {
            this.isSubmitting = false;
          });
          this.taskUpdated.emit(updatedTask);
          if (this.dialogRef) {
            this.dialogRef.close(updatedTask);
          }
        },
        error: (error) => {
          this.errorMessage = error.error?.message || 'Failed to update task. Please try again.';
          setTimeout(() => {
            this.isSubmitting = false;
          });
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
          setTimeout(() => {
            this.isSubmitting = false;
          });
          this.taskCreated.emit();
        },
        error: (error) => {
          this.errorMessage = error.error?.message || 'Failed to create task. Please try again.';
          setTimeout(() => {
            this.isSubmitting = false;
          });
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
}
