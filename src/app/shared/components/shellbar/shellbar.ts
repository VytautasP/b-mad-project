import { Component, inject, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { TaskFormComponent } from '../../../features/tasks/task-form/task-form.component';
import { TaskService } from '../../../features/tasks/services/task.service';
import { UiTextInput } from '../../ui/input/ui-text-input';
import { getCreateTaskDialogConfig } from '../../utils/task-form-dialog.utils';

@Component({
  selector: 'app-shellbar',
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    FormsModule,
    UiTextInput,
  ],
  templateUrl: './shellbar.html',
  styleUrl: './shellbar.css'
})
export class ShellbarComponent {
  private readonly authService = inject(AuthService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly taskService = inject(TaskService);

  currentUser$ = this.authService.currentUser$;
  searchValue = signal('');
  profileMenuOpen = signal(false);

  readonly searchOutput = output<string>({ alias: 'search' });

  onSearchModelChange(value: string): void {
    this.searchValue.set(value);
    this.searchOutput.emit(value);
  }

  onCreateTask(): void {
    const dialogRef = this.dialog.open(TaskFormComponent, getCreateTaskDialogConfig());
    dialogRef.componentInstance.mode = 'create';
    dialogRef.afterClosed().subscribe(result => {
      if (!result) {
        return;
      }

      this.taskService.requestTaskRefresh();
      this.snackBar.open('Task created successfully', 'Close', {
        duration: 3000,
        horizontalPosition: 'end',
        verticalPosition: 'top'
      });
    });
  }

  onNotificationsClick(): void {
    // Placeholder for future notification panel
  }

  logout(): void {
    this.authService.logout();
  }

  onProfileMenuOpened(): void {
    this.profileMenuOpen.set(true);
  }

  onProfileMenuClosed(): void {
    this.profileMenuOpen.set(false);
  }
}
