import { Component, inject, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialog } from '@angular/material/dialog';
import { AuthService } from '../../../core/services/auth.service';
import { TaskFormComponent } from '../../../features/tasks/task-form/task-form.component';
import { getDialogAnimationDurations } from '../../utils/motion.utils';

@Component({
  selector: 'app-shellbar',
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule
  ],
  templateUrl: './shellbar.html',
  styleUrl: './shellbar.css'
})
export class ShellbarComponent {
  private readonly authService = inject(AuthService);
  private readonly dialog = inject(MatDialog);

  currentUser$ = this.authService.currentUser$;
  searchValue = signal('');
  profileMenuOpen = signal(false);

  readonly searchOutput = output<string>({ alias: 'search' });

  onSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchValue.set(value);
    this.searchOutput.emit(value);
  }

  onCreateTask(): void {
    const dialogRef = this.dialog.open(TaskFormComponent, {
      width: '600px',
      ...getDialogAnimationDurations(),
      data: { mode: 'create' }
    });
    dialogRef.componentInstance.mode = 'create';
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
