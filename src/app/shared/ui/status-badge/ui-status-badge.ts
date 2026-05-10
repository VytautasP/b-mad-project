import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { getStatusLabel, getStatusIcon, getStatusBadgeClass } from '../utils/display.utils';

@Component({
  selector: 'ui-status-badge',
  standalone: true,
  imports: [MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div [class]="badgeClass()">
      @if (showDot()) {
        <span class="status-dot"></span>
      }
      @if (showIcon()) {
        <mat-icon class="status-icon">{{ icon() }}</mat-icon>
      }
      @if (showLabel()) {
        <span class="status-label">{{ label() }}</span>
      }
    </div>
  `,
  styles: [`
    :host {
      display: inline-block;
    }

    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      border-radius: 999px;
      padding: 4px 10px;
      font-family: 'Manrope', sans-serif;
      font-size: 12px;
      font-weight: 500;
      white-space: nowrap;
    }

    :host(.size-sm) .status-badge {
      padding: 2px 8px;
      font-size: 11px;
      gap: 4px;
    }

    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      flex-shrink: 0;
    }

    :host(.size-sm) .status-dot {
      width: 6px;
      height: 6px;
    }

    .status-icon {
      font-size: 14px;
      width: 14px;
      height: 14px;
    }

    :host(.size-sm) .status-icon {
      font-size: 12px;
      width: 12px;
      height: 12px;
    }

    .status-todo {
      background: #F3F4F6;
      color: #1F2937;
      .status-dot { background: #6B7280; }
    }

    .status-in-progress {
      background: #DBEAFE;
      color: #1E40AF;
      .status-dot { background: #3B82F6; }
    }

    .status-blocked {
      background: #FEE2E2;
      color: #991B1B;
      .status-dot { background: #EF4444; }
    }

    .status-waiting {
      background: #FEF3C7;
      color: #92400E;
      .status-dot { background: #F59E0B; }
    }

    .status-done {
      background: #DCFCE7;
      color: #166534;
      .status-dot { background: #22C55E; }
    }
  `],
  host: {
    '[class.size-sm]': 'size() === "sm"',
  },
})
export class UiStatusBadge {
  readonly status = input.required<number>();
  readonly showIcon = input(false);
  readonly showDot = input(true);
  readonly showLabel = input(true);
  readonly size = input<'sm' | 'md'>('md');

  readonly label = computed(() => getStatusLabel(this.status()));
  readonly icon = computed(() => getStatusIcon(this.status()));
  readonly badgeClass = computed(() => getStatusBadgeClass(this.status()));
}
