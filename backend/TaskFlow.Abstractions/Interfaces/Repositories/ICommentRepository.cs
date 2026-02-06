using TaskFlow.Abstractions.Entities;

namespace TaskFlow.Abstractions.Interfaces.Repositories;

/// <summary>
/// Repository interface for Comment entity operations.
/// </summary>
public interface ICommentRepository
{
    /// <summary>
    /// Creates a new comment.
    /// </summary>
    System.Threading.Tasks.Task<Comment> CreateAsync(Comment comment, CancellationToken cancellationToken);

    /// <summary>
    /// Retrieves a comment by its ID, including the User navigation property.
    /// </summary>
    System.Threading.Tasks.Task<Comment?> GetByIdAsync(Guid id, CancellationToken cancellationToken);

    /// <summary>
    /// Retrieves all comments for a specific task, sorted by CreatedDate ascending.
    /// Includes User navigation property. Uses AsNoTracking.
    /// </summary>
    System.Threading.Tasks.Task<List<Comment>> GetByTaskIdAsync(Guid taskId, CancellationToken cancellationToken);

    /// <summary>
    /// Updates a comment (entity must be tracked by EF Core change tracker).
    /// </summary>
    System.Threading.Tasks.Task UpdateAsync(Comment comment, CancellationToken cancellationToken);
}