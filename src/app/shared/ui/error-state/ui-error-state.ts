import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'ui-error-state',
  standalone: true,
  imports: [MatIconModule, MatButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="error-state-container" role="alert">
      <mat-icon class="error-icon">error_outline</mat-icon>
      <h3 class="error-heading">{{ heading() }}</h3>
      @if (description()) {
        <p class="error-description">{{ description() }}</p>
      }
      <button mat-stroked-button color="warn" (click)="retryClicked.emit()">
        {{ retryLabel() }}
      </button>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
    .error-state-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 32px 24px;
      text-align: center;
      gap: 8px;
    }
    .error-icon {
      font-size: 40px;
      width: 40px;
      height: 40px;
      color: var(--mat-sys-error, #b00020);
      margin-bottom: 8px;
    }
    .error-heading {
      margin: 0;
      font-size: 16px;
      font-weight: 500;
      color: var(--mat-sys-on-surface, rgba(0, 0, 0, 0.87));
    }
    .error-description {
      margin: 4px 0 12px;
      font-size: 14px;
      color: var(--mat-sys-on-surface-variant, rgba(0, 0, 0, 0.6));
    }
  `],
})
export class UiErrorState {
  readonly heading = input('Something went wrong');
  readonly description = input('');
  readonly retryLabel = input('Retry');
  readonly retryClicked = output();
}
