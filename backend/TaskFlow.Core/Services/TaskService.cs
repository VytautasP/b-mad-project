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
            HasChildren = task.Children?.Any() ?? false,
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

    public async System.Threading.Tasks.Task SetParentTaskAsync(Guid taskId, Guid parentTaskId, Guid userId, CancellationToken ct = default)
    {
        // Validate task exists and belongs to user
        var task = await _unitOfWork.Tasks.GetByIdAsync(taskId, ct);
        if (task == null)
        {
            throw new NotFoundException($"Task with ID {taskId} not found");
        }

        if (task.CreatedByUserId != userId)
        {
            throw new UnauthorizedException("You do not have permission to modify this task");
        }

        // Validate parent task exists and belongs to user
        var parentTask = await _unitOfWork.Tasks.GetByIdAsync(parentTaskId, ct);
        if (parentTask == null)
        {
            throw new NotFoundException($"Parent task with ID {parentTaskId} not found");
        }

        if (parentTask.CreatedByUserId != userId)
        {
            throw new UnauthorizedException("You do not have permission to set this task as parent");
        }

        // Prevent circular reference: task cannot be its own parent
        if (taskId == parentTaskId)
        {
            throw new ValidationException("A task cannot be its own parent");
        }

        // Prevent circular reference: task cannot be set as parent of its ancestor
        var isDescendant = await _unitOfWork.Tasks.IsDescendantOfAsync(parentTaskId, taskId, ct);
        if (isDescendant)
        {
            throw new ValidationException("Cannot set a descendant task as parent - this would create a circular reference");
        }

        // Calculate new depth and enforce limit
        var parentDepth = await _unitOfWork.Tasks.GetTaskDepthAsync(parentTaskId, ct);
        var newDepth = parentDepth + 1;
        if (newDepth > 15)
        {
            throw new ValidationException($"Cannot set parent - maximum hierarchy depth of 15 levels would be exceeded (current parent depth: {parentDepth})");
        }

        // Update parent
        task.ParentTaskId = parentTaskId;
        await _unitOfWork.Tasks.UpdateAsync(task, ct);
        await _unitOfWork.SaveChangesAsync(ct);

        _logger.LogInformation("User {UserId} set parent of task {TaskId} to {ParentTaskId}", userId, taskId, parentTaskId);
    }

    public async System.Threading.Tasks.Task RemoveParentAsync(Guid taskId, Guid userId, CancellationToken ct = default)
    {
        var task = await _unitOfWork.Tasks.GetByIdAsync(taskId, ct);
        if (task == null)
        {
            throw new NotFoundException($"Task with ID {taskId} not found");
        }

        if (task.CreatedByUserId != userId)
        {
            throw new UnauthorizedException("You do not have permission to modify this task");
        }

        task.ParentTaskId = null;
        await _unitOfWork.Tasks.UpdateAsync(task, ct);
        await _unitOfWork.SaveChangesAsync(ct);

        _logger.LogInformation("User {UserId} removed parent from task {TaskId}", userId, taskId);
    }

    public async System.Threading.Tasks.Task<List<TaskResponseDto>> GetChildrenAsync(Guid taskId, Guid userId, CancellationToken ct = default)
    {
        // Verify user owns the task
        var ownsTask = await _unitOfWork.Tasks.UserOwnsTaskAsync(taskId, userId, ct);
        if (!ownsTask)
        {
            throw new UnauthorizedException("You do not have permission to access this task");
        }

        var children = await _unitOfWork.Tasks.GetChildrenAsync(taskId, ct);
        return children.Select(t => new TaskResponseDto
        {
            Id = t.Id,
            Name = t.Name,
            Description = t.Description,
            ParentTaskId = t.ParentTaskId,
            HasChildren = t.Children?.Any() ?? false,
            CreatedByUserId = t.CreatedByUserId,
            CreatedByUserName = string.Empty, // Not loaded in GetChildren
            CreatedDate = t.CreatedDate,
            ModifiedDate = t.ModifiedDate,
            DueDate = t.DueDate,
            Priority = t.Priority,
            Status = t.Status,
            Progress = t.Progress,
            Type = t.Type
        }).ToList();
    }

    public async System.Threading.Tasks.Task<List<TaskHierarchyDto>> GetAncestorsAsync(Guid taskId, Guid userId, CancellationToken ct = default)
    {
        // Verify user owns the task
        var ownsTask = await _unitOfWork.Tasks.UserOwnsTaskAsync(taskId, userId, ct);
        if (!ownsTask)
        {
            throw new UnauthorizedException("You do not have permission to access this task");
        }

        var ancestors = await _unitOfWork.Tasks.GetAncestorsAsync(taskId, ct);
        
        // Build paths for ancestors
        for (int i = 0; i < ancestors.Count; i++)
        {
            ancestors[i].Path = string.Join(" > ", ancestors.Skip(i).Select(a => a.Name));
            ancestors[i].HasChildren = true; // All ancestors have at least one child
        }

        return ancestors;
    }

    public async System.Threading.Tasks.Task<List<TaskHierarchyDto>> GetDescendantsAsync(Guid taskId, Guid userId, CancellationToken ct = default)
    {
        // Verify user owns the task
        var ownsTask = await _unitOfWork.Tasks.UserOwnsTaskAsync(taskId, userId, ct);
        if (!ownsTask)
        {
            throw new UnauthorizedException("You do not have permission to access this task");
        }

        var descendants = await _unitOfWork.Tasks.GetDescendantsAsync(taskId, ct);
        
        // Check which tasks have children
        var descendantIds = descendants.Select(d => d.TaskId).ToList();
        foreach (var descendant in descendants)
        {
            descendant.HasChildren = descendants.Any(d => d.ParentTaskId == descendant.TaskId);
        }

        return descendants;
    }
}
