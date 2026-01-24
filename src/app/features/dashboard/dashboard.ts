import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { AuthService } from '../../core/services/auth.service';
import { TaskFormComponent } from '../tasks/task-form/task-form.component';
import { TaskListComponent } from '../tasks/task-list/task-list.component';

@Component({
  selector: 'app-dashboard',
  imports: [
    CommonModule, 
    MatToolbarModule, 
    MatButtonModule, 
    MatIconModule, 
    MatSnackBarModule,
    MatDialogModule,
    TaskListComponent
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class DashboardComponent {
  private readonly authService = inject(AuthService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  
  currentUser$ = this.authService.currentUser$;

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

  logout(): void {
    this.authService.logout();
  }
}
