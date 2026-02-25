import { Injectable, inject } from '@angular/core';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private readonly snackBar = inject(MatSnackBar);

  private readonly defaultConfig: MatSnackBarConfig = {
    horizontalPosition: 'end',
    verticalPosition: 'bottom'
  };

  showSuccess(message: string, duration: number = 3000): void {
    this.snackBar.open(message, 'Close', {
      ...this.defaultConfig,
      duration,
      panelClass: ['success-snackbar']
    });
  }

  showError(message: string, duration: number = 5000): void {
    this.snackBar.open(message, 'Close', {
      ...this.defaultConfig,
      duration,
      panelClass: ['error-snackbar']
    });
  }

  showInfo(message: string, duration: number = 3000): void {
    this.snackBar.open(message, 'Close', {
      ...this.defaultConfig,
      duration,
      panelClass: ['info-snackbar']
    });
  }
}
