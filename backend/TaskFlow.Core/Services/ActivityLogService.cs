using Microsoft.Extensions.Logging;
using TaskFlow.Abstractions.Constants;
using TaskFlow.Abstractions.DTOs.ActivityLogs;
using TaskFlow.Abstractions.DTOs.Shared;
using TaskFlow.Abstractions.Entities;
using TaskFlow.Abstractions.Exceptions;
using TaskFlow.Abstractions.Interfaces;
using TaskFlow.Abstractions.Interfaces.Services;

namespace TaskFlow.Core.Services;

public class ActivityLogService : IActivityLogService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<ActivityLogService> _logger;

    public ActivityLogService(IUnitOfWork unitOfWork, ILogger<ActivityLogService> logger)
    {
        _unitOfWork = unitOfWork;
        _logger = logger;
    }

    public async System.Threading.Tasks.Task LogActivityAsync(
        Guid taskId,
        Guid userId,
        ActivityType activityType,
        string description,
        string? changedField = null,
        string? oldValue = null,
        string? newValue = null,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(description))
        {
            throw new ValidationException("Activity description is required.");
        }

        var activityLog = new ActivityLog
        {
            Id = Guid.NewGuid(),
            TaskId = taskId,
            UserId = userId,
            ActivityType = activityType,
            Description = description,
            ChangedField = changedField,
            OldValue = oldValue,
            NewValue = newValue,
            Timestamp = DateTime.UtcNow
        };

        await _unitOfWork.ActivityLogs.CreateAsync(activityLog, cancellationToken);

        _logger.LogDebug(
            "Queued activity log {ActivityType} for task {TaskId} by user {UserId}",
            activityType,
            taskId,
            userId);
    }

    public async System.Threading.Tasks.Task<PaginatedResultDto<ActivityLogResponseDto>> GetTaskActivityAsync(
        Guid taskId,
        Guid requestingUserId,
        ActivityLogQueryDto queryDto,
        CancellationToken cancellationToken = default)
    {
        var task = await _unitOfWork.Tasks.GetByIdAsync(taskId, cancellationToken);
        if (task == null)
        {
            throw new NotFoundException($"Task with ID {taskId} not found.");
        }

        var ownsTask = await _unitOfWork.Tasks.UserOwnsTaskAsync(taskId, requestingUserId, cancellationToken);
        if (!ownsTask)
        {
            throw new UnauthorizedException("You do not have permission to access this task activity.");
        }

        var (items, totalCount) = await _unitOfWork.ActivityLogs.GetByTaskIdPagedAsync(
            taskId,
            queryDto.Page,
            queryDto.PageSize,
            cancellationToken);

        var totalPages = (int)Math.Ceiling(totalCount / (double)queryDto.PageSize);

        return new PaginatedResultDto<ActivityLogResponseDto>
        {
            Items = items.Select(MapToResponseDto).ToList(),
            TotalCount = totalCount,
            Page = queryDto.Page,
            PageSize = queryDto.PageSize,
            TotalPages = totalPages
        };
    }

    private static ActivityLogResponseDto MapToResponseDto(ActivityLog activityLog)
    {
        return new ActivityLogResponseDto
        {
            Id = activityLog.Id,
            TaskId = activityLog.TaskId,
            UserId = activityLog.UserId,
            UserName = activityLog.User?.Name ?? string.Empty,
            ActivityType = activityLog.ActivityType,
            Description = activityLog.Description,
            ChangedField = activityLog.ChangedField,
            OldValue = activityLog.OldValue,
            NewValue = activityLog.NewValue,
            Timestamp = activityLog.Timestamp
        };
    }
}
