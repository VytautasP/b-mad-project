using Microsoft.Extensions.Logging;
using Moq;
using TaskFlow.Abstractions.DTOs.Task;
using TaskFlow.Abstractions.Entities;
using TaskFlow.Abstractions.Exceptions;
using TaskFlow.Abstractions.Interfaces;
using TaskFlow.Abstractions.Interfaces.Repositories;
using TaskFlow.Abstractions.Interfaces.Services;
using TaskFlow.Core.Services;
using TaskEntity = TaskFlow.Abstractions.Entities.Task;

namespace TaskFlow.Tests.Unit.Services;

public class TaskServiceAssignmentTests
{
    private readonly Mock<IUnitOfWork> _mockUnitOfWork;
    private readonly Mock<IActivityLogService> _mockActivityLogService;
    private readonly Mock<ITaskRepository> _mockTaskRepository;
    private readonly Mock<ITaskAssignmentRepository> _mockTaskAssignmentRepository;
    private readonly Mock<IUserRepository> _mockUserRepository;
    private readonly Mock<ILogger<TaskService>> _mockLogger;
    private readonly TaskService _taskService;
    private readonly Guid _testUserId = Guid.NewGuid();
    private readonly Guid _testTaskId = Guid.NewGuid();
    private readonly Guid _testTargetUserId = Guid.NewGuid();

    public TaskServiceAssignmentTests()
    {
        _mockUnitOfWork = new Mock<IUnitOfWork>();
        _mockActivityLogService = new Mock<IActivityLogService>();
        _mockTaskRepository = new Mock<ITaskRepository>();
        _mockTaskAssignmentRepository = new Mock<ITaskAssignmentRepository>();
        _mockUserRepository = new Mock<IUserRepository>();
        _mockLogger = new Mock<ILogger<TaskService>>();

        _mockUnitOfWork.Setup(u => u.Tasks).Returns(_mockTaskRepository.Object);
        _mockUnitOfWork.Setup(u => u.TaskAssignments).Returns(_mockTaskAssignmentRepository.Object);
        _mockUnitOfWork.Setup(u => u.Users).Returns(_mockUserRepository.Object);
        _mockUnitOfWork.Setup(u => u.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);
        _mockActivityLogService
            .Setup(s => s.LogActivityAsync(
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<TaskFlow.Abstractions.Constants.ActivityType>(),
                It.IsAny<string>(),
                It.IsAny<string?>(),
                It.IsAny<string?>(),
                It.IsAny<string?>(),
                It.IsAny<CancellationToken>()))
            .Returns(System.Threading.Tasks.Task.CompletedTask);

        _taskService = new TaskService(_mockUnitOfWork.Object, _mockActivityLogService.Object, _mockLogger.Object);
    }

