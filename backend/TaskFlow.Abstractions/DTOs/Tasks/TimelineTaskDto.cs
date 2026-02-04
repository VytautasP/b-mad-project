using TaskFlow.Abstractions.Constants;

namespace TaskFlow.Abstractions.DTOs.Tasks;

/// <summary>
/// Optimized DTO for timeline/Gantt view rendering.
/// Contains minimal fields to reduce payload size.
/// </summary>
public class TimelineTaskDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public int Duration { get; set; } // in days
    public Constants.TaskStatus Status { get; set; }
    public Constants.TaskPriority Priority { get; set; }
    public Constants.TaskType Type { get; set; }
    public int Progress { get; set; }
    public Guid? ParentTaskId { get; set; }
    public List<TaskAssigneeDto> Assignees { get; set; } = new List<TaskAssigneeDto>();

    /// <summary>
    /// Lightweight assignee DTO for timeline view (minimal fields for avatars/names).
    /// </summary>
    public class TaskAssigneeDto
    {
        public Guid UserId { get; set; }
        public string UserName { get; set; } = string.Empty;
    }
}
