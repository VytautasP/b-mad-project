using Microsoft.EntityFrameworkCore;
using TaskFlow.Abstractions.Constants;
using TaskFlow.Abstractions.DTOs.Shared;
using TaskFlow.Abstractions.DTOs.TimeEntries;
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
            .Include(te => te.Task)
                .ThenInclude(t => t.ParentTask!)
                    .ThenInclude(p => p.ParentTask)
            .Where(te => te.TaskId == taskId)
            .OrderByDescending(te => te.EntryDate)
            .ToListAsync(cancellationToken);
    }

    public async System.Threading.Tasks.Task<TimeEntry?> GetByIdAsync(Guid id, CancellationToken cancellationToken)
    {
        return await _context.TimeEntries
            .Include(te => te.User)
            .Include(te => te.Task)
                .ThenInclude(t => t.ParentTask!)
                    .ThenInclude(p => p.ParentTask)
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

    public async System.Threading.Tasks.Task<PaginatedResultDto<TimeEntry>> GetPaginatedAsync(TimeEntryFilterDto filter, CancellationToken cancellationToken)
    {
        var query = BuildFilteredQuery(filter);

        var totalCount = await query.CountAsync(cancellationToken);

        var items = await query
            .OrderByDescending(te => te.EntryDate)
            .Skip((filter.Page - 1) * filter.PageSize)
            .Take(filter.PageSize)
            .ToListAsync(cancellationToken);

        return new PaginatedResultDto<TimeEntry>
        {
            Items = items,
            TotalCount = totalCount,
            Page = filter.Page,
            PageSize = filter.PageSize,
            TotalPages = (int)Math.Ceiling((double)totalCount / filter.PageSize)
        };
    }

    public async System.Threading.Tasks.Task<TimeEntrySummaryDto> GetSummaryAsync(Guid userId, DateTime? startDate, DateTime? endDate, CancellationToken cancellationToken)
    {
        var now = DateTime.UtcNow;
        var periodStart = startDate.HasValue ? ToUtc(startDate.Value) : StartOfWeek(now);
        var periodEnd = endDate.HasValue ? ToUtc(endDate.Value) : EndOfWeek(now);
        var periodDuration = periodEnd - periodStart;

        var previousStart = periodStart - periodDuration - TimeSpan.FromSeconds(1);
        var previousEnd = periodStart.AddSeconds(-1);

        // Current period
        var currentEntries = await _context.TimeEntries
            .AsNoTracking()
            .Where(te => te.UserId == userId && te.EntryDate >= periodStart && te.EntryDate <= periodEnd)
            .Select(te => new { te.Minutes, te.IsBillable })
            .ToListAsync(cancellationToken);

        // Previous period
        var previousEntries = await _context.TimeEntries
            .AsNoTracking()
            .Where(te => te.UserId == userId && te.EntryDate >= previousStart && te.EntryDate <= previousEnd)
            .Select(te => new { te.Minutes, te.IsBillable })
            .ToListAsync(cancellationToken);

        return new TimeEntrySummaryDto
        {
            TotalMinutes = currentEntries.Sum(e => e.Minutes),
            BillableMinutes = currentEntries.Where(e => e.IsBillable).Sum(e => e.Minutes),
            NonBillableMinutes = currentEntries.Where(e => !e.IsBillable).Sum(e => e.Minutes),
            PreviousPeriodTotalMinutes = previousEntries.Sum(e => e.Minutes),
            PreviousPeriodBillableMinutes = previousEntries.Where(e => e.IsBillable).Sum(e => e.Minutes),
            PreviousPeriodNonBillableMinutes = previousEntries.Where(e => !e.IsBillable).Sum(e => e.Minutes)
        };
    }

    public async System.Threading.Tasks.Task<List<TimeEntry>> GetForExportAsync(TimeEntryFilterDto filter, CancellationToken cancellationToken)
    {
        return await BuildFilteredQuery(filter)
            .OrderByDescending(te => te.EntryDate)
            .ToListAsync(cancellationToken);
    }

    public System.Threading.Tasks.Task UpdateAsync(TimeEntry timeEntry, CancellationToken cancellationToken)
    {
        _context.TimeEntries.Update(timeEntry);
        return System.Threading.Tasks.Task.CompletedTask;
    }

    private IQueryable<TimeEntry> BuildFilteredQuery(TimeEntryFilterDto filter)
    {
        var query = _context.TimeEntries
            .AsNoTracking()
            .Include(te => te.User)
            .Include(te => te.Task)
                .ThenInclude(t => t.ParentTask!)
                    .ThenInclude(p => p.ParentTask)
            .AsQueryable();

        if (filter.UserId.HasValue)
            query = query.Where(te => te.UserId == filter.UserId.Value);

        if (filter.StartDate.HasValue)
        {
            var start = ToUtc(filter.StartDate.Value);
            query = query.Where(te => te.EntryDate >= start);
        }

        if (filter.EndDate.HasValue)
        {
            var end = ToUtc(filter.EndDate.Value);
            query = query.Where(te => te.EntryDate <= end);
        }

        if (filter.IsBillable.HasValue)
            query = query.Where(te => te.IsBillable == filter.IsBillable.Value);

        if (filter.ProjectId.HasValue)
        {
            // Filter by entries whose task belongs to the specified project
            query = query.Where(te =>
                te.Task.Id == filter.ProjectId.Value ||
                te.Task.ParentTaskId == filter.ProjectId.Value ||
                (te.Task.ParentTask != null && te.Task.ParentTask.ParentTaskId == filter.ProjectId.Value));
        }

        if (!string.IsNullOrWhiteSpace(filter.Search))
        {
            var searchTerm = filter.Search.Trim();
            query = query.Where(te => te.Note != null && te.Note.Contains(searchTerm));
        }

        return query;
    }

    private static DateTime StartOfWeek(DateTime date)
    {
        var diff = (7 + (date.DayOfWeek - DayOfWeek.Monday)) % 7;
        return DateTime.SpecifyKind(date.Date.AddDays(-diff), DateTimeKind.Utc);
    }

    private static DateTime EndOfWeek(DateTime date)
    {
        return DateTime.SpecifyKind(StartOfWeek(date).AddDays(7).AddSeconds(-1), DateTimeKind.Utc);
    }

    /// <summary>
    /// Ensures a DateTime has Kind=Utc so Npgsql can send it to PostgreSQL timestamp with time zone columns.
    /// </summary>
    private static DateTime ToUtc(DateTime dt) =>
        dt.Kind == DateTimeKind.Utc ? dt : DateTime.SpecifyKind(dt, DateTimeKind.Utc);
}
