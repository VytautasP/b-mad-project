using System.Text.RegularExpressions;
using Microsoft.Extensions.Logging;
using TaskFlow.Abstractions.Constants;
using TaskFlow.Abstractions.DTOs.Comments;
using TaskFlow.Abstractions.Entities;
using TaskFlow.Abstractions.Exceptions;
using TaskFlow.Abstractions.Interfaces;
using TaskFlow.Abstractions.Interfaces.Services;

namespace TaskFlow.Core.Services;

/// <summary>
/// Service implementation for comment operations including @mention parsing.
/// </summary>
public partial class CommentService : ICommentService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IActivityLogService _activityLogService;
    private readonly ILogger<CommentService> _logger;

    // Regex for extracting @mentions: matches @username, @user.name, @user@example.com
    [GeneratedRegex(@"(?<!\w)@([\w][\w.]*[\w]+@[\w]+\.[\w.]+|[\w][\w.]*[\w]+|[\w]+)", RegexOptions.Compiled)]
    private static partial Regex MentionRegex();

    public CommentService(IUnitOfWork unitOfWork, IActivityLogService activityLogService, ILogger<CommentService> logger)
    {
        _unitOfWork = unitOfWork;
        _activityLogService = activityLogService;
        _logger = logger;
    }

    /// <summary>
    /// Extracts @mention tokens from comment text.
    /// </summary>
    public static List<string> ExtractMentions(string text)
    {
        if (string.IsNullOrWhiteSpace(text))
            return new List<string>();

        var matches = MentionRegex().Matches(text);
        return matches
            .Select(m => m.Groups[1].Value)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();
    }

    public async System.Threading.Tasks.Task<CommentResponseDto> CreateCommentAsync(
        Guid taskId, Guid userId, CommentCreateDto dto, CancellationToken cancellationToken)
    {
        // Validate task exists
        var task = await _unitOfWork.Tasks.GetByIdAsync(taskId, cancellationToken);
        if (task == null)
        {
            throw new NotFoundException($"Task with ID {taskId} not found.");
        }

        // Parse @mentions from content and resolve to user IDs
        var mentionedUserIds = await ResolveMentionsAsync(dto.Content, cancellationToken);

        // Create Comment entity
        var comment = new Comment
        {
            Id = Guid.NewGuid(),
            TaskId = taskId,
            UserId = userId,
            Content = dto.Content,
            CreatedDate = DateTime.UtcNow,
            ModifiedDate = null,
            IsDeleted = false,
            MentionedUserIds = mentionedUserIds.Count > 0 ? mentionedUserIds : null
        };

        await _unitOfWork.Comments.CreateAsync(comment, cancellationToken);

        var user = await _unitOfWork.Users.GetByIdAsync(userId, cancellationToken);
        var actorName = user?.Name ?? "User";
        await _activityLogService.LogActivityAsync(
            taskId,
            userId,
            ActivityType.Commented,
            $"{actorName} added a comment",
            "Comment",
            null,
            dto.Content,
            cancellationToken);

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        // Fetch created comment with User included
        var createdComment = await _unitOfWork.Comments.GetByIdAsync(comment.Id, cancellationToken);

        _logger.LogInformation("User {UserId} created comment {CommentId} on task {TaskId}", userId, comment.Id, taskId);

        return MapToResponseDto(createdComment!);
    }

    public async System.Threading.Tasks.Task<CommentResponseDto> UpdateCommentAsync(
        Guid commentId, Guid requestingUserId, CommentUpdateDto dto, CancellationToken cancellationToken)
    {
        // Fetch comment by ID
        var comment = await _unitOfWork.Comments.GetByIdAsync(commentId, cancellationToken);
        if (comment == null)
        {
            throw new NotFoundException($"Comment with ID {commentId} not found.");
        }

        // Authorization: only author can edit
        if (comment.UserId != requestingUserId)
        {
            throw new ForbiddenException("You can only edit your own comments.");
        }

        // Update content and set ModifiedDate
        comment.Content = dto.Content;
        comment.ModifiedDate = DateTime.UtcNow;

        // Re-parse mentions from updated content
        var mentionedUserIds = await ResolveMentionsAsync(dto.Content, cancellationToken);
        comment.MentionedUserIds = mentionedUserIds.Count > 0 ? mentionedUserIds : null;

        await _unitOfWork.Comments.UpdateAsync(comment, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("User {UserId} updated comment {CommentId}", requestingUserId, commentId);

        return MapToResponseDto(comment);
    }

    public async System.Threading.Tasks.Task DeleteCommentAsync(
        Guid commentId, Guid requestingUserId, CancellationToken cancellationToken)
    {
        // Fetch comment by ID
        var comment = await _unitOfWork.Comments.GetByIdAsync(commentId, cancellationToken);
        if (comment == null)
        {
            throw new NotFoundException($"Comment with ID {commentId} not found.");
        }

        // Authorization: only author can delete
        if (comment.UserId != requestingUserId)
        {
            throw new ForbiddenException("You can only delete your own comments.");
        }

        // Soft delete
        comment.IsDeleted = true;
        await _unitOfWork.Comments.UpdateAsync(comment, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("User {UserId} soft-deleted comment {CommentId}", requestingUserId, commentId);
    }

    public async System.Threading.Tasks.Task<List<CommentResponseDto>> GetTaskCommentsAsync(
        Guid taskId, CancellationToken cancellationToken)
    {
        // Validate task exists
        var task = await _unitOfWork.Tasks.GetByIdAsync(taskId, cancellationToken);
        if (task == null)
        {
            throw new NotFoundException($"Task with ID {taskId} not found.");
        }

        var comments = await _unitOfWork.Comments.GetByTaskIdAsync(taskId, cancellationToken);
        return comments.Select(MapToResponseDto).ToList();
    }

    /// <summary>
    /// Extracts @mentions from text and resolves them to valid user IDs.
    /// Invalid mentions are silently ignored.
    /// </summary>
    private async System.Threading.Tasks.Task<List<Guid>> ResolveMentionsAsync(
        string content, CancellationToken cancellationToken)
    {
        var mentionTokens = ExtractMentions(content);
        if (mentionTokens.Count == 0)
            return new List<Guid>();

        var resolvedUserIds = new List<Guid>();

        foreach (var mention in mentionTokens)
        {
            // Try to find user by name or email (case-insensitive)
            var user = await _unitOfWork.Users.GetByEmailAsync(mention, cancellationToken);
            if (user != null)
            {
                resolvedUserIds.Add(user.Id);
                continue;
            }

            // Search by name
            var usersByName = await _unitOfWork.Users.SearchUsersAsync(mention, 1, cancellationToken);
            var exactMatch = usersByName.FirstOrDefault(u =>
                u.Name.Equals(mention, StringComparison.OrdinalIgnoreCase));
            if (exactMatch != null)
            {
                resolvedUserIds.Add(exactMatch.Id);
            }
        }

        return resolvedUserIds.Distinct().ToList();
    }

    private static CommentResponseDto MapToResponseDto(Comment comment)
    {
        return new CommentResponseDto
        {
            Id = comment.Id,
            TaskId = comment.TaskId,
            UserId = comment.UserId,
            AuthorName = comment.User?.Name ?? string.Empty,
            AuthorProfileImageUrl = comment.User?.ProfileImageUrl,
            Content = comment.Content,
            CreatedDate = comment.CreatedDate,
            ModifiedDate = comment.ModifiedDate,
            IsEdited = comment.ModifiedDate != null,
            IsDeleted = comment.IsDeleted,
            MentionedUserIds = comment.MentionedUserIds ?? new List<Guid>()
        };
    }
}