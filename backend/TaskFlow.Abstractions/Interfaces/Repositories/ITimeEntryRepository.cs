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
}
