import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { getPriorityLabel, getPriorityIcon, getPriorityClass } from '../utils/display.utils';

@Component({
  selector: 'ui-priority-indicator',
  standalone: true,
  imports: [MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="priority-indicator" [class]="priorityClass()">
      @if (showIcon()) {
        <mat-icon>{{ icon() }}</mat-icon>
      }
      @if (showLabel()) {
        <span class="priority-label">{{ label() }}</span>
      }
    </div>
  `,
  styles: [`
    :host {
      display: inline-block;
    }

    .priority-indicator {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-family: 'Manrope', sans-serif;
      font-size: 13px;
      font-weight: 500;

      mat-icon {
        font-size: 16px;
        width: 16px;
        height: 16px;
      }
    }

    :host(.size-sm) .priority-indicator {
      font-size: 11px;
      gap: 3px;

      mat-icon {
        font-size: 14px;
        width: 14px;
        height: 14px;
      }
    }

    .priority-critical,
    .priority-high {
      color: #DC2626;
    }

    .priority-medium {
      color: #D97706;
    }

    .priority-low {
      color: #16A34A;
    }
  `],
  host: {
    '[class.size-sm]': 'size() === "sm"',
  },
})
export class UiPriorityIndicator {
  readonly priority = input.required<number>();
  readonly showLabel = input(true);
  readonly showIcon = input(true);
  readonly size = input<'sm' | 'md'>('md');

  readonly label = computed(() => getPriorityLabel(this.priority()));
  readonly icon = computed(() => getPriorityIcon(this.priority()));
  readonly priorityClass = computed(() => getPriorityClass(this.priority()));
}
