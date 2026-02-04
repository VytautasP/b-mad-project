using TaskFlow.Abstractions.Constants;
using TaskFlow.Abstractions.DTOs.Task;
using TaskFlow.Abstractions.DTOs.Tasks;
using TaskFlow.Abstractions.DTOs.Shared;

namespace TaskFlow.Abstractions.Interfaces.Services;

public interface ITaskService
{
    System.Threading.Tasks.Task<TaskResponseDto> CreateTaskAsync(TaskCreateDto dto, Guid currentUserId, CancellationToken ct = default);
    System.Threading.Tasks.Task<TaskResponseDto> GetTaskByIdAsync(Guid id, Guid currentUserId, CancellationToken ct = default);
    System.Threading.Tasks.Task<List<TaskResponseDto>> GetUserTasksAsync(Guid userId, TaskFlow.Abstractions.Constants.TaskStatus? status, string? searchTerm, bool myTasksOnly, CancellationToken ct = default);
    System.Threading.Tasks.Task<PaginatedResultDto<TaskResponseDto>> GetTasksAsync(Guid userId, TaskQueryDto queryDto, CancellationToken ct = default);
    System.Threading.Tasks.Task<TaskResponseDto> UpdateTaskAsync(Guid id, TaskUpdateDto dto, Guid currentUserId, CancellationToken ct = default);
    System.Threading.Tasks.Task DeleteTaskAsync(Guid id, Guid currentUserId, CancellationToken ct = default);
    
    // Hierarchy methods
    System.Threading.Tasks.Task SetParentTaskAsync(Guid taskId, Guid parentTaskId, Guid userId, CancellationToken ct = default);
    System.Threading.Tasks.Task RemoveParentAsync(Guid taskId, Guid userId, CancellationToken ct = default);
    System.Threading.Tasks.Task<List<TaskResponseDto>> GetChildrenAsync(Guid taskId, Guid userId, CancellationToken ct = default);
    System.Threading.Tasks.Task<List<TaskHierarchyDto>> GetAncestorsAsync(Guid taskId, Guid userId, CancellationToken ct = default);
    System.Threading.Tasks.Task<List<TaskHierarchyDto>> GetDescendantsAsync(Guid taskId, Guid userId, CancellationToken ct = default);
    
    // Assignment methods
    System.Threading.Tasks.Task AssignUserAsync(Guid taskId, Guid userId, Guid assignedByUserId, CancellationToken ct = default);
    System.Threading.Tasks.Task UnassignUserAsync(Guid taskId, Guid userId, Guid currentUserId, CancellationToken ct = default);
    System.Threading.Tasks.Task<List<TaskAssignmentDto>> GetTaskAssigneesAsync(Guid taskId, Guid currentUserId, CancellationToken ct = default);
}