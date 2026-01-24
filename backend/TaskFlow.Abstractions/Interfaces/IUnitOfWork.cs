using TaskFlow.Abstractions.Interfaces.Repositories;

namespace TaskFlow.Abstractions.Interfaces;

public interface IUnitOfWork : IDisposable
{
    IUserRepository Users { get; }
    ITaskRepository Tasks { get; }
    Task<int> SaveChangesAsync(CancellationToken ct = default);
}