using TaskFlow.Abstractions.DTOs.TimeEntries;

namespace TaskFlow.Abstractions.Interfaces.Services;

/// <summary>
/// Service interface for time entry operations.
/// </summary>
public interface ITimeEntryService
{
    /// <summary>
    /// Logs time for a task.
    /// </summary>
    System.Threading.Tasks.Task<TimeEntryResponseDto> LogTimeAsync(Guid taskId, Guid userId, TimeEntryCreateDto dto, CancellationToken cancellationToken);

    /// <summary>
    /// Retrieves all time entries for a specific task.
    /// </summary>
    System.Threading.Tasks.Task<List<TimeEntryResponseDto>> GetTaskTimeEntriesAsync(Guid taskId, Guid requestingUserId, CancellationToken cancellationToken);

    /// <summary>
    /// Deletes a time entry.
    /// </summary>
    System.Threading.Tasks.Task DeleteTimeEntryAsync(Guid entryId, Guid requestingUserId, CancellationToken cancellationToken);
}
