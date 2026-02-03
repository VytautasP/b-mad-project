/**
 * Format duration in minutes to a human-readable string (e.g., "2h 30m", "45m", "0m")
 * @param minutes - Duration in minutes
 * @returns Formatted duration string
 */
export function formatDuration(minutes: number): string {
  if (minutes === 0) return '0m';
  
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

/**
 * Format duration with "total" suffix for parent tasks (e.g., "5h 30m total")
 * @param minutes - Duration in minutes
 * @param isParent - Whether this is a parent task with children
 * @returns Formatted duration string with optional "total" suffix
 */
export function formatDurationWithTotal(minutes: number, isParent: boolean): string {
  const formatted = formatDuration(minutes);
  return isParent ? `${formatted} total` : formatted;
}
