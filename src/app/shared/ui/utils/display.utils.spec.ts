import { TaskStatus, TaskPriority } from '../../models/task.model';
import {
  getStatusLabel,
  getStatusIcon,
  getStatusBadgeClass,
  getPriorityLabel,
  getPriorityIcon,
  getPriorityClass,
  formatDate,
} from './display.utils';

describe('display.utils', () => {
  describe('getStatusLabel', () => {
    it('should return correct labels for all statuses', () => {
      expect(getStatusLabel(TaskStatus.ToDo)).toBe('To Do');
      expect(getStatusLabel(TaskStatus.InProgress)).toBe('In Progress');
      expect(getStatusLabel(TaskStatus.Blocked)).toBe('Blocked');
      expect(getStatusLabel(TaskStatus.Waiting)).toBe('Waiting');
      expect(getStatusLabel(TaskStatus.Done)).toBe('Done');
    });

    it('should default to "To Do" for unknown status', () => {
      expect(getStatusLabel(99)).toBe('To Do');
    });
  });

  describe('getStatusIcon', () => {
    it('should return correct icons for all statuses', () => {
      expect(getStatusIcon(TaskStatus.ToDo)).toBe('radio_button_unchecked');
      expect(getStatusIcon(TaskStatus.InProgress)).toBe('pending');
      expect(getStatusIcon(TaskStatus.Blocked)).toBe('block');
      expect(getStatusIcon(TaskStatus.Waiting)).toBe('hourglass_top');
      expect(getStatusIcon(TaskStatus.Done)).toBe('check_circle');
    });

    it('should default to "radio_button_unchecked" for unknown status', () => {
      expect(getStatusIcon(99)).toBe('radio_button_unchecked');
    });
  });

  describe('getStatusBadgeClass', () => {
    it('should return correct badge classes for all statuses', () => {
      expect(getStatusBadgeClass(TaskStatus.ToDo)).toBe('status-badge status-todo');
      expect(getStatusBadgeClass(TaskStatus.InProgress)).toBe('status-badge status-in-progress');
      expect(getStatusBadgeClass(TaskStatus.Blocked)).toBe('status-badge status-blocked');
      expect(getStatusBadgeClass(TaskStatus.Waiting)).toBe('status-badge status-waiting');
      expect(getStatusBadgeClass(TaskStatus.Done)).toBe('status-badge status-done');
    });

    it('should default to "status-badge status-todo" for unknown status', () => {
      expect(getStatusBadgeClass(99)).toBe('status-badge status-todo');
    });
  });

  describe('getPriorityLabel', () => {
    it('should return correct labels for all priorities', () => {
      expect(getPriorityLabel(TaskPriority.Low)).toBe('Low');
      expect(getPriorityLabel(TaskPriority.Medium)).toBe('Medium');
      expect(getPriorityLabel(TaskPriority.High)).toBe('High');
      expect(getPriorityLabel(TaskPriority.Critical)).toBe('Critical');
    });

    it('should default to "Low" for unknown priority', () => {
      expect(getPriorityLabel(99)).toBe('Low');
    });
  });

  describe('getPriorityIcon', () => {
    it('should return correct icons for all priorities', () => {
      expect(getPriorityIcon(TaskPriority.Low)).toBe('arrow_downward');
      expect(getPriorityIcon(TaskPriority.Medium)).toBe('arrow_forward');
      expect(getPriorityIcon(TaskPriority.High)).toBe('arrow_upward');
      expect(getPriorityIcon(TaskPriority.Critical)).toBe('keyboard_double_arrow_up');
    });

    it('should default to "arrow_downward" for unknown priority', () => {
      expect(getPriorityIcon(99)).toBe('arrow_downward');
    });
  });

  describe('getPriorityClass', () => {
    it('should return correct classes for all priorities', () => {
      expect(getPriorityClass(TaskPriority.Low)).toBe('priority-low');
      expect(getPriorityClass(TaskPriority.Medium)).toBe('priority-medium');
      expect(getPriorityClass(TaskPriority.High)).toBe('priority-high');
      expect(getPriorityClass(TaskPriority.Critical)).toBe('priority-critical');
    });

    it('should default to "priority-low" for unknown priority', () => {
      expect(getPriorityClass(99)).toBe('priority-low');
    });
  });

  describe('formatDate', () => {
    it('should format a valid date correctly', () => {
      const date = new Date(2025, 0, 15);
      expect(formatDate(date)).toBe('Jan 15, 2025');
    });

    it('should pad single-digit days', () => {
      const date = new Date(2025, 5, 3);
      expect(formatDate(date)).toBe('Jun 03, 2025');
    });

    it('should return "-" for null', () => {
      expect(formatDate(null)).toBe('-');
    });

    it('should handle date strings coerced to Date', () => {
      const dateStr = '2025-12-25T00:00:00' as unknown as Date;
      expect(formatDate(dateStr)).toBe('Dec 25, 2025');
    });
  });
});
