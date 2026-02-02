import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

export interface StopTimerDialogData {
  elapsedMinutes: number;
}

export interface StopTimerDialogResult {
  confirmed: boolean;
  note?: string;
}

@Component({
  selector: 'app-stop-timer-dialog',
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule
  ],
  templateUrl: './stop-timer-dialog.component.html',
  styleUrl: './stop-timer-dialog.component.scss'
})
export class StopTimerDialogComponent {
  protected dialogRef = inject(MatDialogRef<StopTimerDialogComponent>);
  protected data = inject<StopTimerDialogData>(MAT_DIALOG_DATA);
  
  protected note = '';

  protected formatElapsedTime(): string {
    const minutes = this.data.elapsedMinutes;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  }

  protected onSave(): void {
    this.dialogRef.close({
      confirmed: true,
      note: this.note
    } as StopTimerDialogResult);
  }

  protected onCancel(): void {
    this.dialogRef.close({
      confirmed: false
    } as StopTimerDialogResult);
  }
}