namespace TaskFlow.Abstractions.DTOs.Task;

/// <summary>
/// Represents time rollup data for a task including direct and descendant time entries.
/// </summary>
public class TaskTimeRollup
{
    public Guid TaskId { get; set; }
    public int DirectLoggedMinutes { get; set; }
    public int ChildrenLoggedMinutes { get; set; }
    public int TotalLoggedMinutes => DirectLoggedMinutes + ChildrenLoggedMinutes;
}