    [Fact]
    public async System.Threading.Tasks.Task AssignUserAsync_WhenOwnerAssignsUser_Succeeds()
    {
        // Arrange
        var task = new TaskEntity { Id = _testTaskId, CreatedByUserId = _testUserId };
        var targetUser = new User { Id = _testTargetUserId, Name = "Target User", Email = "target@test.com" };

        _mockTaskRepository.Setup(r => r.GetByIdAsync(_testTaskId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(task);
        _mockTaskAssignmentRepository.Setup(r => r.IsUserAssignedToTaskAsync(_testTaskId, _testUserId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);
        _mockUserRepository.Setup(r => r.GetByIdAsync(_testTargetUserId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(targetUser);
        _mockTaskAssignmentRepository.Setup(r => r.GetAssignmentAsync(_testTaskId, _testTargetUserId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((TaskAssignment)null!);

        // Act
        await _taskService.AssignUserAsync(_testTaskId, _testTargetUserId, _testUserId);

        // Assert
        _mockTaskAssignmentRepository.Verify(r => r.AddAssignmentAsync(It.IsAny<TaskAssignment>(), It.IsAny<CancellationToken>()), Times.Once);
        _mockActivityLogService.Verify(s => s.LogActivityAsync(
            _testTaskId,
            _testUserId,
            TaskFlow.Abstractions.Constants.ActivityType.Assigned,
            It.IsAny<string>(),
            It.IsAny<string?>(),
            It.IsAny<string?>(),
            It.IsAny<string?>(),
            It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async System.Threading.Tasks.Task AssignUserAsync_WhenAssigneeAssignsUser_Succeeds()
    {
        // Arrange
        var task = new TaskEntity { Id = _testTaskId, CreatedByUserId = Guid.NewGuid() };
        var targetUser = new User { Id = _testTargetUserId, Name = "Target User", Email = "target@test.com" };

        _mockTaskRepository.Setup(r => r.GetByIdAsync(_testTaskId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(task);
        _mockTaskAssignmentRepository.Setup(r => r.IsUserAssignedToTaskAsync(_testTaskId, _testUserId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);
        _mockUserRepository.Setup(r => r.GetByIdAsync(_testTargetUserId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(targetUser);
        _mockTaskAssignmentRepository.Setup(r => r.GetAssignmentAsync(_testTaskId, _testTargetUserId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((TaskAssignment)null!);

        // Act
        await _taskService.AssignUserAsync(_testTaskId, _testTargetUserId, _testUserId);

        // Assert
        _mockTaskAssignmentRepository.Verify(r => r.AddAssignmentAsync(It.IsAny<TaskAssignment>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async System.Threading.Tasks.Task AssignUserAsync_WhenTaskNotFound_ThrowsNotFoundException()
    {
        // Arrange
        _mockTaskRepository.Setup(r => r.GetByIdAsync(_testTaskId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((TaskEntity)null!);

        // Act & Assert
        await Assert.ThrowsAsync<NotFoundException>(() => 
            _taskService.AssignUserAsync(_testTaskId, _testTargetUserId, _testUserId));
    }

    [Fact]
    public async System.Threading.Tasks.Task AssignUserAsync_WhenUserNotOwnerOrAssignee_ThrowsForbiddenException()
    {
        // Arrange
        var task = new TaskEntity { Id = _testTaskId, CreatedByUserId = Guid.NewGuid() };

        _mockTaskRepository.Setup(r => r.GetByIdAsync(_testTaskId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(task);
        _mockTaskAssignmentRepository.Setup(r => r.IsUserAssignedToTaskAsync(_testTaskId, _testUserId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        // Act & Assert
        await Assert.ThrowsAsync<ForbiddenException>(() => 
            _taskService.AssignUserAsync(_testTaskId, _testTargetUserId, _testUserId));
    }

    [Fact]
    public async System.Threading.Tasks.Task AssignUserAsync_WhenTargetUserNotFound_ThrowsNotFoundException()
    {
        // Arrange
        var task = new TaskEntity { Id = _testTaskId, CreatedByUserId = _testUserId };

        _mockTaskRepository.Setup(r => r.GetByIdAsync(_testTaskId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(task);
        _mockTaskAssignmentRepository.Setup(r => r.IsUserAssignedToTaskAsync(_testTaskId, _testUserId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);
        _mockUserRepository.Setup(r => r.GetByIdAsync(_testTargetUserId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((User)null!);

        // Act & Assert
        await Assert.ThrowsAsync<NotFoundException>(() => 
            _taskService.AssignUserAsync(_testTaskId, _testTargetUserId, _testUserId));
    }

    [Fact]
    public async System.Threading.Tasks.Task AssignUserAsync_WhenUserAlreadyAssigned_IsIdempotent()
    {
        // Arrange
        var task = new TaskEntity { Id = _testTaskId, CreatedByUserId = _testUserId };
        var targetUser = new User { Id = _testTargetUserId, Name = "Target User", Email = "target@test.com" };
        var existingAssignment = new TaskAssignment { TaskId = _testTaskId, UserId = _testTargetUserId };

        _mockTaskRepository.Setup(r => r.GetByIdAsync(_testTaskId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(task);
        _mockTaskAssignmentRepository.Setup(r => r.IsUserAssignedToTaskAsync(_testTaskId, _testUserId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);
        _mockUserRepository.Setup(r => r.GetByIdAsync(_testTargetUserId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(targetUser);
        _mockTaskAssignmentRepository.Setup(r => r.GetAssignmentAsync(_testTaskId, _testTargetUserId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(existingAssignment);

        // Act
        await _taskService.AssignUserAsync(_testTaskId, _testTargetUserId, _testUserId);

        // Assert
        _mockTaskAssignmentRepository.Verify(r => r.AddAssignmentAsync(It.IsAny<TaskAssignment>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async System.Threading.Tasks.Task UnassignUserAsync_WhenOwnerUnassigns_Succeeds()
    {
        // Arrange
        var task = new TaskEntity { Id = _testTaskId, CreatedByUserId = _testUserId };
        var assignment = new TaskAssignment { TaskId = _testTaskId, UserId = _testTargetUserId };

        _mockTaskRepository.Setup(r => r.GetByIdAsync(_testTaskId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(task);
        _mockTaskAssignmentRepository.Setup(r => r.IsUserAssignedToTaskAsync(_testTaskId, _testUserId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);
        _mockTaskAssignmentRepository.Setup(r => r.GetAssignmentAsync(_testTaskId, _testTargetUserId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(assignment);

        // Act
        await _taskService.UnassignUserAsync(_testTaskId, _testTargetUserId, _testUserId);

        // Assert
        _mockTaskAssignmentRepository.Verify(r => r.RemoveAssignmentAsync(assignment, It.IsAny<CancellationToken>()), Times.Once);
        _mockActivityLogService.Verify(s => s.LogActivityAsync(
            _testTaskId,
            _testUserId,
            TaskFlow.Abstractions.Constants.ActivityType.Unassigned,
            It.IsAny<string>(),
            It.IsAny<string?>(),
            It.IsAny<string?>(),
            It.IsAny<string?>(),
            It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async System.Threading.Tasks.Task UnassignUserAsync_WhenAssignmentNotFound_ThrowsNotFoundException()
    {
        // Arrange
        var task = new TaskEntity { Id = _testTaskId, CreatedByUserId = _testUserId };

        _mockTaskRepository.Setup(r => r.GetByIdAsync(_testTaskId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(task);
        _mockTaskAssignmentRepository.Setup(r => r.IsUserAssignedToTaskAsync(_testTaskId, _testUserId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);
        _mockTaskAssignmentRepository.Setup(r => r.GetAssignmentAsync(_testTaskId, _testTargetUserId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((TaskAssignment)null!);

        // Act & Assert
        await Assert.ThrowsAsync<NotFoundException>(() => 
            _taskService.UnassignUserAsync(_testTaskId, _testTargetUserId, _testUserId));
    }

    [Fact]
    public async System.Threading.Tasks.Task GetTaskAssigneesAsync_WhenOwner_ReturnsAssignees()
    {
        // Arrange
        var task = new TaskEntity { Id = _testTaskId, CreatedByUserId = _testUserId };
        var assignments = new List<TaskAssignment>
        {
            new TaskAssignment 
            { 
                TaskId = _testTaskId, 
                UserId = _testTargetUserId,
                AssignedDate = DateTime.UtcNow,
                AssignedByUserId = _testUserId,
                User = new User { Id = _testTargetUserId, Name = "Target User", Email = "target@test.com" },
                AssignedByUser = new User { Id = _testUserId, Name = "Test User", Email = "test@test.com" }
            }
        };

        _mockTaskRepository.Setup(r => r.GetByIdAsync(_testTaskId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(task);
        _mockTaskAssignmentRepository.Setup(r => r.IsUserAssignedToTaskAsync(_testTaskId, _testUserId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);
        _mockTaskAssignmentRepository.Setup(r => r.GetTaskAssignmentsAsync(_testTaskId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(assignments);

        // Act
        var result = await _taskService.GetTaskAssigneesAsync(_testTaskId, _testUserId);

        // Assert
        Assert.Single(result);
        Assert.Equal(_testTargetUserId, result[0].UserId);
        Assert.Equal("Target User", result[0].UserName);
        Assert.Equal("target@test.com", result[0].UserEmail);
    }

    [Fact]
    public async System.Threading.Tasks.Task GetTaskAssigneesAsync_WhenNotOwnerOrAssignee_ThrowsForbiddenException()
    {
        // Arrange
        var task = new TaskEntity { Id = _testTaskId, CreatedByUserId = Guid.NewGuid() };

        _mockTaskRepository.Setup(r => r.GetByIdAsync(_testTaskId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(task);
        _mockTaskAssignmentRepository.Setup(r => r.IsUserAssignedToTaskAsync(_testTaskId, _testUserId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        // Act & Assert
        await Assert.ThrowsAsync<ForbiddenException>(() => 
            _taskService.GetTaskAssigneesAsync(_testTaskId, _testUserId));
    }
}
