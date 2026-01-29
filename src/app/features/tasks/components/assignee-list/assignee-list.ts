import { Component, Input, Output, EventEmitter, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonModule } from '@angular/material/button';
import { TaskAssignmentDto } from '../../../../shared/models/task.model';

@Component({
  selector: 'app-assignee-list',
  standalone: true,
  imports: [
    CommonModule,
    MatChipsModule,
    MatIconModule,
    MatTooltipModule,
    MatButtonModule
  ],
  templateUrl: './assignee-list.html',
  styleUrl: './assignee-list.css',
})
export class AssigneeList {
  @Input() set assignees(value: TaskAssignmentDto[]) {
    this._assignees.set(value || []);
  }
  @Input() maxVisible: number = 3;
  @Input() showActions: boolean = false;
  
  @Output() removeAssignee = new EventEmitter<string>();
  
  private _assignees = signal<TaskAssignmentDto[]>([]);
  
  // Computed properties
  visibleAssignees = computed(() => {
    const assignees = this._assignees();
    return assignees.slice(0, this.maxVisible);
  });
  
  hiddenCount = computed(() => {
    const total = this._assignees().length;
    return Math.max(0, total - this.maxVisible);
  });
  
  allAssignees = computed(() => this._assignees());
  
  isEmpty = computed(() => this._assignees().length === 0);
  
  onRemoveClick(userId: string): void {
    this.removeAssignee.emit(userId);
  }
  
  getUserInitials(userName: string): string {
    return userName
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }
}

