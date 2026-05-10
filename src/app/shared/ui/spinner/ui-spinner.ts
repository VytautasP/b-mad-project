import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'ui-spinner',
  standalone: true,
  imports: [MatProgressSpinnerModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="spinner-container" [class.inline]="inline()">
      <mat-spinner [diameter]="diameter()"></mat-spinner>
      @if (message()) {
        <span class="spinner-message">{{ message() }}</span>
      }
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
    .spinner-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
    }
    .spinner-container.inline {
      flex-direction: row;
      display: inline-flex;
      gap: 8px;
    }
    .spinner-message {
      color: var(--mat-sys-on-surface-variant, rgba(0, 0, 0, 0.6));
      font-size: 14px;
    }
  `],
})
export class UiSpinner {
  readonly diameter = input(40);
  readonly message = input('');
  readonly inline = input(false);
}
