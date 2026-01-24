using TaskFlow.Abstractions.Constants;
using TaskFlow.Abstractions.Entities;
using TaskEntity = TaskFlow.Abstractions.Entities.Task;

namespace TaskFlow.Abstractions.Interfaces.Repositories;

public interface ITaskRepository
{
    System.Threading.Tasks.Task<TaskEntity> CreateAsync(TaskEntity task, CancellationToken ct = default);
    System.Threading.Tasks.Task<TaskEntity?> GetByIdAsync(Guid id, CancellationToken ct = default);
    System.Threading.Tasks.Task<TaskEntity?> GetByIdWithUserAsync(Guid id, CancellationToken ct = default);
    System.Threading.Tasks.Task<List<TaskEntity>> GetUserTasksAsync(Guid userId, TaskFlow.Abstractions.Constants.TaskStatus? status, CancellationToken ct = default);
    System.Threading.Tasks.Task<bool> UpdateAsync(TaskEntity task, CancellationToken ct = default);
    System.Threading.Tasks.Task<bool> DeleteAsync(Guid id, CancellationToken ct = default);
    System.Threading.Tasks.Task<bool> UserOwnsTaskAsync(Guid taskId, Guid userId, CancellationToken ct = default);
}