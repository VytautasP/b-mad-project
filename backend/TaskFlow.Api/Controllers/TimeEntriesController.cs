using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
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
}
