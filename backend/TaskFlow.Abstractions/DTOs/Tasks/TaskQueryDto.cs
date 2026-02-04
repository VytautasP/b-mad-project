using System.ComponentModel.DataAnnotations;
using TaskFlow.Abstractions.Constants;

namespace TaskFlow.Abstractions.DTOs.Tasks;

public class TaskQueryDto
{
    // Filtering properties
    public Guid? AssigneeId { get; set; }
    public Constants.TaskStatus? Status { get; set; }
    public Constants.TaskPriority? Priority { get; set; }
    public Constants.TaskType? Type { get; set; }
    public DateTime? DueDateFrom { get; set; }
    public DateTime? DueDateTo { get; set; }
    
    [MaxLength(200, ErrorMessage = "SearchTerm cannot exceed 200 characters")]
    public string? SearchTerm { get; set; }
    
    // Sorting properties
    [RegularExpression(@"^(name|createdDate|dueDate|priority|status|loggedMinutes)$", 
        ErrorMessage = "SortBy must be one of: name, createdDate, dueDate, priority, status, loggedMinutes")]
    public string? SortBy { get; set; }
    
    [RegularExpression(@"^(asc|desc)$", ErrorMessage = "SortOrder must be either 'asc' or 'desc'")]
    public string SortOrder { get; set; } = "asc";
    
    // Pagination properties
    [Range(1, int.MaxValue, ErrorMessage = "Page must be at least 1")]
    public int Page { get; set; } = 1;
    
    [Range(1, 200, ErrorMessage = "PageSize must be between 1 and 200")]
    public int PageSize { get; set; } = 50;
}
