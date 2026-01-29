using Microsoft.EntityFrameworkCore;
using TaskFlow.Abstractions.Entities;
using TaskFlow.Abstractions.Interfaces.Repositories;
using TaskFlow.Infrastructure.Data;

namespace TaskFlow.Infrastructure.Repositories;

/// <summary>
/// Repository implementation for TimeEntry entity operations.
/// </summary>
public class TimeEntryRepository : ITimeEntryRepository
{
    private readonly ApplicationDbContext _context;

    public TimeEntryRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async System.Threading.Tasks.Task<TimeEntry> CreateAsync(TimeEntry timeEntry, CancellationToken cancellationToken)
    {
        await _context.TimeEntries.AddAsync(timeEntry, cancellationToken);
        return timeEntry;
    }

    public async System.Threading.Tasks.Task<List<TimeEntry>> GetByTaskIdAsync(Guid taskId, CancellationToken cancellationToken)
    {
        return await _context.TimeEntries
            .AsNoTracking()
            .Include(te => te.User)
            .Where(te => te.TaskId == taskId)
            .OrderByDescending(te => te.EntryDate)
            .ToListAsync(cancellationToken);
    }

    public async System.Threading.Tasks.Task<TimeEntry?> GetByIdAsync(Guid id, CancellationToken cancellationToken)
    {
        return await _context.TimeEntries
            .Include(te => te.User)
            .FirstOrDefaultAsync(te => te.Id == id, cancellationToken);
    }

    public System.Threading.Tasks.Task DeleteAsync(TimeEntry timeEntry, CancellationToken cancellationToken)
    {
        _context.TimeEntries.Remove(timeEntry);
        return System.Threading.Tasks.Task.CompletedTask;
    }

    public async System.Threading.Tasks.Task<int> GetTotalMinutesByTaskIdAsync(Guid taskId, CancellationToken cancellationToken)
    {
        return await _context.TimeEntries
            .AsNoTracking()
            .Where(te => te.TaskId == taskId)
            .SumAsync(te => te.Minutes, cancellationToken);
    }
}
