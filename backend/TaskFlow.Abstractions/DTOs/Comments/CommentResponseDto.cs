namespace TaskFlow.Abstractions.DTOs.Comments;

/// <summary>
/// Data transfer object for comment responses.
/// </summary>
public class CommentResponseDto
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
    /// Foreign key to the comment author.
    /// </summary>
    public Guid UserId { get; set; }

    /// <summary>
    /// Display name of the comment author.
    /// </summary>
    public string AuthorName { get; set; } = string.Empty;

    /// <summary>
    /// Profile image URL of the comment author (nullable).
    /// </summary>
    public string? AuthorProfileImageUrl { get; set; }

    /// <summary>
    /// Comment text content.
    /// </summary>
    public string Content { get; set; } = string.Empty;

    /// <summary>
    /// Date and time when the comment was created (UTC).
    /// </summary>
    public DateTime CreatedDate { get; set; }

    /// <summary>
    /// Date and time when the comment was last modified (UTC). Null if never edited.
    /// </summary>
    public DateTime? ModifiedDate { get; set; }

    /// <summary>
    /// Whether the comment has been edited (derived from ModifiedDate != null).
    /// </summary>
    public bool IsEdited { get; set; }

    /// <summary>
    /// Whether the comment is soft-deleted.
    /// </summary>
    public bool IsDeleted { get; set; }

    /// <summary>
    /// User IDs of users mentioned in the comment content.
    /// </summary>
    public List<Guid> MentionedUserIds { get; set; } = new();
}