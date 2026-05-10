import { TaskStatus, TaskPriority } from '../../models/task.model';

export function getStatusLabel(status: number): string {
  switch (status) {
    case TaskStatus.ToDo:
      return 'To Do';
    case TaskStatus.InProgress:
      return 'In Progress';
    case TaskStatus.Blocked:
      return 'Blocked';
    case TaskStatus.Waiting:
      return 'Waiting';
    case TaskStatus.Done:
      return 'Done';
    default:
      return 'To Do';
  }
}

export function getStatusIcon(status: number): string {
  switch (status) {
    case TaskStatus.Done:
      return 'check_circle';
    case TaskStatus.Blocked:
      return 'block';
    case TaskStatus.Waiting:
      return 'hourglass_top';
    case TaskStatus.InProgress:
      return 'pending';
    case TaskStatus.ToDo:
    default:
      return 'radio_button_unchecked';
  }
}

export function getStatusBadgeClass(status: number): string {
  switch (status) {
    case TaskStatus.Done:
      return 'status-badge status-done';
    case TaskStatus.InProgress:
      return 'status-badge status-in-progress';
    case TaskStatus.Blocked:
      return 'status-badge status-blocked';
    case TaskStatus.Waiting:
      return 'status-badge status-waiting';
    case TaskStatus.ToDo:
    default:
      return 'status-badge status-todo';
  }
}

export function getPriorityLabel(priority: number): string {
  switch (priority) {
    case TaskPriority.Critical:
      return 'Critical';
    case TaskPriority.High:
      return 'High';
    case TaskPriority.Medium:
      return 'Medium';
    case TaskPriority.Low:
    default:
      return 'Low';
  }
}

export function getPriorityIcon(priority: number): string {
  switch (priority) {
    case TaskPriority.Critical:
      return 'keyboard_double_arrow_up';
    case TaskPriority.High:
      return 'arrow_upward';
    case TaskPriority.Medium:
      return 'arrow_forward';
    case TaskPriority.Low:
    default:
      return 'arrow_downward';
  }
}

export function getPriorityClass(priority: number): string {
  switch (priority) {
    case TaskPriority.Critical:
      return 'priority-critical';
    case TaskPriority.High:
      return 'priority-high';
    case TaskPriority.Medium:
      return 'priority-medium';
    case TaskPriority.Low:
    default:
      return 'priority-low';
  }
}

export function formatDate(date: Date | null): string {
  if (!date) return '-';
  const d = new Date(date);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[d.getMonth()]} ${String(d.getDate()).padStart(2, '0')}, ${d.getFullYear()}`;
}
