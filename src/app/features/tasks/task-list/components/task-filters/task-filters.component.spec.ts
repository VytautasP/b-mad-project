// @ts-nocheck
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatNativeDateModule } from '@angular/material/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { TaskFiltersComponent, User } from './task-filters.component';
import { TaskStatus, TaskPriority, TaskType, TaskFilters } from '../../../../../shared/models/task.model';

describe('TaskFiltersComponent', () => {
  let component: TaskFiltersComponent;
  let fixture: ComponentFixture<TaskFiltersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        TaskFiltersComponent,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatSelectModule,
        MatButtonModule,
        MatChipsModule,
        MatDatepickerModule,
        MatNativeDateModule,
        MatInputModule,
        MatExpansionModule,
        MatIconModule,
        BrowserAnimationsModule
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TaskFiltersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Form Initialization', () => {
    it('should initialize filter form with empty values', () => {
      expect(component.filterForm).toBeDefined();
      expect(component.filterForm.get('assigneeId')?.value).toEqual([]);
      expect(component.filterForm.get('status')?.value).toEqual([]);
      expect(component.filterForm.get('priority')?.value).toEqual([]);
      expect(component.filterForm.get('type')?.value).toEqual([]);
      expect(component.filterForm.get('dueDateFrom')?.value).toBeNull();
      expect(component.filterForm.get('dueDateTo')?.value).toBeNull();
      expect(component.filterForm.get('searchTerm')?.value).toBe('');
    });

    it('should populate form with initial filters', () => {
      const initialFilters: TaskFilters = {
        status: [TaskStatus.InProgress],
        priority: [TaskPriority.High],
        searchTerm: 'test'
      };
      
      component.initialFilters = initialFilters;
      component.ngOnInit();
      
      expect(component.filterForm.get('status')?.value).toEqual([TaskStatus.InProgress]);
      expect(component.filterForm.get('priority')?.value).toEqual([TaskPriority.High]);
      expect(component.filterForm.get('searchTerm')?.value).toBe('test');
    });
  });

  describe('Apply Filters', () => {
    it('should emit filtersChanged event with correct filter object', (done) => {
      component.filtersChanged.subscribe((filters: TaskFilters) => {
        expect(filters.status).toEqual([TaskStatus.InProgress]);
        expect(filters.priority).toEqual([TaskPriority.High]);
        done();
      });

      component.filterForm.patchValue({
        status: [TaskStatus.InProgress],
        priority: [TaskPriority.High]
      });

      component.onApplyFilters();
    });

    it('should update active filter chips when filters applied', () => {
      component.filterForm.patchValue({
        status: [TaskStatus.InProgress, TaskStatus.Done],
        priority: [TaskPriority.High]
      });

      component.onApplyFilters();

      expect(component.activeFilterChips().length).toBe(3); // 2 status + 1 priority
    });
  });

  describe('Clear Filters', () => {
    it('should reset form to initial values', () => {
      component.filterForm.patchValue({
        status: [TaskStatus.InProgress],
        priority: [TaskPriority.High],
        searchTerm: 'test'
      });

      component.onClearFilters();

      expect(component.filterForm.get('status')?.value).toEqual([]);
      expect(component.filterForm.get('priority')?.value).toEqual([]);
      expect(component.filterForm.get('searchTerm')?.value).toBe('');
    });

    it('should emit filtersCleared event', (done) => {
      component.filtersCleared.subscribe(() => {
        done();
      });

      component.onClearFilters();
    });

    it('should clear active filter chips', () => {
      component.filterForm.patchValue({
        status: [TaskStatus.InProgress]
      });
      component.onApplyFilters();

      expect(component.activeFilterChips().length).toBeGreaterThan(0);

      component.onClearFilters();

      expect(component.activeFilterChips().length).toBe(0);
    });
  });

  describe('Chip Removal', () => {
    it('should remove specific filter value from array', () => {
      component.filterForm.patchValue({
        status: [TaskStatus.InProgress, TaskStatus.Done]
      });

      const chip = { key: 'status', value: TaskStatus.InProgress.toString() };
      component.removeFilter(chip);

      const statusValue = component.filterForm.get('status')?.value;
      expect(statusValue).toEqual([TaskStatus.Done]);
    });

    it('should clear single value filter', () => {
      const date = new Date();
      component.filterForm.patchValue({
        dueDateFrom: date
      });

      const chip = { key: 'dueDateFrom', value: 'dueDateFrom' };
      component.removeFilter(chip);

      expect(component.filterForm.get('dueDateFrom')?.value).toBeNull();
    });

    it('should emit filtersChanged after chip removal', (done) => {
      component.filtersChanged.subscribe(() => {
        done();
      });

      component.filterForm.patchValue({
        status: [TaskStatus.InProgress]
      });

      const chip = { key: 'status', value: TaskStatus.InProgress.toString() };
      component.removeFilter(chip);
    });
  });

  describe('Multi-Select Controls', () => {
    it('should handle multiple status selections', () => {
      const statuses = [TaskStatus.InProgress, TaskStatus.Done, TaskStatus.Blocked];
      component.filterForm.get('status')?.setValue(statuses);

      expect(component.filterForm.get('status')?.value).toEqual(statuses);
    });

    it('should handle multiple priority selections', () => {
      const priorities = [TaskPriority.High, TaskPriority.Critical];
      component.filterForm.get('priority')?.setValue(priorities);

      expect(component.filterForm.get('priority')?.value).toEqual(priorities);
    });

    it('should handle multiple type selections', () => {
      const types = [TaskType.Task, TaskType.Project];
      component.filterForm.get('type')?.setValue(types);

      expect(component.filterForm.get('type')?.value).toEqual(types);
    });

    it('should handle multiple assignee selections', () => {
      const mockUsers: User[] = [
        { id: '1', name: 'User 1', email: 'user1@test.com' },
        { id: '2', name: 'User 2', email: 'user2@test.com' }
      ];
      component.users = mockUsers;
      
      const assigneeIds = ['1', '2'];
      component.filterForm.get('assigneeId')?.setValue(assigneeIds);

      expect(component.filterForm.get('assigneeId')?.value).toEqual(assigneeIds);
    });
  });

  describe('Active Filter Chips', () => {
    it('should create chips for all filter types', () => {
      const mockUsers: User[] = [
        { id: '1', name: 'User 1', email: 'user1@test.com' }
      ];
      component.users = mockUsers;

      component.filterForm.patchValue({
        assigneeId: ['1'],
        status: [TaskStatus.InProgress],
        priority: [TaskPriority.High],
        type: [TaskType.Task],
        dueDateFrom: new Date('2024-01-01'),
        dueDateTo: new Date('2024-12-31'),
        searchTerm: 'test'
      });

      component.onApplyFilters();

      const chips = component.activeFilterChips();
      expect(chips.length).toBe(6); // assignee, status, priority, type, dateFrom, dateTo
    });

    it('should display correct chip text for status', () => {
      component.filterForm.patchValue({
        status: [TaskStatus.InProgress]
      });

      component.onApplyFilters();

      const chips = component.activeFilterChips();
      const statusChip = chips.find(c => c.key === 'status');
      expect(statusChip?.displayText).toContain('In Progress');
    });

    it('should display correct chip text for priority', () => {
      component.filterForm.patchValue({
        priority: [TaskPriority.High]
      });

      component.onApplyFilters();

      const chips = component.activeFilterChips();
      const priorityChip = chips.find(c => c.key === 'priority');
      expect(priorityChip?.displayText).toContain('High');
    });

    it('should display user name in assignee chip', () => {
      const mockUsers: User[] = [
        { id: '1', name: 'John Doe', email: 'john@test.com' }
      ];
      component.users = mockUsers;

      component.filterForm.patchValue({
        assigneeId: ['1']
      });

      component.onApplyFilters();

      const chips = component.activeFilterChips();
      const assigneeChip = chips.find(c => c.key === 'assigneeId');
      expect(assigneeChip?.displayText).toContain('John Doe');
    });
  });
});
