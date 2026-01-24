using System.ComponentModel.DataAnnotations;
using TaskFlow.Abstractions.Constants;

namespace TaskFlow.Abstractions.DTOs.Task;

public class TaskCreateDto
{
    [Required(ErrorMessage = "Name is required")]
    [MaxLength(200, ErrorMessage = "Name cannot exceed 200 characters")]
    public string Name { get; set; } = string.Empty;

    [MaxLength(2000, ErrorMessage = "Description cannot exceed 2000 characters")]
    public string? Description { get; set; }

    public Guid? ParentTaskId { get; set; }
    public DateTime? DueDate { get; set; }
    public Constants.TaskPriority Priority { get; set; } = Constants.TaskPriority.Medium;
    public Constants.TaskStatus Status { get; set; } = Constants.TaskStatus.ToDo;
    public Constants.TaskType Type { get; set; } = Constants.TaskType.Task;
}