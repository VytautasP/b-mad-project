import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { AuthService } from '../../core/services/auth.service';
import { TaskFormComponent } from '../tasks/task-form/task-form.component';
import { TaskListComponent } from '../tasks/task-list/task-list.component';
import { TaskTreeComponent } from '../tasks/task-tree/task-tree.component';
import { Task } from '../../shared/models/task.model';

@Component({
  selector: 'app-dashboard',
  imports: [
    CommonModule, 
    MatToolbarModule, 
    MatButtonModule, 
    MatIconModule, 
    MatSnackBarModule,
    MatDialogModule,
    MatNativeDateModule,
    MatButtonToggleModule,
    TaskListComponent,
    TaskTreeComponent
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class DashboardComponent {
  private readonly authService = inject(AuthService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly router = inject(Router);
  
  currentUser$ = this.authService.currentUser$;
  viewMode = signal<'list' | 'tree'>('list');

  openTaskForm(): void {
    const dialogRef = this.dialog.open(TaskFormComponent, {
      width: '600px',
      maxWidth: '90vw'
    });

    dialogRef.componentInstance.taskCreated.subscribe(() => {
      this.snackBar.open('Task created successfully!', 'Close', {
        duration: 3000,
        horizontalPosition: 'center',
        verticalPosition: 'top'
      });
      dialogRef.close();
    });
  }

  onTaskSelected(task: Task): void {
    const dialogRef = this.dialog.open(TaskFormComponent, {
      width: '600px',
      maxWidth: '90vw',
      data: { task }
    });

    dialogRef.componentInstance.taskUpdated.subscribe(() => {
      this.snackBar.open('Task updated successfully!', 'Close', {
        duration: 3000,
        horizontalPosition: 'center',
        verticalPosition: 'top'
      });
      dialogRef.close();
    });
  }

  goToTimeline(): void {
    this.router.navigate(['/timeline']);
  }

  logout(): void {
    this.authService.logout();
  }
}
