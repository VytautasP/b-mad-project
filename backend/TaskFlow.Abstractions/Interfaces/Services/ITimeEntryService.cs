using TaskFlow.Abstractions.DTOs.Shared;
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

    /// <summary>
    /// Retrieves a paginated, filtered list of time entries.
    /// </summary>
    System.Threading.Tasks.Task<PaginatedResultDto<TimeEntryResponseDto>> GetPaginatedTimeEntriesAsync(TimeEntryFilterDto filter, Guid currentUserId, CancellationToken cancellationToken);

    /// <summary>
    /// Retrieves a time entry by ID.
    /// </summary>
    System.Threading.Tasks.Task<TimeEntryResponseDto> GetTimeEntryByIdAsync(Guid entryId, Guid requestingUserId, CancellationToken cancellationToken);

    /// <summary>
    /// Updates a time entry.
    /// </summary>
    System.Threading.Tasks.Task<TimeEntryResponseDto> UpdateTimeEntryAsync(Guid entryId, Guid requestingUserId, TimeEntryCreateDto dto, CancellationToken cancellationToken);

    /// <summary>
    /// Returns aggregated summary stats for a period.
    /// </summary>
    System.Threading.Tasks.Task<TimeEntrySummaryDto> GetSummaryAsync(Guid userId, DateTime? startDate, DateTime? endDate, CancellationToken cancellationToken);

    /// <summary>
    /// Exports time entries as a CSV string.
    /// </summary>
    System.Threading.Tasks.Task<string> ExportTimeEntriesAsync(TimeEntryFilterDto filter, Guid currentUserId, CancellationToken cancellationToken);
}
