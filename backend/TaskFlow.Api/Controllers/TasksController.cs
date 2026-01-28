using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TaskFlow.Abstractions.Constants;
using TaskFlow.Abstractions.DTOs.Task;
using TaskFlow.Abstractions.Interfaces.Services;

namespace TaskFlow.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/tasks")]
public class TasksController : ControllerBase
{
    private readonly ITaskService _taskService;
    private readonly ILogger<TasksController> _logger;

    public TasksController(ITaskService taskService, ILogger<TasksController> logger)
    {
        _taskService = taskService;
        _logger = logger;
    }

    private Guid GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
        {
            throw new UnauthorizedAccessException("User ID not found in token");
        }
        return userId;
    }

    [HttpPost]
    public async System.Threading.Tasks.Task<IActionResult> CreateTask([FromBody] TaskCreateDto dto, CancellationToken ct)
    {
        var userId = GetCurrentUserId();
        var result = await _taskService.CreateTaskAsync(dto, userId, ct);
        return CreatedAtAction(nameof(GetTaskById), new { id = result.Id }, result);
    }

    [HttpGet]
    public async System.Threading.Tasks.Task<IActionResult> GetUserTasks([FromQuery] TaskFlow.Abstractions.Constants.TaskStatus? status, [FromQuery] string? search, [FromQuery] bool myTasks, CancellationToken ct = default)
    {
        var userId = GetCurrentUserId();
        var tasks = await _taskService.GetUserTasksAsync(userId, status, search, myTasks, ct);
        return Ok(tasks);
    }

    [HttpGet("{id}")]
    public async System.Threading.Tasks.Task<IActionResult> GetTaskById(Guid id, CancellationToken ct)
    {
        var userId = GetCurrentUserId();
        var task = await _taskService.GetTaskByIdAsync(id, userId, ct);
        return Ok(task);
    }

    [HttpPut("{id}")]
    public async System.Threading.Tasks.Task<IActionResult> UpdateTask(Guid id, [FromBody] TaskUpdateDto dto, CancellationToken ct)
    {
        var userId = GetCurrentUserId();
        var result = await _taskService.UpdateTaskAsync(id, dto, userId, ct);
        return Ok(result);
    }

    [HttpDelete("{id}")]
    public async System.Threading.Tasks.Task<IActionResult> DeleteTask(Guid id, CancellationToken ct)
    {
        var userId = GetCurrentUserId();
        await _taskService.DeleteTaskAsync(id, userId, ct);
        return NoContent();
    }

    [HttpGet("{id}/children")]
    public async System.Threading.Tasks.Task<IActionResult> GetChildren(Guid id, CancellationToken ct)
    {
        var userId = GetCurrentUserId();
        var children = await _taskService.GetChildrenAsync(id, userId, ct);
        return Ok(children);
    }

    [HttpGet("{id}/ancestors")]
    public async System.Threading.Tasks.Task<IActionResult> GetAncestors(Guid id, CancellationToken ct)
    {
        var userId = GetCurrentUserId();
        var ancestors = await _taskService.GetAncestorsAsync(id, userId, ct);
        return Ok(ancestors);
    }

    [HttpGet("{id}/descendants")]
    public async System.Threading.Tasks.Task<IActionResult> GetDescendants(Guid id, CancellationToken ct)
    {
        var userId = GetCurrentUserId();
        var descendants = await _taskService.GetDescendantsAsync(id, userId, ct);
        return Ok(descendants);
    }

    [HttpPut("{id}/parent")]
    public async System.Threading.Tasks.Task<IActionResult> SetParent(Guid id, [FromBody] SetParentDto dto, CancellationToken ct)
    {
        var userId = GetCurrentUserId();
        await _taskService.SetParentTaskAsync(id, dto.ParentTaskId, userId, ct);
        return NoContent();
    }

    [HttpDelete("{id}/parent")]
    public async System.Threading.Tasks.Task<IActionResult> RemoveParent(Guid id, CancellationToken ct)
    {
        var userId = GetCurrentUserId();
        await _taskService.RemoveParentAsync(id, userId, ct);
        return NoContent();
    }

    [HttpPost("{id}/assignments")]
    public async System.Threading.Tasks.Task<IActionResult> AssignUser(Guid id, [FromBody] AssignUserDto dto, CancellationToken ct)
    {
        var userId = GetCurrentUserId();
        await _taskService.AssignUserAsync(id, dto.UserId, userId, ct);
        return NoContent();
    }

    [HttpDelete("{id}/assignments/{userId}")]
    public async System.Threading.Tasks.Task<IActionResult> UnassignUser(Guid id, Guid userId, CancellationToken ct)
    {
        var currentUserId = GetCurrentUserId();
        await _taskService.UnassignUserAsync(id, userId, currentUserId, ct);
        return NoContent();
    }

    [HttpGet("{id}/assignments")]
    public async System.Threading.Tasks.Task<IActionResult> GetTaskAssignees(Guid id, CancellationToken ct)
    {
        var userId = GetCurrentUserId();
        var assignees = await _taskService.GetTaskAssigneesAsync(id, userId, ct);
        return Ok(assignees);
    }
}
