import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TaskTreeComponent } from './task-tree.component';
import { TaskService } from '../services/task.service';
import { of, throwError } from 'rxjs';
import { Task, TaskStatus, TaskPriority, TaskType } from '../../../shared/models/task.model';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CdkDragStart } from '@angular/cdk/drag-drop';

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
      getTasks: vi.fn().mockReturnValue(of(mockTasks)),
      setParentTask: vi.fn().mockReturnValue(of(undefined)),
      removeParent: vi.fn().mockReturnValue(of(undefined))
    };

    await TestBed.configureTestingModule({
      imports: [TaskTreeComponent],
      providers: [
        { provide: TaskService, useValue: mockTaskService },
        { provide: MatSnackBar, useValue: { open: vi.fn().mockReturnValue({ onAction: () => of() }) } }
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

  // Drag-drop tests
  describe('Drag-Drop Functionality', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should set dragged node on drag start', () => {
      const node = component.dataSource.data[0];
      const event = {} as CdkDragStart;
      
      component.onDragStart(event, node);
      
      expect(component.draggedNode).toBe(node);
      expect(component.draggedTaskId).toBe('1');
      expect(component.previousParentId).toBeNull();
    });

    it('should set drop target node on mouse enter', () => {
      const draggedNode = component.dataSource.data[0];
      const targetNode = component.dataSource.data[1];
      
      component.draggedNode = draggedNode;
      component.onNodeMouseEnter(targetNode);
      
      expect(component.dropTargetNode).toBe(targetNode);
    });

    it('should not set drop target on mouse enter when not dragging', () => {
      const node = component.dataSource.data[1];
      
      component.onNodeMouseEnter(node);
      
      expect(component.dropTargetNode).toBeNull();
    });

    it('should clear drop target on mouse leave', () => {
      component.dropTargetNode = component.dataSource.data[0];
      
      component.onNodeMouseLeave();
      
      expect(component.dropTargetNode).toBeNull();
    });

    it('should reset drag state on drag end', () => {
      const node = component.dataSource.data[0];
      component.draggedNode = node;
      component.draggedTaskId = '1';
      component.dropTargetNode = component.dataSource.data[1];
      
      component.onDragEnd();
      
      expect(component.draggedNode).toBeNull();
      expect(component.draggedTaskId).toBeNull();
      expect(component.dropTargetNode).toBeNull();
    });

    it('should validate drop - cannot drop on itself', () => {
      const node = component.dataSource.data[0];
      component.draggedNode = node;
      
      const isValid = component.isValidDropTarget(node);
      
      expect(isValid).toBe(false);
    });

    it('should validate drop - cannot drop on descendant', () => {
      const parentNode = component.dataSource.data[0];
      const childNode = parentNode.children[0];
      component.draggedNode = parentNode;
      
      const isValid = component.isValidDropTarget(childNode);
      
      expect(isValid).toBe(false);
    });

    it('should validate drop - can drop on unrelated task', () => {
      const node1 = component.dataSource.data[0];
      const node2 = component.dataSource.data[1];
      component.draggedNode = node1;
      
      const isValid = component.isValidDropTarget(node2);
      
      expect(isValid).toBe(true);
    });

    it('should call setParentTask API when dropping on a task', () => {
      const draggedNode = component.dataSource.data[1];
      const targetNode = component.dataSource.data[0];
      component.draggedNode = draggedNode;
      
      const event = {} as any;
      component.onDrop(event, targetNode);
      
      expect(mockTaskService.setParentTask).toHaveBeenCalledWith('3', '1');
    });

    it('should call removeParent API when dropping on root', () => {
      const childNode = component.dataSource.data[0].children[0];
      component.draggedNode = childNode;
      
      const event = {} as any;
      component.onDrop(event, null);
      
      expect(mockTaskService.removeParent).toHaveBeenCalledWith('2');
    });

    it('should show error notification for invalid drop', () => {
      const node = component.dataSource.data[0];
      component.draggedNode = node;
      const snackBar = TestBed.inject(MatSnackBar);
      
      const event = {} as any;
      component.onDrop(event, node);
      
      expect(snackBar.open).toHaveBeenCalledWith('Cannot move task: Invalid drop location', 'Close', { duration: 3000 });
    });

    it('should update local state after successful reparenting', async () => {
      const draggedNode = component.dataSource.data[1];
      const targetNode = component.dataSource.data[0];
      component.draggedNode = draggedNode;
      
      const event = {} as any;
      component.onDrop(event, targetNode);
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const updatedTask = component.tasks().find(t => t.id === '3');
      expect(updatedTask?.parentTaskId).toBe('1');
    });

    it('should show undo notification after successful reparenting', () => {
      const draggedNode = component.dataSource.data[1];
      const targetNode = component.dataSource.data[0];
      component.draggedNode = draggedNode;
      const snackBar = TestBed.inject(MatSnackBar);
      
      const event = {} as any;
      component.onDrop(event, targetNode);
      
      expect(snackBar.open).toHaveBeenCalledWith('Task moved successfully', 'Undo', { duration: 5000 });
    });

    it('should handle API error during reparenting', () => {
      mockTaskService.setParentTask = vi.fn().mockReturnValue(throwError(() => ({ error: { message: 'Circular reference detected' } })));
      
      const draggedNode = component.dataSource.data[1];
      const targetNode = component.dataSource.data[0];
      component.draggedNode = draggedNode;
      const snackBar = TestBed.inject(MatSnackBar);
      
      const event = {} as any;
      component.onDrop(event, targetNode);
      
      expect(snackBar.open).toHaveBeenCalledWith('Circular reference detected', 'Close', { duration: 3000 });
    });

    it('should detect descendant relationship correctly', () => {
      const isDesc = component['isDescendant']('1', '2');
      expect(isDesc).toBe(true);
      
      const isNotDesc = component['isDescendant']('1', '3');
      expect(isNotDesc).toBe(false);
    });
  });
});
