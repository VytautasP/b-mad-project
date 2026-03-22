using System.Text;
using Microsoft.Extensions.Logging;
using TaskFlow.Abstractions.Constants;
using TaskFlow.Abstractions.DTOs.Shared;
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
            EntryDate = dto.EntryDate.HasValue ? EnsureUtc(dto.EntryDate.Value) : DateTime.UtcNow,
            EntryType = dto.EntryType,
            IsBillable = dto.IsBillable,
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

    public async System.Threading.Tasks.Task<PaginatedResultDto<TimeEntryResponseDto>> GetPaginatedTimeEntriesAsync(TimeEntryFilterDto filter, Guid currentUserId, CancellationToken cancellationToken)
    {
        // Default to current user if no userId specified
        if (!filter.UserId.HasValue)
            filter.UserId = currentUserId;

        // Authorization: users can only view their own entries
        if (filter.UserId.Value != currentUserId)
            throw new UnauthorizedException("You can only view your own time entries.");

        var result = await _unitOfWork.TimeEntries.GetPaginatedAsync(filter, cancellationToken);

        return new PaginatedResultDto<TimeEntryResponseDto>
        {
            Items = result.Items.Select(MapToResponseDto).ToList(),
            TotalCount = result.TotalCount,
            Page = result.Page,
            PageSize = result.PageSize,
            TotalPages = result.TotalPages
        };
    }

    public async System.Threading.Tasks.Task<TimeEntryResponseDto> GetTimeEntryByIdAsync(Guid entryId, Guid requestingUserId, CancellationToken cancellationToken)
    {
        var timeEntry = await _unitOfWork.TimeEntries.GetByIdAsync(entryId, cancellationToken);
        if (timeEntry == null)
            throw new NotFoundException($"Time entry with ID {entryId} not found.");

        if (timeEntry.UserId != requestingUserId)
            throw new UnauthorizedException("You can only view your own time entries.");

        return MapToResponseDto(timeEntry);
    }

    public async System.Threading.Tasks.Task<TimeEntryResponseDto> UpdateTimeEntryAsync(Guid entryId, Guid requestingUserId, TimeEntryCreateDto dto, CancellationToken cancellationToken)
    {
        var timeEntry = await _unitOfWork.TimeEntries.GetByIdAsync(entryId, cancellationToken);
        if (timeEntry == null)
            throw new NotFoundException($"Time entry with ID {entryId} not found.");

        if (timeEntry.UserId != requestingUserId)
            throw new UnauthorizedException("You can only update your own time entries.");

        if (dto.Minutes <= 0 || dto.Minutes > 1440)
            throw new ValidationException("Minutes must be between 1 and 1440 (24 hours).");

        timeEntry.Minutes = dto.Minutes;
        timeEntry.Note = dto.Note;
        timeEntry.EntryType = dto.EntryType;
        timeEntry.IsBillable = dto.IsBillable;
        if (dto.EntryDate.HasValue)
            timeEntry.EntryDate = EnsureUtc(dto.EntryDate.Value);

        await _unitOfWork.TimeEntries.UpdateAsync(timeEntry, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        // Re-fetch with includes
        var updated = await _unitOfWork.TimeEntries.GetByIdAsync(entryId, cancellationToken);
        _logger.LogInformation("User {UserId} updated time entry {EntryId}", requestingUserId, entryId);

        return MapToResponseDto(updated!);
    }

    public async System.Threading.Tasks.Task<TimeEntrySummaryDto> GetSummaryAsync(Guid userId, DateTime? startDate, DateTime? endDate, CancellationToken cancellationToken)
    {
        return await _unitOfWork.TimeEntries.GetSummaryAsync(userId, startDate, endDate, cancellationToken);
    }

    public async System.Threading.Tasks.Task<string> ExportTimeEntriesAsync(TimeEntryFilterDto filter, Guid currentUserId, CancellationToken cancellationToken)
    {
        if (!filter.UserId.HasValue)
            filter.UserId = currentUserId;

        if (filter.UserId.Value != currentUserId)
            throw new UnauthorizedException("You can only export your own time entries.");

        var entries = await _unitOfWork.TimeEntries.GetForExportAsync(filter, cancellationToken);

        var sb = new StringBuilder();
        sb.AppendLine("Date,Task,Project,Description,Duration,Billable");

        foreach (var entry in entries)
        {
            var taskName = EscapeCsvField(entry.Task?.Name ?? string.Empty);
            var projectName = EscapeCsvField(ResolveProjectName(entry.Task));
            var description = EscapeCsvField(entry.Note ?? string.Empty);
            var duration = FormatDurationCompact(entry.Minutes);
            var billable = entry.IsBillable ? "Yes" : "No";

            sb.AppendLine($"{entry.EntryDate:yyyy-MM-dd},{taskName},{projectName},{description},{duration},{billable}");
        }

        return sb.ToString();
    }

    private static DateTime EnsureUtc(DateTime dt) =>
        dt.Kind == DateTimeKind.Utc ? dt : DateTime.SpecifyKind(dt, DateTimeKind.Utc);

    private static string EscapeCsvField(string field)
    {
        if (field.Contains(',') || field.Contains('"') || field.Contains('\n'))
            return $"\"{field.Replace("\"", "\"\"")}\"";
        return field;
    }

    private static string FormatDurationCompact(int minutes)
    {
        var hours = minutes / 60;
        var remainingMinutes = minutes % 60;
        return hours > 0 ? $"{hours}h {remainingMinutes:D2}m" : $"{remainingMinutes}m";
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
            IsBillable = timeEntry.IsBillable,
            TaskName = timeEntry.Task?.Name ?? string.Empty,
            ProjectName = ResolveProjectName(timeEntry.Task),
            CreatedAt = timeEntry.CreatedAt
        };
    }

    private static string ResolveProjectName(Abstractions.Entities.Task? task)
    {
        if (task == null) return string.Empty;

        // If the task itself is a project, return its name
        if (task.Type == Abstractions.Constants.TaskType.Project)
            return task.Name;

        // Walk up the parent chain to find the nearest project ancestor
        var current = task.ParentTask;
        while (current != null)
        {
            if (current.Type == Abstractions.Constants.TaskType.Project)
                return current.Name;
            current = current.ParentTask;
        }

        return string.Empty;
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
