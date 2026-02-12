import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { ActivityLog, ActivityType } from '../../../../../shared/models/activity-log.model';
import { RelativeTimePipe } from '../../../../../shared/pipes/relative-time.pipe';

@Component({
  selector: 'app-activity-item',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, RelativeTimePipe],
  templateUrl: './activity-item.component.html',
  styleUrl: './activity-item.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ActivityItemComponent {
  @Input({ required: true }) activity!: ActivityLog;

  protected isExpanded = false;

  getActivityIcon(type: ActivityType): string {
    switch (type) {
      case ActivityType.Created:
        return 'add_circle';
      case ActivityType.Updated:
        return 'edit';
      case ActivityType.Deleted:
        return 'delete';
      case ActivityType.StatusChanged:
        return 'sync_alt';
      case ActivityType.Assigned:
        return 'person_add';
      case ActivityType.Unassigned:
        return 'person_remove';
      case ActivityType.TimeLogged:
        return 'schedule';
      case ActivityType.Commented:
        return 'chat';
      default:
        return 'history';
    }
  }

  getActivityClass(type: ActivityType): string {
    switch (type) {
      case ActivityType.Created:
        return 'type-created';
      case ActivityType.Updated:
        return 'type-updated';
      case ActivityType.Deleted:
        return 'type-deleted';
      case ActivityType.StatusChanged:
        return 'type-status-changed';
      case ActivityType.Assigned:
      case ActivityType.Unassigned:
        return 'type-assignment';
      case ActivityType.TimeLogged:
        return 'type-time-logged';
      case ActivityType.Commented:
        return 'type-commented';
      default:
        return 'type-default';
    }
  }

  get actorInitials(): string {
    if (!this.activity?.userName) {
      return '?';
    }

    const parts = this.activity.userName
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2);

    return parts.map((part) => part.charAt(0).toUpperCase()).join('') || '?';
  }

  get hasFieldChangeDetails(): boolean {
    return !!(this.activity.changedField || this.activity.oldValue || this.activity.newValue);
  }

  get formattedTimestamp(): string {
    return new Date(this.activity.timestamp).toLocaleString();
  }

  toggleDetails(): void {
    this.isExpanded = !this.isExpanded;
  }
}
