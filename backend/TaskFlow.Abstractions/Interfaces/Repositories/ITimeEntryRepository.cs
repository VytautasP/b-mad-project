using TaskFlow.Abstractions.DTOs.Shared;
using TaskFlow.Abstractions.DTOs.TimeEntries;
using TaskFlow.Abstractions.Entities;

namespace TaskFlow.Abstractions.Interfaces.Repositories;

/// <summary>
/// Repository interface for TimeEntry entity operations.
/// </summary>
public interface ITimeEntryRepository
{
    /// <summary>
    /// Creates a new time entry.
    /// </summary>
    System.Threading.Tasks.Task<TimeEntry> CreateAsync(TimeEntry timeEntry, CancellationToken cancellationToken);

    /// <summary>
    /// Retrieves all time entries for a specific task.
    /// </summary>
    System.Threading.Tasks.Task<List<TimeEntry>> GetByTaskIdAsync(Guid taskId, CancellationToken cancellationToken);

    /// <summary>
    /// Retrieves a time entry by its ID.
    /// </summary>
    System.Threading.Tasks.Task<TimeEntry?> GetByIdAsync(Guid id, CancellationToken cancellationToken);

    /// <summary>
    /// Deletes a time entry.
    /// </summary>
    System.Threading.Tasks.Task DeleteAsync(TimeEntry timeEntry, CancellationToken cancellationToken);

    /// <summary>
    /// Gets the total minutes logged for a specific task.
    /// </summary>
    System.Threading.Tasks.Task<int> GetTotalMinutesByTaskIdAsync(Guid taskId, CancellationToken cancellationToken);

    /// <summary>
    /// Returns a paginated, filtered list of time entries.
    /// </summary>
    System.Threading.Tasks.Task<PaginatedResultDto<TimeEntry>> GetPaginatedAsync(TimeEntryFilterDto filter, CancellationToken cancellationToken);

    /// <summary>
    /// Returns aggregated summary for current and previous periods.
    /// </summary>
    System.Threading.Tasks.Task<TimeEntrySummaryDto> GetSummaryAsync(Guid userId, DateTime? startDate, DateTime? endDate, CancellationToken cancellationToken);

    /// <summary>
    /// Returns all matching entries for CSV export (no pagination).
    /// </summary>
    System.Threading.Tasks.Task<List<TimeEntry>> GetForExportAsync(TimeEntryFilterDto filter, CancellationToken cancellationToken);

    /// <summary>
    /// Updates an existing time entry.
    /// </summary>
    System.Threading.Tasks.Task UpdateAsync(TimeEntry timeEntry, CancellationToken cancellationToken);
}
