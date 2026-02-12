using System.ComponentModel.DataAnnotations.Schema;
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
    public ICollection<ActivityLog> ActivityLogs { get; set; } = new List<ActivityLog>();

    // Computed properties for time rollup
    /// <summary>
    /// Minutes logged directly on this task (from own time entries).
    /// Not mapped to database - calculated from TimeEntries collection or populated from query.
    /// </summary>
    [NotMapped]
    public int DirectLoggedMinutes { get; set; }

    /// <summary>
    /// Minutes logged on all descendant tasks (children and their children recursively).
    /// Not mapped to database - populated from recursive query.
    /// </summary>
    [NotMapped]
    public int ChildrenLoggedMinutes { get; set; }

    /// <summary>
    /// Total minutes logged including direct time and all descendant time.
    /// </summary>
    [NotMapped]
    public int TotalLoggedMinutes => DirectLoggedMinutes + ChildrenLoggedMinutes;
}
