using TaskFlow.Abstractions.Constants;
using TaskFlow.Abstractions.DTOs.Task;
using TaskFlow.Abstractions.Entities;
using TaskEntity = TaskFlow.Abstractions.Entities.Task;

namespace TaskFlow.Abstractions.Interfaces.Repositories;

public interface ITaskRepository
{
    System.Threading.Tasks.Task<TaskEntity> CreateAsync(TaskEntity task, CancellationToken ct = default);
    System.Threading.Tasks.Task<TaskEntity?> GetByIdAsync(Guid id, CancellationToken ct = default);
    System.Threading.Tasks.Task<TaskEntity?> GetByIdWithUserAsync(Guid id, CancellationToken ct = default);
    System.Threading.Tasks.Task<List<TaskEntity>> GetUserTasksAsync(Guid userId, TaskFlow.Abstractions.Constants.TaskStatus? status, string? searchTerm = null, CancellationToken ct = default);
    System.Threading.Tasks.Task<List<TaskEntity>> GetAssignedTasksAsync(Guid userId, TaskFlow.Abstractions.Constants.TaskStatus? status, string? searchTerm = null, CancellationToken ct = default);
    System.Threading.Tasks.Task<bool> UpdateAsync(TaskEntity task, CancellationToken ct = default);
    System.Threading.Tasks.Task<bool> DeleteAsync(Guid id, CancellationToken ct = default);
    System.Threading.Tasks.Task<bool> UserOwnsTaskAsync(Guid taskId, Guid userId, CancellationToken ct = default);
    
    // Hierarchy methods
    System.Threading.Tasks.Task<List<TaskEntity>> GetChildrenAsync(Guid taskId, CancellationToken ct = default);
    System.Threading.Tasks.Task<List<TaskHierarchyDto>> GetAncestorsAsync(Guid taskId, CancellationToken ct = default);
    System.Threading.Tasks.Task<List<TaskHierarchyDto>> GetDescendantsAsync(Guid taskId, CancellationToken ct = default);
    System.Threading.Tasks.Task<int> GetTaskDepthAsync(Guid taskId, CancellationToken ct = default);
    System.Threading.Tasks.Task<bool> IsDescendantOfAsync(Guid taskId, Guid potentialAncestorId, CancellationToken ct = default);
    
    // Time rollup methods
    System.Threading.Tasks.Task<Dictionary<Guid, TaskTimeRollup>> GetTimeRollupsAsync(IEnumerable<Guid> taskIds, CancellationToken ct = default);
    System.Threading.Tasks.Task<List<Guid>> GetAncestorIdsAsync(Guid taskId, CancellationToken ct = default);
}