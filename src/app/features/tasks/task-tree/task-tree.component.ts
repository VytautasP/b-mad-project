import { Component, OnInit, OnDestroy, inject, signal, output, ElementRef, Renderer2, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTreeModule, MatTreeNestedDataSource } from '@angular/material/tree';
import { NestedTreeControl } from '@angular/cdk/tree';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DragDropModule, CdkDragDrop, CdkDragStart, CdkDragMove } from '@angular/cdk/drag-drop';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject, takeUntil, fromEvent } from 'rxjs';
import { TaskService } from '../services/task.service';
import { Task, TaskStatus, TaskPriority, TaskType } from '../../../shared/models/task.model';

// Tree node interface
interface TreeNode {
  task: Task;
  children: TreeNode[];
}

@Component({
  selector: 'app-task-tree',
  standalone: true,
  imports: [
    CommonModule,
    MatTreeModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    DragDropModule
  ],
  templateUrl: './task-tree.component.html',
  styleUrls: ['./task-tree.component.scss']
})
export class TaskTreeComponent implements OnInit, OnDestroy {
  private readonly taskService = inject(TaskService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly elementRef = inject(ElementRef);
  private readonly renderer = inject(Renderer2);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroy$ = new Subject<void>();
  private readonly EXPAND_STATE_KEY = 'taskflow_tree_expanded_nodes';
  private nodeElements = new Map<string, HTMLElement>();

  // Signals for reactive state
  isLoading = signal(true);
  tasks = signal<Task[]>([]);
  
  // Drag-drop state
  draggedNode: TreeNode | null = null;
  dropTargetNode: TreeNode | null = null;
  previousParentId: string | null = null;
  draggedTaskId: string | null = null;
  
  // Output event for task selection
  taskSelected = output<Task>();

  // Tree control and data source
  treeControl = new NestedTreeControl<TreeNode>(node => node.children);
  dataSource = new MatTreeNestedDataSource<TreeNode>();

  // Enum references for template
  TaskStatus = TaskStatus;
  TaskPriority = TaskPriority;
  TaskType = TaskType;

  ngOnInit(): void {
    this.loadTasks();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Load all tasks and build tree structure
   */
  private loadTasks(): void {
    this.isLoading.set(true);
    this.taskService.getTasks()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (tasks) => {
          this.tasks.set(tasks);
          const treeData = this.buildTreeStructure(tasks);
          this.dataSource.data = treeData;
          this.restoreExpandedState(treeData);
          this.isLoading.set(false);
        },
        error: (error) => {
          console.error('Error loading tasks:', error);
          this.isLoading.set(false);
        }
      });
  }

  /**
   * Build tree structure from flat task array
   */
  private buildTreeStructure(tasks: Task[]): TreeNode[] {
    const taskMap = new Map<string, TreeNode>();
    const rootNodes: TreeNode[] = [];

    // First pass: create all nodes
    tasks.forEach(task => {
      taskMap.set(task.id, {
        task: task,
        children: []
      });
    });

    // Second pass: build parent-child relationships
    tasks.forEach(task => {
      const node = taskMap.get(task.id)!;
      if (task.parentTaskId) {
        const parent = taskMap.get(task.parentTaskId);
        if (parent) {
          parent.children.push(node);
          console.log(`Added ${task.name} as child of parent (hasChildren=${parent.task.hasChildren})`);
        } else {
          rootNodes.push(node); // Parent not found, treat as root
        }
      } else {
        rootNodes.push(node); // No parent, is root
      }
    });

    console.log('Tree structure details:');
    taskMap.forEach((node, id) => {
      console.log(`  ${node.task.name}: hasChildren=${node.task.hasChildren}, children.length=${node.children.length}, parentId=${node.task.parentTaskId}`);
    });

    return rootNodes;
  }

  /**
   * Check if node has children
   */
  hasChild = (_: number, node: TreeNode): boolean => {
    return node.children.length > 0;
  };

  /**
   * Handle task name click
   */
  onTaskClick(task: Task): void {
    this.taskSelected.emit(task);
  }

  /**
   * Handle expand/collapse events
   */
  onNodeExpanded(node: TreeNode): void {
    this.saveExpandedState();
  }

  onNodeCollapsed(node: TreeNode): void {
    this.saveExpandedState();
  }

