using Microsoft.Extensions.Logging;
using Moq;
using TaskFlow.Abstractions.DTOs.Comments;
using TaskFlow.Abstractions.Entities;
using TaskFlow.Abstractions.Exceptions;
using TaskFlow.Abstractions.Interfaces;
using TaskFlow.Abstractions.Interfaces.Repositories;
using TaskFlow.Core.Services;
using TaskEntity = TaskFlow.Abstractions.Entities.Task;

namespace TaskFlow.Tests.Unit.Services;

public class CommentServiceTests
{
    private readonly Mock<IUnitOfWork> _mockUnitOfWork;
    private readonly Mock<ICommentRepository> _mockCommentRepository;
    private readonly Mock<ITaskRepository> _mockTaskRepository;
    private readonly Mock<IUserRepository> _mockUserRepository;
    private readonly Mock<ILogger<CommentService>> _mockLogger;
    private readonly CommentService _service;
    private readonly Guid _testUserId = Guid.NewGuid();
    private readonly Guid _testTaskId = Guid.NewGuid();

    public CommentServiceTests()
    {
        _mockUnitOfWork = new Mock<IUnitOfWork>();
        _mockCommentRepository = new Mock<ICommentRepository>();
        _mockTaskRepository = new Mock<ITaskRepository>();
        _mockUserRepository = new Mock<IUserRepository>();
        _mockLogger = new Mock<ILogger<CommentService>>();

        _mockUnitOfWork.Setup(u => u.Comments).Returns(_mockCommentRepository.Object);
        _mockUnitOfWork.Setup(u => u.Tasks).Returns(_mockTaskRepository.Object);
        _mockUnitOfWork.Setup(u => u.Users).Returns(_mockUserRepository.Object);

        _service = new CommentService(_mockUnitOfWork.Object, _mockLogger.Object);
    }

    #region Mention Parsing Tests (Task 9)

    [Fact]
    public void ExtractMentions_SingleMention_ReturnsOneToken()
    {
        // Arrange & Act
        var result = CommentService.ExtractMentions("Hey @sarah check this");

        // Assert
        Assert.Single(result);
        Assert.Contains("sarah", result);
    }

    [Fact]
    public void ExtractMentions_MultipleMentions_ReturnsAllTokens()
    {
        // Arrange & Act
        var result = CommentService.ExtractMentions("@sarah and @marcus please review");

        // Assert
        Assert.Equal(2, result.Count);
        Assert.Contains("sarah", result);
        Assert.Contains("marcus", result);
    }

    [Fact]
    public void ExtractMentions_EmailMention_ReturnsEmail()
    {
        // Arrange & Act
        var result = CommentService.ExtractMentions("cc @sarah@example.com");

        // Assert
        Assert.Single(result);
        Assert.Contains("sarah@example.com", result);
    }

    [Fact]
    public void ExtractMentions_NoMentions_ReturnsEmptyList()
    {
        // Arrange & Act
        var result = CommentService.ExtractMentions("Just a regular comment");

        // Assert
        Assert.Empty(result);
    }

    [Fact]
    public void ExtractMentions_MentionAtStart_ReturnsToken()
    {
        // Arrange & Act
        var result = CommentService.ExtractMentions("@john please fix");

        // Assert
        Assert.Single(result);
        Assert.Contains("john", result);
    }

    [Fact]
    public void ExtractMentions_MentionAtEnd_ReturnsToken()
    {
        // Arrange & Act
        var result = CommentService.ExtractMentions("please fix @john");

        // Assert
        Assert.Single(result);
        Assert.Contains("john", result);
    }

    [Fact]
    public void ExtractMentions_DuplicateMentions_ReturnsDeduplicatedList()
    {
        // Arrange & Act
        var result = CommentService.ExtractMentions("@sarah and @sarah again");

        // Assert
        Assert.Single(result);
        Assert.Contains("sarah", result);
    }

    [Fact]
    public void ExtractMentions_EmptyString_ReturnsEmptyList()
    {
        // Arrange & Act
        var result = CommentService.ExtractMentions("");

        // Assert
        Assert.Empty(result);
    }

    [Fact]
    public void ExtractMentions_NullString_ReturnsEmptyList()
    {
        // Arrange & Act
        var result = CommentService.ExtractMentions(null!);

        // Assert
        Assert.Empty(result);
    }

    [Fact]
    public void ExtractMentions_AtSignAlone_ReturnsEmptyList()
    {
        // Arrange & Act
        var result = CommentService.ExtractMentions("@ not a mention");

        // Assert
        Assert.Empty(result);
    }

