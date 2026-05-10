import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'ui-empty-state',
  standalone: true,
  imports: [MatIconModule, MatButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="empty-state-container">
      <mat-icon class="empty-icon">{{ icon() }}</mat-icon>
      <h3 class="empty-heading">{{ heading() }}</h3>
      @if (description()) {
        <p class="empty-description">{{ description() }}</p>
      }
      @if (ctaLabel()) {
        <button mat-raised-button color="primary" (click)="ctaClicked.emit()">
          {{ ctaLabel() }}
        </button>
      }
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
    .empty-state-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 48px 24px;
      text-align: center;
      gap: 8px;
    }
    .empty-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      color: var(--mat-sys-on-surface-variant, rgba(0, 0, 0, 0.38));
      margin-bottom: 8px;
    }
    .empty-heading {
      margin: 0;
      font-size: 18px;
      font-weight: 500;
      color: var(--mat-sys-on-surface, rgba(0, 0, 0, 0.87));
    }
    .empty-description {
      margin: 4px 0 12px;
      font-size: 14px;
      color: var(--mat-sys-on-surface-variant, rgba(0, 0, 0, 0.6));
    }
  `],
})
export class UiEmptyState {
  readonly icon = input('inbox');
  readonly heading = input.required<string>();
  readonly description = input('');
  readonly ctaLabel = input('');
  readonly ctaClicked = output();
}
