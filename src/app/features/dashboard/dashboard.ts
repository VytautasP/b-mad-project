import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { take } from 'rxjs/operators';
import { AuthService } from '../../core/services/auth.service';
import { TaskFormComponent } from '../tasks/task-form/task-form.component';
import { TaskDetailDialog } from '../tasks/task-detail-dialog/task-detail-dialog';
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
export class DashboardComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  
  currentUser$ = this.authService.currentUser$;
  viewMode = signal<'list' | 'tree'>('list');

  ngOnInit(): void {
    this.route.queryParamMap.pipe(take(1)).subscribe(params => {
      const shouldOpenTaskForm = params.get('openTaskForm') === 'true';
      if (!shouldOpenTaskForm) {
        return;
      }

      const focusField = params.get('focusField') === 'dueDate' ? 'dueDate' : null;
      const returnToTimeline = params.get('returnTo') === 'timeline';

      this.openTaskForm({
        focusField,
        returnToTimeline
      });
    });
  }

  openTaskForm(options?: { focusField: 'dueDate' | null; returnToTimeline: boolean }): void {
    const dialogRef = this.dialog.open(TaskFormComponent, {
      width: '600px',
      maxWidth: '90vw',
      data: { mode: 'create' }
    });

    dialogRef.componentInstance.mode = 'create';
    if (options?.focusField) {
      dialogRef.componentInstance.initialFocusField = options.focusField;
    }

    dialogRef.componentInstance.taskCreated.subscribe(() => {
      dialogRef.close({ created: true });
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.snackBar.open('Task created successfully!', 'Close', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'top'
        });

        if (options?.returnToTimeline) {
          this.router.navigate(['/timeline']);
        }
      }
    });
  }

  onTaskSelected(task: Task): void {
    this.dialog.open(TaskDetailDialog, {
      width: '700px',
      maxWidth: '90vw',
      disableClose: true,
      autoFocus: false,
      data: { task }
    });
  }

  goToTimeline(): void {
    this.router.navigate(['/timeline']);
  }

  logout(): void {
    this.authService.logout();
  }
}
