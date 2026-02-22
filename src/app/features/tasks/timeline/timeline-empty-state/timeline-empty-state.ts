import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-timeline-empty-state',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule],
  templateUrl: './timeline-empty-state.html',
  styleUrl: './timeline-empty-state.css'
})
export class TimelineEmptyStateComponent {
  @Input() noDueDateCount = 0;
  @Input() invalidDueDateCount = 0;
  @Output() ctaClick = new EventEmitter<void>();

  onCtaClick(): void {
    this.ctaClick.emit();
  }
}
