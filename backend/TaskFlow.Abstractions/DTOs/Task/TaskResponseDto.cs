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
    public List<TaskAssignmentDto> Assignees { get; set; } = new List<TaskAssignmentDto>();
    
    // Time tracking fields with rollup support
    public int DirectLoggedMinutes { get; set; }
    public int ChildrenLoggedMinutes { get; set; }
    public int TotalLoggedMinutes { get; set; }
    
    // Helper properties for formatted display
    public string DirectLoggedTimeFormatted => FormatDuration(DirectLoggedMinutes);
    public string ChildrenLoggedTimeFormatted => FormatDuration(ChildrenLoggedMinutes);
    public string TotalLoggedTimeFormatted => FormatDuration(TotalLoggedMinutes);

    private static string FormatDuration(int minutes)
    {
        if (minutes == 0) return "0m";
        var hours = minutes / 60;
        var mins = minutes % 60;
        if (hours == 0) return $"{mins}m";
        if (mins == 0) return $"{hours}h";
        return $"{hours}h {mins}m";
    }
}