import { Component, OnInit, OnDestroy, inject, signal, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTreeModule, MatTreeNestedDataSource } from '@angular/material/tree';
import { NestedTreeControl } from '@angular/cdk/tree';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subject, takeUntil } from 'rxjs';
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
    MatProgressSpinnerModule
  ],
  templateUrl: './task-tree.component.html',
  styleUrls: ['./task-tree.component.scss']
})
export class TaskTreeComponent implements OnInit, OnDestroy {
  private readonly taskService = inject(TaskService);
  private readonly destroy$ = new Subject<void>();
  private readonly EXPAND_STATE_KEY = 'taskflow_tree_expanded_nodes';

  // Signals for reactive state
  isLoading = signal(true);
  tasks = signal<Task[]>([]);
  
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
        } else {
          rootNodes.push(node); // Parent not found, treat as root
        }
      } else {
        rootNodes.push(node); // No parent, is root
      }
    });

    return rootNodes;
  }

  /**
   * Check if node has children
   */
  hasChild = (_: number, node: TreeNode): boolean => {
    return node.task.hasChildren && node.children.length > 0;
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
    const expandedIds = this.treeControl.dataNodes
      ?.filter(node => this.treeControl.isExpanded(node))
      .map(node => node.task.id) || [];
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
        return 'hourglass_empty';
      case TaskStatus.Blocked:
        return 'block';
      case TaskStatus.Waiting:
        return 'schedule';
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
        return 'arrow_upward';
      case TaskPriority.Low:
        return 'arrow_downward';
      case TaskPriority.Medium:
      default:
        return 'remove';
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
}
