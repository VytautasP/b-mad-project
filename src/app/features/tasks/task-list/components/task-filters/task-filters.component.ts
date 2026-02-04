import { Component, OnInit, inject, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { TaskFilters, TaskPriority, TaskStatus, TaskType } from '../../../../../shared/models/task.model';

export interface User {
  id: string;
  name: string;
  email: string;
}

@Component({
  selector: 'app-task-filters',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    MatChipsModule,
    MatDatepickerModule,
    MatInputModule,
    MatExpansionModule,
    MatIconModule
  ],
  templateUrl: './task-filters.component.html',
  styleUrl: './task-filters.component.scss'
})
export class TaskFiltersComponent implements OnInit {
  private readonly fb = inject(FormBuilder);

  @Input() users: User[] = [];
  @Input() initialFilters?: TaskFilters;
  @Output() filtersChanged = new EventEmitter<TaskFilters>();
  @Output() filtersCleared = new EventEmitter<void>();

  filterForm!: FormGroup;
  activeFilterChips = signal<Array<{ key: string; value: string; displayText: string }>>([]);

  // Enum references for template
  TaskStatus = TaskStatus;
  TaskPriority = TaskPriority;
  TaskType = TaskType;

  // Filter options
  statusOptions = [
    { value: TaskStatus.ToDo, label: 'To Do' },
    { value: TaskStatus.InProgress, label: 'In Progress' },
    { value: TaskStatus.Blocked, label: 'Blocked' },
    { value: TaskStatus.Waiting, label: 'Waiting' },
    { value: TaskStatus.Done, label: 'Done' }
  ];

  priorityOptions = [
    { value: TaskPriority.Low, label: 'Low' },
    { value: TaskPriority.Medium, label: 'Medium' },
    { value: TaskPriority.High, label: 'High' },
    { value: TaskPriority.Critical, label: 'Critical' }
  ];

  typeOptions = [
    { value: TaskType.Project, label: 'Project' },
    { value: TaskType.Milestone, label: 'Milestone' },
    { value: TaskType.Task, label: 'Task' }
  ];

  ngOnInit(): void {
    this.filterForm = this.fb.group({
      assigneeId: [[]],
      status: [[]],
      priority: [[]],
      type: [[]],
      dueDateFrom: [null],
      dueDateTo: [null],
      searchTerm: ['']
    });

    // Apply initial filters if provided
    if (this.initialFilters) {
      this.filterForm.patchValue(this.initialFilters);
      this.updateActiveChips();
    }
  }

  onApplyFilters(): void {
    const filters: TaskFilters = this.filterForm.value;
    this.updateActiveChips();
    this.filtersChanged.emit(filters);
  }

  onClearFilters(): void {
    this.filterForm.reset({
      assigneeId: [],
      status: [],
      priority: [],
      type: [],
      dueDateFrom: null,
      dueDateTo: null,
      searchTerm: ''
    });
    this.activeFilterChips.set([]);
    this.filtersCleared.emit();
  }

  removeFilter(chip: { key: string; value: string }): void {
    const control = this.filterForm.get(chip.key);
    if (control) {
      if (Array.isArray(control.value)) {
        // Remove specific value from array
        const newValue = control.value.filter((v: any) => v.toString() !== chip.value);
        control.setValue(newValue);
      } else {
        // Clear single value
        control.setValue(null);
      }
      this.onApplyFilters();
    }
  }

  private updateActiveChips(): void {
    const chips: Array<{ key: string; value: string; displayText: string }> = [];
    const formValue = this.filterForm.value;

    // Assignees
    if (formValue.assigneeId && formValue.assigneeId.length > 0) {
      formValue.assigneeId.forEach((id: string) => {
        const user = this.users.find(u => u.id === id);
        chips.push({
          key: 'assigneeId',
          value: id,
          displayText: `Assignee: ${user?.name || id}`
        });
      });
    }

    // Status
    if (formValue.status && formValue.status.length > 0) {
      formValue.status.forEach((status: TaskStatus) => {
        const option = this.statusOptions.find(o => o.value === status);
        chips.push({
          key: 'status',
          value: status.toString(),
          displayText: `Status: ${option?.label || status}`
        });
      });
    }

    // Priority
    if (formValue.priority && formValue.priority.length > 0) {
      formValue.priority.forEach((priority: TaskPriority) => {
        const option = this.priorityOptions.find(o => o.value === priority);
        chips.push({
          key: 'priority',
          value: priority.toString(),
          displayText: `Priority: ${option?.label || priority}`
        });
      });
    }

    // Type
    if (formValue.type && formValue.type.length > 0) {
      formValue.type.forEach((type: TaskType) => {
        const option = this.typeOptions.find(o => o.value === type);
        chips.push({
          key: 'type',
          value: type.toString(),
          displayText: `Type: ${option?.label || type}`
        });
      });
    }

    // Date Range
    if (formValue.dueDateFrom) {
      chips.push({
        key: 'dueDateFrom',
        value: 'dueDateFrom',
        displayText: `From: ${new Date(formValue.dueDateFrom).toLocaleDateString()}`
      });
    }

    if (formValue.dueDateTo) {
      chips.push({
        key: 'dueDateTo',
        value: 'dueDateTo',
        displayText: `To: ${new Date(formValue.dueDateTo).toLocaleDateString()}`
      });
    }

    this.activeFilterChips.set(chips);
  }
}
