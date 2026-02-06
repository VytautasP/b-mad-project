using TaskFlow.Abstractions.Interfaces.Repositories;

namespace TaskFlow.Abstractions.Interfaces;

public interface IUnitOfWork : IDisposable
{
    IUserRepository Users { get; }
    ITaskRepository Tasks { get; }
    ITaskAssignmentRepository TaskAssignments { get; }
    ITimeEntryRepository TimeEntries { get; }
    ICommentRepository Comments { get; }
    System.Threading.Tasks.Task<int> SaveChangesAsync(CancellationToken ct = default);
}