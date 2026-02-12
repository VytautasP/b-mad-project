using TaskFlow.Abstractions.Constants;

namespace TaskFlow.Abstractions.DTOs.ActivityLogs;

public class ActivityLogResponseDto
{
    public Guid Id { get; set; }
    public Guid TaskId { get; set; }
    public Guid UserId { get; set; }
    public string UserName { get; set; } = string.Empty;
    public ActivityType ActivityType { get; set; }
    public string Description { get; set; } = string.Empty;
    public string? ChangedField { get; set; }
    public string? OldValue { get; set; }
    public string? NewValue { get; set; }
    public DateTime Timestamp { get; set; }
}
