import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { catchError, tap, map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { Task, TaskCreateDto, TaskUpdateDto, TaskStatus, TaskAssignmentDto, TaskFilters, PaginatedResult } from '../../../shared/models/task.model';

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/api/tasks`;
  
  // State management for task list
  private tasksSubject = new BehaviorSubject<Task[]>([]);
  public tasks$ = this.tasksSubject.asObservable();

  /**
   * Fetch all tasks for the current user with optional search, status filters, and myTasks flag
   * @deprecated Use getTasksPaginated for new features
   */
  getTasks(search?: string, status?: TaskStatus, myTasksOnly: boolean = false): Observable<Task[]> {
    let params = new HttpParams();
    
    if (search && search.trim()) {
      params = params.set('search', search.trim());
    }
    
    if (status !== undefined && status !== null) {
      params = params.set('status', status.toString());
    }
    
    if (myTasksOnly) {
      params = params.set('myTasks', 'true');
    }
    
    return this.http.get<Task[]>(this.apiUrl, { params }).pipe(
      tap(tasks => this.tasksSubject.next(tasks)),
      catchError(this.handleError)
    );
  }

  /**
   * Fetch tasks with advanced filtering, sorting, and pagination
   */
  getTasksPaginated(
    filters?: TaskFilters,
    sortBy?: string,
    sortOrder: 'asc' | 'desc' = 'asc',
    page: number = 1,
    pageSize: number = 50
  ): Observable<PaginatedResult<Task>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());

    // Add sorting parameters
    if (sortBy) {
      params = params.set('sortBy', sortBy);
      params = params.set('sortOrder', sortOrder);
    }

    // Add filter parameters
    if (filters) {
      if (filters.searchTerm && filters.searchTerm.trim()) {
        params = params.set('search', filters.searchTerm.trim());
      }

      if (filters.assigneeId && filters.assigneeId.length > 0) {
        filters.assigneeId.forEach(id => {
          params = params.append('assigneeId', id);
        });
      }

      if (filters.status && filters.status.length > 0) {
        filters.status.forEach(status => {
          params = params.append('status', status.toString());
        });
      }

      if (filters.priority && filters.priority.length > 0) {
        filters.priority.forEach(priority => {
          params = params.append('priority', priority.toString());
        });
      }

      if (filters.type && filters.type.length > 0) {
        filters.type.forEach(type => {
          params = params.append('type', type.toString());
        });
      }

      if (filters.dueDateFrom) {
        params = params.set('dueDateFrom', filters.dueDateFrom.toISOString());
      }

      if (filters.dueDateTo) {
        params = params.set('dueDateTo', filters.dueDateTo.toISOString());
      }
    }

    return this.http.get<PaginatedResult<Task>>(this.apiUrl, { params }).pipe(
      tap(result => this.tasksSubject.next(result.items)),
      catchError(this.handleError)
    );
  }

  /**
   * Get count of tasks assigned to current user
   */
  getMyTasksCount(): Observable<number> {
    const params = new HttpParams().set('myTasks', 'true');
    
    return this.http.get<Task[]>(this.apiUrl, { params }).pipe(
      map(tasks => tasks.length),
      catchError(this.handleError)
    );
  }

  /**
   * Get a single task by ID
   */
  getTaskById(id: string): Observable<Task> {
    return this.http.get<Task>(`${this.apiUrl}/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Create a new task
   */
  createTask(dto: TaskCreateDto): Observable<Task> {
    return this.http.post<Task>(this.apiUrl, dto).pipe(
      tap(newTask => {
        const currentTasks = this.tasksSubject.value;
        this.tasksSubject.next([newTask, ...currentTasks]);
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Update an existing task
   */
  updateTask(id: string, dto: TaskUpdateDto): Observable<Task> {
    return this.http.put<Task>(`${this.apiUrl}/${id}`, dto).pipe(
      tap(updatedTask => {
        const currentTasks = this.tasksSubject.value;
        const index = currentTasks.findIndex(t => t.id === id);
        if (index !== -1) {
          const newTasks = [...currentTasks];
          newTasks[index] = updatedTask;
          this.tasksSubject.next(newTasks);
        }
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Delete a task
   */
  deleteTask(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        const currentTasks = this.tasksSubject.value;
        this.tasksSubject.next(currentTasks.filter(t => t.id !== id));
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Set parent task for reparenting
   */
  setParentTask(taskId: string, parentTaskId: string): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${taskId}/parent`, { parentTaskId }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Remove parent task (make task root-level)
   */
  removeParent(taskId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${taskId}/parent`).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Assign a user to a task
   */
  assignUser(taskId: string, userId: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${taskId}/assignments`, { userId }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Unassign a user from a task
   */
  unassignUser(taskId: string, userId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${taskId}/assignments/${userId}`).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Get task assignees
   */
  getTaskAssignees(taskId: string): Observable<TaskAssignmentDto[]> {
    return this.http.get<TaskAssignmentDto[]>(`${this.apiUrl}/${taskId}/assignments`).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Handle HTTP errors
   */
  private handleError(error: any): Observable<never> {
    console.error('Task service error:', error);
    return throwError(() => error);
  }
}

