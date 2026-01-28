namespace TaskFlow.Abstractions.Entities;

public class TaskAssignment
{
    public Guid TaskId { get; set; }
    public Guid UserId { get; set; }
    public DateTime AssignedDate { get; set; }
    public Guid AssignedByUserId { get; set; }

    // Navigation properties
    public Task Task { get; set; } = null!;
    public User User { get; set; } = null!;
    public User AssignedByUser { get; set; } = null!;
}
