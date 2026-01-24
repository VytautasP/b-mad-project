using System.ComponentModel.DataAnnotations;
using TaskFlow.Abstractions.Constants;

namespace TaskFlow.Abstractions.DTOs.Task;

public class TaskUpdateDto
{
    [MaxLength(200, ErrorMessage = "Name cannot exceed 200 characters")]
    public string? Name { get; set; }

    [MaxLength(2000, ErrorMessage = "Description cannot exceed 2000 characters")]
    public string? Description { get; set; }

    public Guid? ParentTaskId { get; set; }
    public DateTime? DueDate { get; set; }
    public Constants.TaskPriority? Priority { get; set; }
    public Constants.TaskStatus? Status { get; set; }
    
    [Range(0, 100, ErrorMessage = "Progress must be between 0 and 100")]
    public int? Progress { get; set; }
    
    public Constants.TaskType? Type { get; set; }
}