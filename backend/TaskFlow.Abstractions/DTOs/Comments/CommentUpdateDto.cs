using System.ComponentModel.DataAnnotations;

namespace TaskFlow.Abstractions.DTOs.Comments;

/// <summary>
/// Data transfer object for updating a comment.
/// </summary>
public class CommentUpdateDto
{
    /// <summary>
    /// Updated comment text content (max 2000 characters).
    /// </summary>
    [Required(ErrorMessage = "Content is required.")]
    [MaxLength(2000, ErrorMessage = "Content cannot exceed 2000 characters.")]
    public string Content { get; set; } = string.Empty;
}