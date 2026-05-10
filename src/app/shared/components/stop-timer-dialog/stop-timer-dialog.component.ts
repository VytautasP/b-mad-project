import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { UiTextarea } from '../../ui/textarea/ui-textarea';
import { UiButton } from '../../ui/button/ui-button';

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
    FormsModule,
    MatDialogModule,
    UiButton,
    UiTextarea
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