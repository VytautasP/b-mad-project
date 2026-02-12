using TaskFlow.Abstractions.Entities;

namespace TaskFlow.Abstractions.Interfaces.Repositories;

public interface IActivityLogRepository
{
    System.Threading.Tasks.Task<ActivityLog> CreateAsync(ActivityLog activityLog, CancellationToken cancellationToken);
    System.Threading.Tasks.Task<(List<ActivityLog> Items, int TotalCount)> GetByTaskIdPagedAsync(
        Guid taskId,
        int page,
        int pageSize,
        CancellationToken cancellationToken);
}