    [Fact]
    public async System.Threading.Tasks.Task CreateCommentAsync_ValidMention_ResolvesUserIdInMentionedUserIds()
    {
        // Arrange
        var mentionedUser = new User { Id = Guid.NewGuid(), Name = "sarah", Email = "sarah@example.com" };
        var task = new TaskEntity { Id = _testTaskId, Name = "Test Task", CreatedByUserId = _testUserId };
        var dto = new CommentCreateDto { Content = "Hey @sarah check this" };

        _mockTaskRepository.Setup(r => r.GetByIdAsync(_testTaskId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(task);

        _mockUserRepository.Setup(r => r.GetByEmailAsync("sarah", It.IsAny<CancellationToken>()))
            .ReturnsAsync((User?)null);

        _mockUserRepository.Setup(r => r.SearchUsersAsync("sarah", 1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<User> { mentionedUser });

        _mockCommentRepository.Setup(r => r.CreateAsync(It.IsAny<Comment>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((Comment c, CancellationToken ct) => c);

        _mockCommentRepository.Setup(r => r.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((Guid id, CancellationToken ct) => new Comment
            {
                Id = id,
                TaskId = _testTaskId,
                UserId = _testUserId,
                Content = dto.Content,
                CreatedDate = DateTime.UtcNow,
                MentionedUserIds = new List<Guid> { mentionedUser.Id },
                User = new User { Id = _testUserId, Name = "Test User", Email = "test@example.com" }
            });

        _mockUnitOfWork.Setup(u => u.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);

        // Act
        var result = await _service.CreateCommentAsync(_testTaskId, _testUserId, dto, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Contains(mentionedUser.Id, result.MentionedUserIds);
    }

    [Fact]
    public async System.Threading.Tasks.Task CreateCommentAsync_UnknownMention_SilentlyExcluded()
    {
        // Arrange
        var task = new TaskEntity { Id = _testTaskId, Name = "Test Task", CreatedByUserId = _testUserId };
        var dto = new CommentCreateDto { Content = "Hey @unknownuser check this" };

        _mockTaskRepository.Setup(r => r.GetByIdAsync(_testTaskId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(task);

        _mockUserRepository.Setup(r => r.GetByEmailAsync("unknownuser", It.IsAny<CancellationToken>()))
            .ReturnsAsync((User?)null);

        _mockUserRepository.Setup(r => r.SearchUsersAsync("unknownuser", 1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<User>());

        _mockCommentRepository.Setup(r => r.CreateAsync(It.IsAny<Comment>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((Comment c, CancellationToken ct) => c);

        _mockCommentRepository.Setup(r => r.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((Guid id, CancellationToken ct) => new Comment
            {
                Id = id,
                TaskId = _testTaskId,
                UserId = _testUserId,
                Content = dto.Content,
                CreatedDate = DateTime.UtcNow,
                MentionedUserIds = null,
                User = new User { Id = _testUserId, Name = "Test User", Email = "test@example.com" }
            });

        _mockUnitOfWork.Setup(u => u.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);

        // Act
        var result = await _service.CreateCommentAsync(_testTaskId, _testUserId, dto, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Empty(result.MentionedUserIds);
    }

    #endregion

    #region Create Comment Tests (Task 10)

    [Fact]
    public async System.Threading.Tasks.Task CreateCommentAsync_ValidInput_ReturnsCommentResponseDto()
    {
        // Arrange
        var task = new TaskEntity { Id = _testTaskId, Name = "Test Task", CreatedByUserId = _testUserId };
        var dto = new CommentCreateDto { Content = "This is a test comment" };

        _mockTaskRepository.Setup(r => r.GetByIdAsync(_testTaskId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(task);

        _mockCommentRepository.Setup(r => r.CreateAsync(It.IsAny<Comment>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((Comment c, CancellationToken ct) => c);

        _mockCommentRepository.Setup(r => r.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((Guid id, CancellationToken ct) => new Comment
            {
                Id = id,
                TaskId = _testTaskId,
                UserId = _testUserId,
                Content = dto.Content,
                CreatedDate = DateTime.UtcNow,
                User = new User { Id = _testUserId, Name = "Test User", Email = "test@example.com" }
            });

        _mockUnitOfWork.Setup(u => u.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);

        // Act
        var result = await _service.CreateCommentAsync(_testTaskId, _testUserId, dto, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(_testTaskId, result.TaskId);
        Assert.Equal(_testUserId, result.UserId);
        Assert.Equal("This is a test comment", result.Content);
        Assert.Equal("Test User", result.AuthorName);
        Assert.False(result.IsEdited);
        _mockUnitOfWork.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async System.Threading.Tasks.Task CreateCommentAsync_TaskNotFound_ThrowsNotFoundException()
    {
        // Arrange
        var dto = new CommentCreateDto { Content = "Test comment" };
        _mockTaskRepository.Setup(r => r.GetByIdAsync(_testTaskId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((TaskEntity?)null);

        // Act & Assert
        await Assert.ThrowsAsync<NotFoundException>(() =>
            _service.CreateCommentAsync(_testTaskId, _testUserId, dto, CancellationToken.None));
    }

    #endregion

    #region Update Comment Tests (Task 10)

    [Fact]
    public async System.Threading.Tasks.Task UpdateCommentAsync_ByAuthor_ReturnsUpdatedComment()
    {
        // Arrange
        var commentId = Guid.NewGuid();
        var comment = new Comment
        {
            Id = commentId,
            TaskId = _testTaskId,
            UserId = _testUserId,
            Content = "Original content",
            CreatedDate = DateTime.UtcNow.AddHours(-1),
            User = new User { Id = _testUserId, Name = "Test User", Email = "test@example.com" }
        };

        var dto = new CommentUpdateDto { Content = "Updated content" };

        _mockCommentRepository.Setup(r => r.GetByIdAsync(commentId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(comment);

        _mockCommentRepository.Setup(r => r.UpdateAsync(It.IsAny<Comment>(), It.IsAny<CancellationToken>()))
            .Returns(System.Threading.Tasks.Task.CompletedTask);

        _mockUnitOfWork.Setup(u => u.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);

        // Act
        var result = await _service.UpdateCommentAsync(commentId, _testUserId, dto, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("Updated content", result.Content);
        Assert.True(result.IsEdited);
        Assert.NotNull(result.ModifiedDate);
    }

    [Fact]
    public async System.Threading.Tasks.Task UpdateCommentAsync_ByNonAuthor_ThrowsForbiddenException()
    {
        // Arrange
        var commentId = Guid.NewGuid();
        var differentUserId = Guid.NewGuid();
        var comment = new Comment
        {
            Id = commentId,
            TaskId = _testTaskId,
            UserId = differentUserId,
            Content = "Original content",
            CreatedDate = DateTime.UtcNow,
            User = new User { Id = differentUserId, Name = "Other User", Email = "other@example.com" }
        };

        var dto = new CommentUpdateDto { Content = "Updated content" };

        _mockCommentRepository.Setup(r => r.GetByIdAsync(commentId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(comment);

        // Act & Assert
        await Assert.ThrowsAsync<ForbiddenException>(() =>
            _service.UpdateCommentAsync(commentId, _testUserId, dto, CancellationToken.None));

        _mockCommentRepository.Verify(r => r.UpdateAsync(It.IsAny<Comment>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async System.Threading.Tasks.Task UpdateCommentAsync_CommentNotFound_ThrowsNotFoundException()
    {
        // Arrange
        var commentId = Guid.NewGuid();
        var dto = new CommentUpdateDto { Content = "Updated content" };

        _mockCommentRepository.Setup(r => r.GetByIdAsync(commentId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((Comment?)null);

        // Act & Assert
        await Assert.ThrowsAsync<NotFoundException>(() =>
            _service.UpdateCommentAsync(commentId, _testUserId, dto, CancellationToken.None));
    }

    [Fact]
    public async System.Threading.Tasks.Task UpdateCommentAsync_SetsModifiedDate_IsEditedBecomesTrue()
    {
        // Arrange
        var commentId = Guid.NewGuid();
        var comment = new Comment
        {
            Id = commentId,
            TaskId = _testTaskId,
            UserId = _testUserId,
            Content = "Original",
            CreatedDate = DateTime.UtcNow.AddHours(-1),
            ModifiedDate = null,
            User = new User { Id = _testUserId, Name = "Test User", Email = "test@example.com" }
        };

        var dto = new CommentUpdateDto { Content = "Edited" };

        _mockCommentRepository.Setup(r => r.GetByIdAsync(commentId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(comment);

        _mockCommentRepository.Setup(r => r.UpdateAsync(It.IsAny<Comment>(), It.IsAny<CancellationToken>()))
            .Returns(System.Threading.Tasks.Task.CompletedTask);

        _mockUnitOfWork.Setup(u => u.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);

        // Act
        var result = await _service.UpdateCommentAsync(commentId, _testUserId, dto, CancellationToken.None);

        // Assert
        Assert.True(result.IsEdited);
        Assert.NotNull(result.ModifiedDate);
    }

    #endregion

    #region Delete Comment Tests (Task 10)

    [Fact]
    public async System.Threading.Tasks.Task DeleteCommentAsync_ByAuthor_SoftDeletesComment()
    {
        // Arrange
        var commentId = Guid.NewGuid();
        var comment = new Comment
        {
            Id = commentId,
            TaskId = _testTaskId,
            UserId = _testUserId,
            Content = "To be deleted",
            CreatedDate = DateTime.UtcNow,
            IsDeleted = false,
            User = new User { Id = _testUserId, Name = "Test User", Email = "test@example.com" }
        };

        _mockCommentRepository.Setup(r => r.GetByIdAsync(commentId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(comment);

        _mockCommentRepository.Setup(r => r.UpdateAsync(It.IsAny<Comment>(), It.IsAny<CancellationToken>()))
            .Returns(System.Threading.Tasks.Task.CompletedTask);

        _mockUnitOfWork.Setup(u => u.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);

        // Act
        await _service.DeleteCommentAsync(commentId, _testUserId, CancellationToken.None);

        // Assert
        Assert.True(comment.IsDeleted);
        _mockCommentRepository.Verify(r => r.UpdateAsync(comment, It.IsAny<CancellationToken>()), Times.Once);
        _mockUnitOfWork.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async System.Threading.Tasks.Task DeleteCommentAsync_ByNonAuthor_ThrowsForbiddenException()
    {
        // Arrange
        var commentId = Guid.NewGuid();
        var differentUserId = Guid.NewGuid();
        var comment = new Comment
        {
            Id = commentId,
            TaskId = _testTaskId,
            UserId = differentUserId,
            Content = "Someone else's comment",
            CreatedDate = DateTime.UtcNow,
            User = new User { Id = differentUserId, Name = "Other User", Email = "other@example.com" }
        };

        _mockCommentRepository.Setup(r => r.GetByIdAsync(commentId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(comment);

        // Act & Assert
        await Assert.ThrowsAsync<ForbiddenException>(() =>
            _service.DeleteCommentAsync(commentId, _testUserId, CancellationToken.None));

        Assert.False(comment.IsDeleted);
    }

    [Fact]
    public async System.Threading.Tasks.Task DeleteCommentAsync_CommentNotFound_ThrowsNotFoundException()
    {
        // Arrange
        var commentId = Guid.NewGuid();

        _mockCommentRepository.Setup(r => r.GetByIdAsync(commentId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((Comment?)null);

        // Act & Assert
        await Assert.ThrowsAsync<NotFoundException>(() =>
            _service.DeleteCommentAsync(commentId, _testUserId, CancellationToken.None));
    }

    #endregion

    #region Get Task Comments Tests (Task 10)

    [Fact]
    public async System.Threading.Tasks.Task GetTaskCommentsAsync_ReturnsCommentsSortedByCreatedDateAsc()
    {
        // Arrange
        var task = new TaskEntity { Id = _testTaskId, Name = "Test Task", CreatedByUserId = _testUserId };
        var user = new User { Id = _testUserId, Name = "Test User", Email = "test@example.com" };

        var comments = new List<Comment>
        {
            new Comment
            {
                Id = Guid.NewGuid(), TaskId = _testTaskId, UserId = _testUserId,
                Content = "First", CreatedDate = DateTime.UtcNow.AddHours(-2), User = user
            },
            new Comment
            {
                Id = Guid.NewGuid(), TaskId = _testTaskId, UserId = _testUserId,
                Content = "Second", CreatedDate = DateTime.UtcNow.AddHours(-1), User = user
            },
            new Comment
            {
                Id = Guid.NewGuid(), TaskId = _testTaskId, UserId = _testUserId,
                Content = "Third", CreatedDate = DateTime.UtcNow, User = user
            }
        };

        _mockTaskRepository.Setup(r => r.GetByIdAsync(_testTaskId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(task);

        _mockCommentRepository.Setup(r => r.GetByTaskIdAsync(_testTaskId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(comments);

        // Act
        var result = await _service.GetTaskCommentsAsync(_testTaskId, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(3, result.Count);
        Assert.Equal("First", result[0].Content);
        Assert.Equal("Second", result[1].Content);
        Assert.Equal("Third", result[2].Content);
    }

    [Fact]
    public async System.Threading.Tasks.Task GetTaskCommentsAsync_TaskNotFound_ThrowsNotFoundException()
    {
        // Arrange
        _mockTaskRepository.Setup(r => r.GetByIdAsync(_testTaskId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((TaskEntity?)null);

        // Act & Assert
        await Assert.ThrowsAsync<NotFoundException>(() =>
            _service.GetTaskCommentsAsync(_testTaskId, CancellationToken.None));
    }

    [Fact]
    public async System.Threading.Tasks.Task GetTaskCommentsAsync_NoComments_ReturnsEmptyList()
    {
        // Arrange
        var task = new TaskEntity { Id = _testTaskId, Name = "Test Task", CreatedByUserId = _testUserId };

        _mockTaskRepository.Setup(r => r.GetByIdAsync(_testTaskId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(task);

        _mockCommentRepository.Setup(r => r.GetByTaskIdAsync(_testTaskId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<Comment>());

        // Act
        var result = await _service.GetTaskCommentsAsync(_testTaskId, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Empty(result);
    }

    #endregion
}