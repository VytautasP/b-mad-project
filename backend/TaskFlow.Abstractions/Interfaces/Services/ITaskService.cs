using TaskFlow.Abstractions.Constants;
using TaskFlow.Abstractions.DTOs.Task;

namespace TaskFlow.Abstractions.Interfaces.Services;

public interface ITaskService
{
    System.Threading.Tasks.Task<TaskResponseDto> CreateTaskAsync(TaskCreateDto dto, Guid currentUserId, CancellationToken ct = default);
    System.Threading.Tasks.Task<TaskResponseDto> GetTaskByIdAsync(Guid id, Guid currentUserId, CancellationToken ct = default);
    System.Threading.Tasks.Task<List<TaskResponseDto>> GetUserTasksAsync(Guid userId, TaskFlow.Abstractions.Constants.TaskStatus? status, CancellationToken ct = default);
    System.Threading.Tasks.Task<TaskResponseDto> UpdateTaskAsync(Guid id, TaskUpdateDto dto, Guid currentUserId, CancellationToken ct = default);
    System.Threading.Tasks.Task DeleteTaskAsync(Guid id, Guid currentUserId, CancellationToken ct = default);
}