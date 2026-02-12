using Microsoft.EntityFrameworkCore;
using TaskFlow.Abstractions.Entities;
using TaskFlow.Abstractions.Interfaces.Repositories;
using TaskFlow.Infrastructure.Data;

namespace TaskFlow.Infrastructure.Repositories;

public class ActivityLogRepository : IActivityLogRepository
{
    private readonly ApplicationDbContext _context;

    public ActivityLogRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async System.Threading.Tasks.Task<ActivityLog> CreateAsync(ActivityLog activityLog, CancellationToken cancellationToken)
    {
        await _context.ActivityLogs.AddAsync(activityLog, cancellationToken);
        return activityLog;
    }

    public async System.Threading.Tasks.Task<(List<ActivityLog> Items, int TotalCount)> GetByTaskIdPagedAsync(
        Guid taskId,
        int page,
        int pageSize,
        CancellationToken cancellationToken)
    {
        var baseQuery = _context.ActivityLogs
            .AsNoTracking()
            .Include(a => a.User)
            .Where(a => a.TaskId == taskId);

        var totalCount = await baseQuery.CountAsync(cancellationToken);
        var items = await baseQuery
            .OrderByDescending(a => a.Timestamp)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return (items, totalCount);
    }
}
