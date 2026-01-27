import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TaskTreeComponent } from './task-tree.component';
import { TaskService } from '../services/task.service';
import { of, throwError } from 'rxjs';
import { Task, TaskStatus, TaskPriority, TaskType } from '../../../shared/models/task.model';

describe('TaskTreeComponent', () => {
  let component: TaskTreeComponent;
  let fixture: ComponentFixture<TaskTreeComponent>;
  let mockTaskService: Partial<TaskService>;

  const mockTasks: Task[] = [
    {
      id: '1',
      name: 'Root Task 1',
      description: null,
      parentTaskId: null,
      hasChildren: true,
      createdByUserId: 'user1',
      createdByUserName: 'User 1',
      createdDate: new Date(),
      modifiedDate: new Date(),
      dueDate: null,
      priority: TaskPriority.High,
      status: TaskStatus.InProgress,
      progress: 50,
      type: TaskType.Project,
      isDeleted: false
    },
    {
      id: '2',
      name: 'Child Task 1-1',
      description: null,
      parentTaskId: '1',
      hasChildren: false,
      createdByUserId: 'user1',
      createdByUserName: 'User 1',
      createdDate: new Date(),
      modifiedDate: new Date(),
      dueDate: null,
      priority: TaskPriority.Medium,
      status: TaskStatus.ToDo,
      progress: 0,
      type: TaskType.Task,
      isDeleted: false
    },
    {
      id: '3',
      name: 'Root Task 2',
      description: null,
      parentTaskId: null,
      hasChildren: false,
      createdByUserId: 'user1',
      createdByUserName: 'User 1',
      createdDate: new Date(),
      modifiedDate: new Date(),
      dueDate: null,
      priority: TaskPriority.Low,
      status: TaskStatus.Done,
      progress: 100,
      type: TaskType.Task,
      isDeleted: false
    }
  ];

  beforeEach(async () => {
    mockTaskService = {
      getTasks: vi.fn().mockReturnValue(of(mockTasks))
    };

    await TestBed.configureTestingModule({
      imports: [TaskTreeComponent],
      providers: [
        { provide: TaskService, useValue: mockTaskService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TaskTreeComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load tasks on init', () => {
    fixture.detectChanges();
    expect(mockTaskService.getTasks).toHaveBeenCalled();
    expect(component.tasks().length).toBe(3);
  });

  it('should build tree structure correctly', () => {
    fixture.detectChanges();
    expect(component.dataSource.data.length).toBe(2); // 2 root tasks
    expect(component.dataSource.data[0].children.length).toBe(1); // First root has 1 child
    expect(component.dataSource.data[1].children.length).toBe(0); // Second root has no children
  });

  it('should show loading state initially', () => {
    expect(component.isLoading()).toBe(true);
  });

  it('should hide loading state after tasks loaded', () => {
    fixture.detectChanges();
    expect(component.isLoading()).toBe(false);
  });

  it('should emit taskSelected when task is clicked', () => {
    let selectedTask: Task | undefined;
    component.taskSelected.subscribe(task => selectedTask = task);
    
    component.onTaskClick(mockTasks[0]);
    
    expect(selectedTask).toEqual(mockTasks[0]);
  });

  it('should determine if node has children', () => {
    fixture.detectChanges();
    const rootNode = component.dataSource.data[0];
    const leafNode = component.dataSource.data[0].children[0];
    
    expect(component.hasChild(0, rootNode)).toBe(true);
    expect(component.hasChild(0, leafNode)).toBe(false);
  });

  it('should handle error when loading tasks', () => {
    mockTaskService.getTasks = vi.fn().mockReturnValue(throwError(() => new Error('Test error')));
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    fixture.detectChanges();
    
    expect(consoleSpy).toHaveBeenCalled();
    expect(component.isLoading()).toBe(false);
    
    consoleSpy.mockRestore();
  });

  it('should return correct status icon', () => {
    expect(component.getStatusIcon(TaskStatus.Done)).toBe('check_circle');
    expect(component.getStatusIcon(TaskStatus.InProgress)).toBe('hourglass_empty');
    expect(component.getStatusIcon(TaskStatus.Blocked)).toBe('block');
    expect(component.getStatusIcon(TaskStatus.Waiting)).toBe('schedule');
    expect(component.getStatusIcon(TaskStatus.ToDo)).toBe('radio_button_unchecked');
  });

  it('should return correct priority icon', () => {
    expect(component.getPriorityIcon(TaskPriority.Critical)).toBe('arrow_upward');
    expect(component.getPriorityIcon(TaskPriority.High)).toBe('arrow_upward');
    expect(component.getPriorityIcon(TaskPriority.Medium)).toBe('remove');
    expect(component.getPriorityIcon(TaskPriority.Low)).toBe('arrow_downward');
  });

  it('should return correct type icon', () => {
    expect(component.getTypeIcon(TaskType.Project)).toBe('folder');
    expect(component.getTypeIcon(TaskType.Milestone)).toBe('flag');
    expect(component.getTypeIcon(TaskType.Task)).toBe('check_box');
  });

  it('should save and restore expanded state', () => {
    fixture.detectChanges();
    const rootNode = component.dataSource.data[0];
    
    component.treeControl.expand(rootNode);
    component.onNodeExpanded(rootNode);
    
    const savedState = localStorage.getItem('taskflow_tree_expanded_nodes');
    expect(savedState).toBeTruthy();
    
    const expandedIds = JSON.parse(savedState!);
    expect(expandedIds).toContain('1');
  });
});