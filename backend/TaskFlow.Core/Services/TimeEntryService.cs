using Microsoft.Extensions.Logging;
using TaskFlow.Abstractions.Constants;
using TaskFlow.Abstractions.DTOs.TimeEntries;
using TaskFlow.Abstractions.Entities;
using TaskFlow.Abstractions.Exceptions;
using TaskFlow.Abstractions.Interfaces;
using TaskFlow.Abstractions.Interfaces.Services;

namespace TaskFlow.Core.Services;

/// <summary>
/// Service implementation for time entry operations.
/// </summary>
public class TimeEntryService : ITimeEntryService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IActivityLogService _activityLogService;
    private readonly ILogger<TimeEntryService> _logger;

    public TimeEntryService(IUnitOfWork unitOfWork, IActivityLogService activityLogService, ILogger<TimeEntryService> logger)
    {
        _unitOfWork = unitOfWork;
        _activityLogService = activityLogService;
        _logger = logger;
    }

    public async System.Threading.Tasks.Task<TimeEntryResponseDto> LogTimeAsync(Guid taskId, Guid userId, TimeEntryCreateDto dto, CancellationToken cancellationToken)
    {
        // Validate task exists
        var task = await _unitOfWork.Tasks.GetByIdAsync(taskId, cancellationToken);
        if (task == null)
        {
            throw new NotFoundException($"Task with ID {taskId} not found.");
        }

        // Validate minutes
        if (dto.Minutes <= 0 || dto.Minutes > 1440)
        {
            throw new ValidationException("Minutes must be between 1 and 1440 (24 hours).");
        }

        // Create TimeEntry entity
        var timeEntry = new TimeEntry
        {
            Id = Guid.NewGuid(),
            TaskId = taskId,
            UserId = userId,
            Minutes = dto.Minutes,
            Note = dto.Note,
            EntryDate = dto.EntryDate ?? DateTime.UtcNow,
            EntryType = dto.EntryType,
            CreatedAt = DateTime.UtcNow
        };

        await _unitOfWork.TimeEntries.CreateAsync(timeEntry, cancellationToken);

        var user = await _unitOfWork.Users.GetByIdAsync(userId, cancellationToken);
        var actorName = user?.Name ?? "User";
        await _activityLogService.LogActivityAsync(
            taskId,
            userId,
            ActivityType.TimeLogged,
            $"{actorName} logged {FormatDuration(dto.Minutes)}",
            "Minutes",
            null,
            dto.Minutes.ToString(),
            cancellationToken);

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        // Fetch the created entry with user information
        var createdEntry = await _unitOfWork.TimeEntries.GetByIdAsync(timeEntry.Id, cancellationToken);

        _logger.LogInformation("User {UserId} logged {Minutes} minutes for task {TaskId}", userId, dto.Minutes, taskId);

        return MapToResponseDto(createdEntry!);
    }

    public async System.Threading.Tasks.Task<List<TimeEntryResponseDto>> GetTaskTimeEntriesAsync(Guid taskId, Guid requestingUserId, CancellationToken cancellationToken)
    {
        // Validate task exists and user has access
        var task = await _unitOfWork.Tasks.GetByIdAsync(taskId, cancellationToken);
        if (task == null)
        {
            throw new NotFoundException($"Task with ID {taskId} not found.");
        }

        // Get time entries for the task
        var timeEntries = await _unitOfWork.TimeEntries.GetByTaskIdAsync(taskId, cancellationToken);

        return timeEntries.Select(MapToResponseDto).ToList();
    }

    public async System.Threading.Tasks.Task DeleteTimeEntryAsync(Guid entryId, Guid requestingUserId, CancellationToken cancellationToken)
    {
        // Fetch time entry
        var timeEntry = await _unitOfWork.TimeEntries.GetByIdAsync(entryId, cancellationToken);
        if (timeEntry == null)
        {
            throw new NotFoundException($"Time entry with ID {entryId} not found.");
        }

        // Validate user is the creator
        if (timeEntry.UserId != requestingUserId)
        {
            throw new UnauthorizedException("You can only delete your own time entries.");
        }

        await _unitOfWork.TimeEntries.DeleteAsync(timeEntry, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("User {UserId} deleted time entry {EntryId}", requestingUserId, entryId);
    }

    private TimeEntryResponseDto MapToResponseDto(TimeEntry timeEntry)
    {
        return new TimeEntryResponseDto
        {
            Id = timeEntry.Id,
            TaskId = timeEntry.TaskId,
            UserId = timeEntry.UserId,
            UserName = timeEntry.User?.Name ?? string.Empty,
            Minutes = timeEntry.Minutes,
            EntryDate = timeEntry.EntryDate,
            Note = timeEntry.Note,
            EntryType = timeEntry.EntryType.ToString(),
            CreatedAt = timeEntry.CreatedAt
        };
    }

    private static string FormatDuration(int minutes)
    {
        var hours = minutes / 60;
        var remainingMinutes = minutes % 60;

        if (hours == 0)
        {
            return $"{remainingMinutes} minute{(remainingMinutes == 1 ? string.Empty : "s")}";
        }

        if (remainingMinutes == 0)
        {
            return $"{hours} hour{(hours == 1 ? string.Empty : "s")}";
        }

        return $"{hours} hour{(hours == 1 ? string.Empty : "s")} {remainingMinutes} minute{(remainingMinutes == 1 ? string.Empty : "s")}";
    }
}