  /**
   * Save expanded node state to localStorage
   */
  private saveExpandedState(): void {
    // Collect all expanded node IDs by traversing the tree
    const expandedIds: string[] = [];
    const collectExpanded = (nodes: TreeNode[]) => {
      for (const node of nodes) {
        if (this.treeControl.isExpanded(node)) {
          expandedIds.push(node.task.id);
        }
        if (node.children.length > 0) {
          collectExpanded(node.children);
        }
      }
    };
    collectExpanded(this.dataSource.data);
    localStorage.setItem(this.EXPAND_STATE_KEY, JSON.stringify(expandedIds));
  }

  /**
   * Restore expanded state from localStorage
   */
  private restoreExpandedState(nodes: TreeNode[]): void {
    const storedState = localStorage.getItem(this.EXPAND_STATE_KEY);
    if (!storedState) return;

    try {
      const expandedIds: string[] = JSON.parse(storedState);
      const nodesToExpand = this.findNodesByIds(nodes, expandedIds);
      nodesToExpand.forEach(node => this.treeControl.expand(node));
    } catch (error) {
      console.error('Error restoring expanded state:', error);
    }
  }

  /**
   * Find nodes by IDs recursively
   */
  private findNodesByIds(nodes: TreeNode[], ids: string[]): TreeNode[] {
    const found: TreeNode[] = [];
    
    const search = (nodeList: TreeNode[]) => {
      for (const node of nodeList) {
        if (ids.includes(node.task.id)) {
          found.push(node);
        }
        if (node.children.length > 0) {
          search(node.children);
        }
      }
    };
    
    search(nodes);
    return found;
  }

  /**
   * Get status icon based on task status
   */
  getStatusIcon(status: TaskStatus): string {
    switch (status) {
      case TaskStatus.Done:
        return 'check_circle';
      case TaskStatus.InProgress:
        return 'pending';
      case TaskStatus.Blocked:
        return 'block';
      case TaskStatus.Waiting:
        return 'hourglass_top';
      case TaskStatus.ToDo:
      default:
        return 'radio_button_unchecked';
    }
  }

  /**
   * Get status color class
   */
  getStatusClass(status: TaskStatus): string {
    switch (status) {
      case TaskStatus.Done:
        return 'status-done';
      case TaskStatus.InProgress:
        return 'status-in-progress';
      case TaskStatus.Blocked:
        return 'status-blocked';
      case TaskStatus.Waiting:
        return 'status-waiting';
      case TaskStatus.ToDo:
      default:
        return 'status-todo';
    }
  }

  /**
   * Get priority icon
   */
  getPriorityIcon(priority: TaskPriority): string {
    switch (priority) {
      case TaskPriority.Critical:
      case TaskPriority.High:
      case TaskPriority.Medium:
      case TaskPriority.Low:
      default:
        return 'flag';
    }
  }

  /**
   * Get priority color class
   */
  getPriorityClass(priority: TaskPriority): string {
    switch (priority) {
      case TaskPriority.Critical:
        return 'priority-critical';
      case TaskPriority.High:
        return 'priority-high';
      case TaskPriority.Low:
        return 'priority-low';
      case TaskPriority.Medium:
      default:
        return 'priority-medium';
    }
  }

  /**
   * Get task type icon
   */
  getTypeIcon(type: TaskType): string {
    switch (type) {
      case TaskType.Project:
        return 'folder';
      case TaskType.Milestone:
        return 'flag';
      case TaskType.Task:
      default:
        return 'check_box';
    }
  }

  /**
   * Refresh tree data
   */
  refresh(): void {
    this.loadTasks();
  }

  /**
   * Handle drag start event
   */
  onDragStart(event: CdkDragStart, node: TreeNode): void {
    this.draggedNode = node;
    this.draggedTaskId = node.task.id;
    this.previousParentId = node.task.parentTaskId;
    
    // Set up drag move listener to detect hover over nodes (only if dragRef available)
    if (event.source?._dragRef) {
      const dragRef = event.source._dragRef;
      const moveSubscription = dragRef.moved.pipe(takeUntil(this.destroy$)).subscribe((moveEvent) => {
        this.onDragMove(moveEvent);
      });
      
      // Clean up on drag end
      dragRef.ended.pipe(takeUntil(this.destroy$)).subscribe(() => {
        moveSubscription.unsubscribe();
      });
    }
  }

