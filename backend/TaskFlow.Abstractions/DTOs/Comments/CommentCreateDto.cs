using System.ComponentModel.DataAnnotations;

namespace TaskFlow.Abstractions.DTOs.Comments;

/// <summary>
/// Data transfer object for creating a comment.
/// </summary>
public class CommentCreateDto
{
    /// <summary>
    /// Comment text content (max 2000 characters). May contain @mentions.
    /// </summary>
    [Required(ErrorMessage = "Content is required.")]
    [MaxLength(2000, ErrorMessage = "Content cannot exceed 2000 characters.")]
    public string Content { get; set; } = string.Empty;

    /// <summary>
    /// Optional list of mentioned user IDs. If not provided, backend will parse @mentions from content.
    /// </summary>
    public List<Guid>? MentionedUserIds { get; set; }
}