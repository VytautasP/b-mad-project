using Microsoft.Extensions.Logging;
using TaskFlow.Abstractions.Constants;
using TaskFlow.Abstractions.DTOs.Task;
using TaskFlow.Abstractions.Exceptions;
using TaskFlow.Abstractions.Interfaces;
using TaskFlow.Abstractions.Interfaces.Services;
using TaskEntity = TaskFlow.Abstractions.Entities.Task;

namespace TaskFlow.Core.Services;

public class TaskService : ITaskService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<TaskService> _logger;

    public TaskService(IUnitOfWork unitOfWork, ILogger<TaskService> logger)
    {
        _unitOfWork = unitOfWork;
        _logger = logger;
    }

    public async System.Threading.Tasks.Task<TaskResponseDto> CreateTaskAsync(TaskCreateDto dto, Guid currentUserId, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(dto.Name))
        {
            throw new ValidationException("Task name is required");
        }

        var task = new TaskEntity
        {
            Name = dto.Name,
            Description = dto.Description,
            ParentTaskId = dto.ParentTaskId,
            DueDate = dto.DueDate,
            Priority = dto.Priority,
            Status = dto.Status,
            Type = dto.Type,
            Progress = 0,
            CreatedByUserId = currentUserId
        };

        var createdTask = await _unitOfWork.Tasks.CreateAsync(task, ct);
        await _unitOfWork.SaveChangesAsync(ct);

        var taskWithUser = await _unitOfWork.Tasks.GetByIdWithUserAsync(createdTask.Id, ct);
        
        _logger.LogInformation("User {UserId} created task {TaskId}", currentUserId, createdTask.Id);

        return MapToResponseDto(taskWithUser!);
    }

    public async System.Threading.Tasks.Task<TaskResponseDto> GetTaskByIdAsync(Guid id, Guid currentUserId, CancellationToken ct = default)
    {
        var task = await _unitOfWork.Tasks.GetByIdWithUserAsync(id, ct);

        if (task == null)
        {
            throw new NotFoundException($"Task with ID {id} not found");
        }

        if (task.CreatedByUserId != currentUserId)
        {
            throw new UnauthorizedException("You do not have permission to access this task");
        }

        return MapToResponseDto(task);
    }

    public async System.Threading.Tasks.Task<List<TaskResponseDto>> GetUserTasksAsync(Guid userId, TaskFlow.Abstractions.Constants.TaskStatus? status, string? searchTerm = null, CancellationToken ct = default)
    {
        var tasks = await _unitOfWork.Tasks.GetUserTasksAsync(userId, status, searchTerm, ct);
        return tasks.Select(MapToResponseDto).ToList();
    }

    public async System.Threading.Tasks.Task<TaskResponseDto> UpdateTaskAsync(Guid id, TaskUpdateDto dto, Guid currentUserId, CancellationToken ct = default)
    {
        var task = await _unitOfWork.Tasks.GetByIdAsync(id, ct);

        if (task == null)
        {
            throw new NotFoundException($"Task with ID {id} not found");
        }

        var ownsTask = await _unitOfWork.Tasks.UserOwnsTaskAsync(id, currentUserId, ct);
        if (!ownsTask)
        {
            throw new UnauthorizedException("You do not have permission to update this task");
        }

        if (dto.Name != null) task.Name = dto.Name;
        if (dto.Description != null) task.Description = dto.Description;
        if (dto.ParentTaskId != null) task.ParentTaskId = dto.ParentTaskId;
        if (dto.DueDate != null) task.DueDate = dto.DueDate;
        if (dto.Priority.HasValue) task.Priority = dto.Priority.Value;
        if (dto.Status.HasValue) task.Status = dto.Status.Value;
        if (dto.Progress.HasValue) task.Progress = dto.Progress.Value;
        if (dto.Type.HasValue) task.Type = dto.Type.Value;

        await _unitOfWork.Tasks.UpdateAsync(task, ct);
        await _unitOfWork.SaveChangesAsync(ct);

        var updatedTask = await _unitOfWork.Tasks.GetByIdWithUserAsync(id, ct);

        _logger.LogInformation("User {UserId} updated task {TaskId}", currentUserId, id);

        return MapToResponseDto(updatedTask!);
    }

    public async System.Threading.Tasks.Task DeleteTaskAsync(Guid id, Guid currentUserId, CancellationToken ct = default)
    {
        var ownsTask = await _unitOfWork.Tasks.UserOwnsTaskAsync(id, currentUserId, ct);
        if (!ownsTask)
        {
            throw new UnauthorizedException("You do not have permission to delete this task");
        }

        await _unitOfWork.Tasks.DeleteAsync(id, ct);
        await _unitOfWork.SaveChangesAsync(ct);

        _logger.LogInformation("User {UserId} deleted task {TaskId}", currentUserId, id);
    }

    private TaskResponseDto MapToResponseDto(TaskEntity task)
    {
        return new TaskResponseDto
        {
            Id = task.Id,
            Name = task.Name,
            Description = task.Description,
            ParentTaskId = task.ParentTaskId,
            CreatedByUserId = task.CreatedByUserId,
            CreatedByUserName = task.CreatedByUser?.Name ?? string.Empty,
            CreatedDate = task.CreatedDate,
            ModifiedDate = task.ModifiedDate,
            DueDate = task.DueDate,
            Priority = task.Priority,
            Status = task.Status,
            Progress = task.Progress,
            Type = task.Type
        };
    }
}
