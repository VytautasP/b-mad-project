using TaskFlow.Abstractions.Constants;

namespace TaskFlow.Abstractions.DTOs.Task;

public class TaskResponseDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public Guid? ParentTaskId { get; set; }
    public bool HasChildren { get; set; }
    public Guid CreatedByUserId { get; set; }
    public string CreatedByUserName { get; set; } = string.Empty;
    public DateTime CreatedDate { get; set; }
    public DateTime ModifiedDate { get; set; }
    public DateTime? DueDate { get; set; }
    public Constants.TaskPriority Priority { get; set; }
    public Constants.TaskStatus Status { get; set; }
    public int Progress { get; set; }
    public Constants.TaskType Type { get; set; }
}