  /**
   * Handle drag move to detect hover over nodes
   */
  onDragMove(event: any): void {
    const point = event.pointerPosition;
    const elements = document.elementsFromPoint(point.x, point.y);
    
    // Find the closest tree node content element
    const nodeContent = elements.find(el => 
      el.classList.contains('tree-node-content')
    ) as HTMLElement;
    
    if (nodeContent) {
      // Get the node data from the tree structure
      const taskName = nodeContent.querySelector('.task-name')?.textContent?.trim();
      if (taskName) {
        const node = this.findNodeByTaskName(taskName);
        if (node && node.task.id !== this.draggedNode?.task.id) {
          this.dropTargetNode = node;
          return;
        }
      }
    }
    
    // If not over a valid node, clear drop target
    this.dropTargetNode = null;
  }

  /**
   * Find node by task name
   */
  private findNodeByTaskName(taskName: string): TreeNode | null {
    const findInNodes = (nodes: TreeNode[]): TreeNode | null => {
      for (const node of nodes) {
        if (node.task.name === taskName) {
          return node;
        }
        if (node.children.length > 0) {
          const found = findInNodes(node.children);
          if (found) return found;
        }
      }
      return null;
    };
    return findInNodes(this.dataSource.data);
  }

  /**
   * Handle mouse enter on node (for drop target highlighting)
   */
  onNodeMouseEnter(node: TreeNode): void {
    if (this.draggedNode && this.draggedNode.task.id !== node.task.id) {
      this.dropTargetNode = node;
    }
  }

  /**
   * Handle mouse leave from node
   */
  onNodeMouseLeave(): void {
    // Don't clear drop target during drag - let it persist until drop or drag end
    // Only clear visual feedback, keep the target for drop processing
  }

  /**
   * Handle node click (for drop target during drag)
   */
  onNodeClick(event: Event, node: TreeNode): void {
    // If dragging, use click as drop action
    if (this.draggedNode && this.draggedNode.task.id !== node.task.id) {
      event.preventDefault();
      event.stopPropagation();
      this.performDropOnNode(node);
    }
  }

  /**
   * Handle cdkDragDropped event on a node
   */
  onNodeDrop(event: any, node: TreeNode): void {
    console.log('onNodeDrop called', { event, node, draggedNode: this.draggedNode });
    if (this.draggedNode && this.draggedNode.task.id !== node.task.id) {
      this.performDropOnNode(node);
    }
  }

  /**
   * Perform drop operation on a specific node
   */
  private performDropOnNode(targetNode: TreeNode): void {
    if (!this.draggedNode) return;

    const draggedTaskId = this.draggedNode.task.id;
    const targetParentId = targetNode.task.id;

    console.log('performDropOnNode:', { draggedTaskId, targetParentId });

    // Validate drop
    if (!this.isValidDrop(draggedTaskId, targetParentId)) {
      this.snackBar.open('Cannot move task: Invalid drop location', 'Close', { duration: 3000 });
      this.resetDragState();
      return;
    }

    // Perform reparenting
    this.performReparenting(draggedTaskId, targetParentId);
  }

  /**
   * Handle drop event
   */
  onDrop(event: CdkDragDrop<TreeNode>): void {
    if (!this.draggedNode) {
      this.resetDragState();
      return;
    }

    const draggedTaskId = this.draggedNode.task.id;
    // Get target from the drop container's data
    const targetNode = event.container.data;
    const targetParentId = targetNode?.task.id ?? null;

    // Validate drop
    if (!this.isValidDrop(draggedTaskId, targetParentId)) {
      this.snackBar.open('Cannot move task: Invalid drop location', 'Close', { duration: 3000 });
      this.resetDragState();
      return;
    }

    // Perform reparenting (resetDragState is called inside performReparenting after API call)
    this.performReparenting(draggedTaskId, targetParentId);
  }

  /**
   * Handle drag end event (only called if drag is cancelled without drop)
   */
  onDragEnd(): void {
    // Delay reset to allow drop event to fire first
    setTimeout(() => {
      if (this.draggedNode) {
        this.resetDragState();
      }
    }, 100);
  }

