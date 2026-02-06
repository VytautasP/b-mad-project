namespace TaskFlow.Abstractions.Entities;

/// <summary>
/// Represents a comment on a task with optional @mention support.
/// </summary>
public class Comment
{
    /// <summary>
    /// Unique identifier for the comment.
    /// </summary>
    public Guid Id { get; set; }

    /// <summary>
    /// Foreign key to the task this comment belongs to.
    /// </summary>
    public Guid TaskId { get; set; }

    /// <summary>
    /// Foreign key to the user who authored the comment.
    /// </summary>
    public Guid UserId { get; set; }

    /// <summary>
    /// Comment text content with potential @mentions (max 2000 chars).
    /// </summary>
    public string Content { get; set; } = string.Empty;

    /// <summary>
    /// Date and time when the comment was created (UTC).
    /// </summary>
    public DateTime CreatedDate { get; set; }

    /// <summary>
    /// Date and time when the comment was last modified (UTC). Null means never edited.
    /// </summary>
    public DateTime? ModifiedDate { get; set; }

    /// <summary>
    /// Soft delete flag. True means the comment is logically deleted.
    /// </summary>
    public bool IsDeleted { get; set; }

    /// <summary>
    /// Extracted user IDs from @mentions in the comment content, stored as JSONB.
    /// </summary>
    public List<Guid>? MentionedUserIds { get; set; }

    // Navigation properties

    /// <summary>
    /// The task this comment belongs to.
    /// </summary>
    public Task Task { get; set; } = null!;

    /// <summary>
    /// The user who authored this comment.
    /// </summary>
    public User User { get; set; } = null!;
}