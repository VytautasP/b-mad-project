using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TaskFlow.Abstractions.DTOs.Comments;
using TaskFlow.Abstractions.Interfaces.Services;

namespace TaskFlow.Api.Controllers;

/// <summary>
/// Controller for comment operations on tasks.
/// </summary>
[ApiController]
[Authorize]
[Route("api")]
public class CommentsController : ControllerBase
{
    private readonly ICommentService _commentService;
    private readonly ILogger<CommentsController> _logger;

    public CommentsController(ICommentService commentService, ILogger<CommentsController> logger)
    {
        _commentService = commentService;
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
    /// Creates a new comment on a task.
    /// </summary>
    [HttpPost("tasks/{taskId:guid}/comments")]
    [ProducesResponseType(typeof(CommentResponseDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> CreateComment(Guid taskId, [FromBody] CommentCreateDto dto, CancellationToken ct)
    {
        var userId = GetCurrentUserId();
        var result = await _commentService.CreateCommentAsync(taskId, userId, dto, ct);
        return CreatedAtAction(nameof(GetTaskComments), new { taskId }, result);
    }

    /// <summary>
    /// Retrieves all comments for a task, sorted chronologically.
    /// </summary>
    [HttpGet("tasks/{taskId:guid}/comments")]
    [ProducesResponseType(typeof(List<CommentResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetTaskComments(Guid taskId, CancellationToken ct)
    {
        var result = await _commentService.GetTaskCommentsAsync(taskId, ct);
        return Ok(result);
    }

    /// <summary>
    /// Updates a comment (author only).
    /// </summary>
    [HttpPut("comments/{id:guid}")]
    [ProducesResponseType(typeof(CommentResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateComment(Guid id, [FromBody] CommentUpdateDto dto, CancellationToken ct)
    {
        var userId = GetCurrentUserId();
        var result = await _commentService.UpdateCommentAsync(id, userId, dto, ct);
        return Ok(result);
    }

    /// <summary>
    /// Soft-deletes a comment (author only).
    /// </summary>
    [HttpDelete("comments/{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteComment(Guid id, CancellationToken ct)
    {
        var userId = GetCurrentUserId();
        await _commentService.DeleteCommentAsync(id, userId, ct);
        return NoContent();
    }
}