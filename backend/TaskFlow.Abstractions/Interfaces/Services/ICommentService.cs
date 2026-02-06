using TaskFlow.Abstractions.DTOs.Comments;

namespace TaskFlow.Abstractions.Interfaces.Services;

/// <summary>
/// Service interface for comment operations.
/// </summary>
public interface ICommentService
{
    /// <summary>
    /// Creates a new comment on a task.
    /// </summary>
    System.Threading.Tasks.Task<CommentResponseDto> CreateCommentAsync(Guid taskId, Guid userId, CommentCreateDto dto, CancellationToken cancellationToken);

    /// <summary>
    /// Updates a comment (author only).
    /// </summary>
    System.Threading.Tasks.Task<CommentResponseDto> UpdateCommentAsync(Guid commentId, Guid requestingUserId, CommentUpdateDto dto, CancellationToken cancellationToken);

    /// <summary>
    /// Soft-deletes a comment (author only).
    /// </summary>
    System.Threading.Tasks.Task DeleteCommentAsync(Guid commentId, Guid requestingUserId, CancellationToken cancellationToken);

    /// <summary>
    /// Retrieves all comments for a task, sorted by CreatedDate ascending.
    /// </summary>
    System.Threading.Tasks.Task<List<CommentResponseDto>> GetTaskCommentsAsync(Guid taskId, CancellationToken cancellationToken);
}