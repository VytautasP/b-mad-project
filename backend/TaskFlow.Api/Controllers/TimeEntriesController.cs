using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TaskFlow.Abstractions.DTOs.TimeEntries;
using TaskFlow.Abstractions.Interfaces.Services;

namespace TaskFlow.Api.Controllers;

/// <summary>
/// Controller for time entry operations.
/// </summary>
[ApiController]
[Authorize]
[Route("api/timeentries")]
public class TimeEntriesController : ControllerBase
{
    private readonly ITimeEntryService _timeEntryService;
    private readonly ILogger<TimeEntriesController> _logger;

    public TimeEntriesController(ITimeEntryService timeEntryService, ILogger<TimeEntriesController> logger)
    {
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

    /// <summary>
    /// Returns a paginated, filtered list of time entries for the current user.
    /// </summary>
    [HttpGet]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async System.Threading.Tasks.Task<IActionResult> GetTimeEntries([FromQuery] TimeEntryFilterDto filter, CancellationToken ct)
    {
        var userId = GetCurrentUserId();
        var result = await _timeEntryService.GetPaginatedTimeEntriesAsync(filter, userId, ct);
        return Ok(result);
    }

    /// <summary>
    /// Returns a specific time entry by ID.
    /// </summary>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async System.Threading.Tasks.Task<IActionResult> GetTimeEntry(Guid id, CancellationToken ct)
    {
        var userId = GetCurrentUserId();
        var result = await _timeEntryService.GetTimeEntryByIdAsync(id, userId, ct);
        return Ok(result);
    }

    /// <summary>
    /// Creates a new time entry for a task.
    /// </summary>
    [HttpPost]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async System.Threading.Tasks.Task<IActionResult> CreateTimeEntry([FromBody] TimeEntryCreateRequest request, CancellationToken ct)
    {
        var userId = GetCurrentUserId();
        var result = await _timeEntryService.LogTimeAsync(request.TaskId, userId, request.ToDto(), ct);
        return CreatedAtAction(nameof(GetTimeEntry), new { id = result.Id }, result);
    }

    /// <summary>
    /// Updates a specific time entry.
    /// </summary>
    [HttpPatch("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async System.Threading.Tasks.Task<IActionResult> UpdateTimeEntry(Guid id, [FromBody] TimeEntryCreateDto dto, CancellationToken ct)
    {
        var userId = GetCurrentUserId();
        var result = await _timeEntryService.UpdateTimeEntryAsync(id, userId, dto, ct);
        return Ok(result);
    }

    /// <summary>
    /// Deletes a specific time entry.
    /// </summary>
    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async System.Threading.Tasks.Task<IActionResult> DeleteTimeEntry(Guid id, CancellationToken ct)
    {
        var userId = GetCurrentUserId();
        await _timeEntryService.DeleteTimeEntryAsync(id, userId, ct);
        return NoContent();
    }

    /// <summary>
    /// Returns aggregated time entry summary stats for the current/previous periods.
    /// </summary>
    [HttpGet("summary")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async System.Threading.Tasks.Task<IActionResult> GetSummary([FromQuery] DateTime? startDate, [FromQuery] DateTime? endDate, CancellationToken ct)
    {
        var userId = GetCurrentUserId();
        var result = await _timeEntryService.GetSummaryAsync(userId, startDate, endDate, ct);
        return Ok(result);
    }

    /// <summary>
    /// Exports time entries as a CSV file download.
    /// </summary>
    [HttpGet("export")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async System.Threading.Tasks.Task<IActionResult> ExportCsv([FromQuery] TimeEntryFilterDto filter, CancellationToken ct)
    {
        var userId = GetCurrentUserId();
        var csv = await _timeEntryService.ExportTimeEntriesAsync(filter, userId, ct);
        var bytes = System.Text.Encoding.UTF8.GetBytes(csv);
        return File(bytes, "text/csv", "time-logs.csv");
    }
}

/// <summary>
/// Request body for creating a time entry (includes TaskId).
/// </summary>
public class TimeEntryCreateRequest
{
    public Guid TaskId { get; set; }
    public int Minutes { get; set; }
    public string? Note { get; set; }
    public DateTime? EntryDate { get; set; }
    public Abstractions.Constants.EntryType EntryType { get; set; }
    public bool IsBillable { get; set; }

    public TimeEntryCreateDto ToDto() => new()
    {
        Minutes = Minutes,
        Note = Note,
        EntryDate = EntryDate,
        EntryType = EntryType,
        IsBillable = IsBillable
    };
}
