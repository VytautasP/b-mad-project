using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TaskFlow.Abstractions.Constants;
using TaskFlow.Abstractions.DTOs.Task;
using TaskFlow.Abstractions.DTOs.Tasks;
using TaskFlow.Abstractions.DTOs.Shared;
using TaskFlow.Abstractions.DTOs.TimeEntries;
using TaskFlow.Abstractions.Interfaces.Services;

namespace TaskFlow.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/tasks")]
public class TasksController : ControllerBase
{
    private readonly ITaskService _taskService;
    private readonly ITimeEntryService _timeEntryService;
    private readonly ILogger<TasksController> _logger;

    public TasksController(ITaskService taskService, ITimeEntryService timeEntryService, ILogger<TasksController> logger)
    {
        _taskService = taskService;
        _timeEntryService = timeEntryService;
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

    /// <summary>
    /// Retrieves tasks with advanced filtering, sorting, and pagination.
    /// </summary>
    /// <param name="queryDto">Query parameters for filtering, sorting, and pagination</param>
    /// <param name="ct">Cancellation token</param>
    /// <returns>Paginated list of tasks matching the specified criteria</returns>
    /// <remarks>
    /// Sample request:
    /// 
    ///     GET /api/tasks?assigneeId=3fa85f64-5717-4562-b3fc-2c963f66afa6&amp;status=1&amp;priority=2&amp;type=2&amp;dueDateFrom=2026-01-01&amp;dueDateTo=2026-12-31&amp;searchTerm=important&amp;sortBy=dueDate&amp;sortOrder=asc&amp;page=1&amp;pageSize=50
    ///     
    /// Query Parameters:
    /// - assigneeId: Filter by assigned user ID
    /// - status: Filter by task status (0=ToDo, 1=InProgress, 2=Blocked, 3=Waiting, 4=Done)
    /// - priority: Filter by priority (0=Low, 1=Medium, 2=High, 3=Critical)
    /// - type: Filter by task type (0=Project, 1=Milestone, 2=Task)
    /// - dueDateFrom: Filter by due date range start (ISO 8601 date)
    /// - dueDateTo: Filter by due date range end (ISO 8601 date)
    /// - searchTerm: Search in task name and description (case-insensitive)
    /// - sortBy: Sort field (name, createdDate, dueDate, priority, status, loggedMinutes)
    /// - sortOrder: Sort order (asc or desc, default: asc)
    /// - page: Page number (default: 1, minimum: 1)
    /// - pageSize: Items per page (default: 50, minimum: 1, maximum: 200)
    /// 
    /// Response includes pagination metadata: totalCount, page, pageSize, totalPages, hasNextPage, hasPreviousPage
    /// </remarks>
    /// <response code="200">Returns paginated list of tasks</response>
    /// <response code="400">Invalid query parameters</response>
    /// <response code="401">Unauthorized - authentication required</response>
    [HttpGet]
    [ProducesResponseType(typeof(PaginatedResultDto<TaskResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async System.Threading.Tasks.Task<IActionResult> GetUserTasks([FromQuery] TaskQueryDto queryDto, CancellationToken ct = default)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var userId = GetCurrentUserId();
        var result = await _taskService.GetTasksAsync(userId, queryDto, ct);
        return Ok(result);
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

    /// <summary>
    /// Logs time for a specific task.
    /// </summary>
    [HttpPost("{taskId:guid}/timeentries")]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async System.Threading.Tasks.Task<IActionResult> LogTime(Guid taskId, [FromBody] TimeEntryCreateDto dto, CancellationToken ct)
    {
        var userId = GetCurrentUserId();
        var result = await _timeEntryService.LogTimeAsync(taskId, userId, dto, ct);
        return CreatedAtAction(nameof(GetTimeEntries), new { taskId }, result);
    }

    /// <summary>
    /// Retrieves all time entries for a specific task.
    /// </summary>
    [HttpGet("{taskId:guid}/timeentries")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async System.Threading.Tasks.Task<IActionResult> GetTimeEntries(Guid taskId, CancellationToken ct)
    {
        var userId = GetCurrentUserId();
        var result = await _timeEntryService.GetTaskTimeEntriesAsync(taskId, userId, ct);
        return Ok(result);
    }
}
