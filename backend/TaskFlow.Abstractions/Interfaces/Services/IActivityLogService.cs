using TaskFlow.Abstractions.Constants;
using TaskFlow.Abstractions.DTOs.ActivityLogs;
using TaskFlow.Abstractions.DTOs.Shared;

namespace TaskFlow.Abstractions.Interfaces.Services;

public interface IActivityLogService
{
    System.Threading.Tasks.Task LogActivityAsync(
        Guid taskId,
        Guid userId,
        ActivityType activityType,
        string description,
        string? changedField = null,
        string? oldValue = null,
        string? newValue = null,
        CancellationToken cancellationToken = default);

    System.Threading.Tasks.Task<PaginatedResultDto<ActivityLogResponseDto>> GetTaskActivityAsync(
        Guid taskId,
        Guid requestingUserId,
        ActivityLogQueryDto queryDto,
        CancellationToken cancellationToken = default);
}
