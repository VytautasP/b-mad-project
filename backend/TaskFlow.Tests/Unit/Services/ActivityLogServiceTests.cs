using Microsoft.Extensions.Logging;
using Moq;
using TaskFlow.Abstractions.Constants;
using TaskFlow.Abstractions.DTOs.ActivityLogs;
using TaskFlow.Abstractions.Entities;
using TaskFlow.Abstractions.Exceptions;
using TaskFlow.Abstractions.Interfaces;
using TaskFlow.Abstractions.Interfaces.Repositories;
using TaskFlow.Core.Services;

namespace TaskFlow.Tests.Unit.Services;

public class ActivityLogServiceTests
{
    private readonly Mock<IUnitOfWork> _mockUnitOfWork;
    private readonly Mock<IActivityLogRepository> _mockActivityLogRepository;
    private readonly Mock<ITaskRepository> _mockTaskRepository;
    private readonly Mock<ILogger<ActivityLogService>> _mockLogger;
    private readonly ActivityLogService _service;

    public ActivityLogServiceTests()
    {
        _mockUnitOfWork = new Mock<IUnitOfWork>();
        _mockActivityLogRepository = new Mock<IActivityLogRepository>();
        _mockTaskRepository = new Mock<ITaskRepository>();
        _mockLogger = new Mock<ILogger<ActivityLogService>>();

        _mockUnitOfWork.Setup(u => u.ActivityLogs).Returns(_mockActivityLogRepository.Object);
        _mockUnitOfWork.Setup(u => u.Tasks).Returns(_mockTaskRepository.Object);

        _service = new ActivityLogService(_mockUnitOfWork.Object, _mockLogger.Object);
    }

    [Fact]
    public async System.Threading.Tasks.Task LogActivityAsync_CreatesActivityLog()
    {
        // Arrange
        var taskId = Guid.NewGuid();
        var userId = Guid.NewGuid();

        _mockActivityLogRepository
            .Setup(r => r.CreateAsync(It.IsAny<ActivityLog>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((ActivityLog log, CancellationToken _) => log);

        // Act
        await _service.LogActivityAsync(
            taskId,
            userId,
            ActivityType.Updated,
            "User updated task",
            "Status",
            "ToDo",
            "Done",
            CancellationToken.None);

        // Assert
        _mockActivityLogRepository.Verify(
            r => r.CreateAsync(
                It.Is<ActivityLog>(log =>
                    log.TaskId == taskId
                    && log.UserId == userId
                    && log.ActivityType == ActivityType.Updated
                    && log.Description == "User updated task"
                    && log.ChangedField == "Status"
                    && log.OldValue == "ToDo"
                    && log.NewValue == "Done"),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async System.Threading.Tasks.Task GetTaskActivityAsync_ReturnsPaginatedResult_WhenUserOwnsTask()
    {
        // Arrange
        var taskId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        var query = new ActivityLogQueryDto { Page = 1, PageSize = 2 };

        var logs = new List<ActivityLog>
        {
            new()
            {
                Id = Guid.NewGuid(),
                TaskId = taskId,
                UserId = userId,
                ActivityType = ActivityType.StatusChanged,
                Description = "Alice changed status from InProgress to Done",
                Timestamp = DateTime.UtcNow,
                User = new User { Id = userId, Name = "Alice", Email = "alice@example.com", PasswordHash = "hash" }
            },
            new()
            {
                Id = Guid.NewGuid(),
                TaskId = taskId,
                UserId = userId,
                ActivityType = ActivityType.Commented,
                Description = "Alice added a comment",
                Timestamp = DateTime.UtcNow.AddMinutes(-1),
                User = new User { Id = userId, Name = "Alice", Email = "alice@example.com", PasswordHash = "hash" }
            }
        };

        _mockTaskRepository
            .Setup(r => r.GetByIdAsync(taskId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new TaskFlow.Abstractions.Entities.Task { Id = taskId, CreatedByUserId = userId, Name = "Task" });

        _mockTaskRepository
            .Setup(r => r.UserOwnsTaskAsync(taskId, userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        _mockActivityLogRepository
            .Setup(r => r.GetByTaskIdPagedAsync(taskId, 1, 2, It.IsAny<CancellationToken>()))
            .ReturnsAsync((logs, 5));

        // Act
        var result = await _service.GetTaskActivityAsync(taskId, userId, query, CancellationToken.None);

        // Assert
        Assert.Equal(2, result.Items.Count);
        Assert.Equal(5, result.TotalCount);
        Assert.Equal(3, result.TotalPages);
        Assert.All(result.Items, item => Assert.Equal("Alice", item.UserName));
    }

    [Fact]
    public async System.Threading.Tasks.Task GetTaskActivityAsync_ThrowsUnauthorized_WhenUserDoesNotOwnTask()
    {
        // Arrange
        var taskId = Guid.NewGuid();
        var userId = Guid.NewGuid();

        _mockTaskRepository
            .Setup(r => r.GetByIdAsync(taskId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new TaskFlow.Abstractions.Entities.Task { Id = taskId, CreatedByUserId = Guid.NewGuid(), Name = "Task" });

        _mockTaskRepository
            .Setup(r => r.UserOwnsTaskAsync(taskId, userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        // Act & Assert
        await Assert.ThrowsAsync<UnauthorizedException>(() =>
            _service.GetTaskActivityAsync(taskId, userId, new ActivityLogQueryDto(), CancellationToken.None));
    }
}
