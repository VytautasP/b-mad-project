import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, OnInit, SimpleChanges, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivityLogService } from '../services/activity-log.service';
import { ActivityLog } from '../../../shared/models/activity-log.model';
import { ActivityItemComponent } from './components/activity-item/activity-item.component';

@Component({
  selector: 'app-activity-log',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule, ActivityItemComponent],
  templateUrl: './activity-log.component.html',
  styleUrl: './activity-log.component.scss'
})
export class ActivityLogComponent implements OnInit, OnChanges {
  @Input({ required: true }) taskId!: string;
  @Input() refreshToken?: number | string;

  private readonly activityLogService = inject(ActivityLogService);

  activities = signal<ActivityLog[]>([]);
  isLoading = signal(false);
  isLoadingMore = signal(false);
  hasMore = signal(false);

  private page = 1;
  private readonly pageSize = 20;

  ngOnInit(): void {
    if (this.taskId) {
      this.resetAndLoad();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['taskId'] && !changes['taskId'].firstChange && this.taskId) {
      this.resetAndLoad();
      return;
    }

    if (changes['refreshToken'] && !changes['refreshToken'].firstChange && this.taskId) {
      this.resetAndLoad();
    }
  }

  onLoadMore(): void {
    if (this.isLoading() || this.isLoadingMore() || !this.hasMore() || !this.taskId) {
      return;
    }

    this.page += 1;
    this.loadActivity(false);
  }

  private resetAndLoad(): void {
    this.page = 1;
    this.activities.set([]);
    this.hasMore.set(false);
    this.loadActivity(true);
  }

  private loadActivity(reset: boolean): void {
    if (!this.taskId) {
      return;
    }

    if (reset) {
      this.isLoading.set(true);
    } else {
      this.isLoadingMore.set(true);
    }

    this.activityLogService.getTaskActivity(this.taskId, this.page, this.pageSize).subscribe({
      next: (result) => {
        const merged = reset ? result.items : [...this.activities(), ...result.items];
        this.activities.set(this.sortByTimestampDesc(merged));
        this.hasMore.set(result.hasNextPage);
        this.isLoading.set(false);
        this.isLoadingMore.set(false);
      },
      error: (error) => {
        console.error('Failed to load activity log:', error);
        this.isLoading.set(false);
        this.isLoadingMore.set(false);
        this.hasMore.set(false);
      }
    });
  }

  private sortByTimestampDesc(items: ActivityLog[]): ActivityLog[] {
    return [...items].sort((left, right) => {
      return new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime();
    });
  }
}
