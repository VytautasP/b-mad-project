namespace TaskFlow.Abstractions.DTOs.Task;

public class TaskAssignmentDto
{
    public Guid UserId { get; set; }
    public string UserName { get; set; } = string.Empty;
    public string UserEmail { get; set; } = string.Empty;
    public DateTime AssignedDate { get; set; }
    public Guid AssignedByUserId { get; set; }
    public string AssignedByUserName { get; set; } = string.Empty;
}
