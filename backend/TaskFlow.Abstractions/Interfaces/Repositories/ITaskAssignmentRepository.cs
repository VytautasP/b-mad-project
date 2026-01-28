using TaskFlow.Abstractions.Entities;

namespace TaskFlow.Abstractions.Interfaces.Repositories;

public interface ITaskAssignmentRepository
{
    System.Threading.Tasks.Task<TaskAssignment?> GetAssignmentAsync(Guid taskId, Guid userId, CancellationToken cancellationToken);
    System.Threading.Tasks.Task<List<TaskAssignment>> GetTaskAssignmentsAsync(Guid taskId, CancellationToken cancellationToken);
    System.Threading.Tasks.Task<List<TaskAssignment>> GetUserAssignmentsAsync(Guid userId, CancellationToken cancellationToken);
    System.Threading.Tasks.Task AddAssignmentAsync(TaskAssignment assignment, CancellationToken cancellationToken);
    System.Threading.Tasks.Task RemoveAssignmentAsync(TaskAssignment assignment, CancellationToken cancellationToken);
    System.Threading.Tasks.Task<bool> IsUserAssignedToTaskAsync(Guid taskId, Guid userId, CancellationToken cancellationToken);
}
