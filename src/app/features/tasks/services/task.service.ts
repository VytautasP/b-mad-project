import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { Task, TaskCreateDto, TaskUpdateDto } from '../../../shared/models/task.model';

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
   * Fetch all tasks for the current user
   */
  getTasks(): Observable<Task[]> {
    return this.http.get<Task[]>(this.apiUrl).pipe(
      tap(tasks => this.tasksSubject.next(tasks)),
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
   * Handle HTTP errors
   */
  private handleError(error: any): Observable<never> {
    console.error('Task service error:', error);
    return throwError(() => error);
  }
}