  /**
   * Validate if drop is allowed
   */
  private isValidDrop(draggedTaskId: string, targetParentId: string | null): boolean {
    // Cannot drop task on itself
    if (draggedTaskId === targetParentId) {
      return false;
    }

    // Cannot drop task on its descendants
    if (targetParentId && this.isDescendant(draggedTaskId, targetParentId)) {
      return false;
    }

    return true;
  }

  /**
   * Check if potentialDescendantId is a descendant of taskId
   */
  private isDescendant(taskId: string, potentialDescendantId: string): boolean {
    const task = this.tasks().find(t => t.id === potentialDescendantId);
    if (!task) return false;

    // If no parent, it's not a descendant
    if (!task.parentTaskId) return false;

    // If parent is the taskId, it's a direct descendant
    if (task.parentTaskId === taskId) return true;

    // Recursively check parent
    return this.isDescendant(taskId, task.parentTaskId);
  }

  /**
   * Perform the actual reparenting operation
   */
  private performReparenting(taskId: string, newParentId: string | null): void {
    const observable = newParentId
      ? this.taskService.setParentTask(taskId, newParentId)
      : this.taskService.removeParent(taskId);

    observable
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          console.log('Reparenting successful, reloading tasks...');
          // Reload tasks from server to get accurate hasChildren values
          this.taskService.getTasks()
            .pipe(takeUntil(this.destroy$))
            .subscribe({
              next: (tasks) => {
                console.log('Tasks reloaded:', tasks.length, 'tasks');
                this.tasks.set(tasks);
                const treeData = this.buildTreeStructure(tasks);
                console.log('Tree structure built:', treeData.length, 'root nodes');
                this.dataSource.data = treeData;
                // Restore expanded state
                this.restoreExpandedState(treeData);
                // Force change detection
                this.cdr.markForCheck();
                console.log('Tree updated after reparenting');
              },
              error: (error) => {
                console.error('Error reloading tasks after reparenting:', error);
              }
            });

          // Show success notification with undo
          const snackBarRef = this.snackBar.open(
            'Task moved successfully',
            'Undo',
            { duration: 5000 }
          );

          snackBarRef.onAction()
            .pipe(takeUntil(this.destroy$))
            .subscribe(() => {
              this.undoReparenting(taskId, this.previousParentId);
            });

          this.resetDragState();
        },
        error: (error) => {
          console.error('Error reparenting task:', error);
          const errorMessage = error.error?.message || 'Failed to move task';
          this.snackBar.open(errorMessage, 'Close', { duration: 3000 });
          this.resetDragState();
        }
      });
  }

  /**
   * Undo reparenting operation
   */
  private undoReparenting(taskId: string, previousParentId: string | null): void {
    const observable = previousParentId
      ? this.taskService.setParentTask(taskId, previousParentId)
      : this.taskService.removeParent(taskId);

    observable
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          // Reload tasks from server
          this.taskService.getTasks()
            .pipe(takeUntil(this.destroy$))
            .subscribe({
              next: (tasks) => {
                this.tasks.set(tasks);
                const treeData = this.buildTreeStructure(tasks);
                this.dataSource.data = treeData;
                this.restoreExpandedState(treeData);
              },
              error: (error) => {
                console.error('Error reloading tasks after undo:', error);
              }
            });

          this.snackBar.open('Move undone', 'Close', { duration: 2000 });
        },
        error: (error) => {
          console.error('Error undoing reparenting:', error);
          this.snackBar.open('Failed to undo move', 'Close', { duration: 3000 });
        }
      });
  }

  /**
   * Reset drag state
   */
  private resetDragState(): void {
    this.draggedNode = null;
    this.dropTargetNode = null;
    this.draggedTaskId = null;
    this.previousParentId = null;
    // Mark for check to avoid ExpressionChangedAfterItHasBeenCheckedError
    this.cdr.markForCheck();
  }

  /**
   * Check if node is a valid drop target
   */
  isValidDropTarget(targetNode: TreeNode | null): boolean {
    if (!this.draggedNode) return false;
    
    const draggedTaskId = this.draggedNode.task.id;
    const targetParentId = targetNode?.task.id ?? null;
    
    return this.isValidDrop(draggedTaskId, targetParentId);
  }

  /**
   * Predicate to determine if a node can be dragged
   */
  canDrag = (item: TreeNode): boolean => {
    return true; // All nodes can be dragged
  };
}
