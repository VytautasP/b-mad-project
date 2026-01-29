using TaskFlow.Abstractions.Constants;

namespace TaskFlow.Abstractions.Entities;

public class Task
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public Guid? ParentTaskId { get; set; }
    public Guid CreatedByUserId { get; set; }
    public DateTime CreatedDate { get; set; }
    public DateTime ModifiedDate { get; set; }
    public DateTime? DueDate { get; set; }
    public Constants.TaskPriority Priority { get; set; }
    public Constants.TaskStatus Status { get; set; }
    public int Progress { get; set; }
    public Constants.TaskType Type { get; set; }
    public bool IsDeleted { get; set; }

    // Navigation properties
    public User CreatedByUser { get; set; } = null!;
    public Task? ParentTask { get; set; }
    public ICollection<Task> Children { get; set; } = new List<Task>();
    public ICollection<TaskAssignment> TaskAssignments { get; set; } = new List<TaskAssignment>();
    public ICollection<TimeEntry> TimeEntries { get; set; } = new List<TimeEntry>();

    // Computed properties
    /// <summary>
    /// Total minutes logged across all time entries for this task.
    /// </summary>
    public int TotalLoggedMinutes => TimeEntries?.Sum(te => te.Minutes) ?? 0;
}
