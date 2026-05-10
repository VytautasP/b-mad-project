import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface QuickActionOption<T = any> {
  value: T;
  label: string;
  icon?: string;
}

@Component({
  selector: 'ui-quick-action-group',
  standalone: true,
  imports: [
    MatButtonModule,
    MatIconModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="quick-action-group" [attr.role]="mode() === 'radio' ? 'radiogroup' : 'group'">
      @for (option of options(); track option.value) {
        <button
          mat-stroked-button
          type="button"
          class="quick-action-group__btn"
          [class.quick-action-group__btn--active]="activeValue() === option.value"
          [attr.aria-pressed]="mode() === 'action' ? activeValue() === option.value : undefined"
          [attr.aria-checked]="mode() === 'radio' ? activeValue() === option.value : undefined"
          [attr.role]="mode() === 'radio' ? 'radio' : undefined"
          (click)="onOptionClick(option)"
        >
          @if (option.icon) {
            <mat-icon>{{ option.icon }}</mat-icon>
          }
          {{ option.label }}
        </button>
      }
    </div>
  `,
  styles: [`
    .quick-action-group {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }
    .quick-action-group__btn--active {
      background-color: var(--mat-sys-primary-container, rgba(0, 0, 0, 0.08));
      border-color: var(--mat-sys-primary, currentColor);
    }
  `],
})
export class UiQuickActionGroup<T = any> {
  readonly options = input.required<QuickActionOption<T>[]>();
  readonly activeValue = input<T | null>(null);
  readonly mode = input<'action' | 'radio'>('action');

  readonly optionClicked = output<QuickActionOption<T>>();
  readonly selectionChanged = output<T>();

  onOptionClick(option: QuickActionOption<T>): void {
    this.optionClicked.emit(option);
    this.selectionChanged.emit(option.value);
  }
}
