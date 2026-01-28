using Microsoft.Extensions.Logging;
using Moq;
using TaskFlow.Abstractions.DTOs.Task;
using TaskFlow.Abstractions.Exceptions;
using TaskFlow.Abstractions.Interfaces;
using TaskFlow.Abstractions.Interfaces.Repositories;
using TaskFlow.Core.Services;
using TaskEntity = TaskFlow.Abstractions.Entities.Task;

namespace TaskFlow.Tests.Unit.Services;

public class TaskServiceHierarchyTests
{
    private readonly Mock<IUnitOfWork> _mockUnitOfWork;
    private readonly Mock<ITaskRepository> _mockTaskRepository;
    private readonly Mock<ILogger<TaskService>> _mockLogger;
    private readonly TaskService _taskService;
    private readonly Guid _testUserId = Guid.NewGuid();
    private readonly Guid _taskId = Guid.NewGuid();
    private readonly Guid _parentTaskId = Guid.NewGuid();

    public TaskServiceHierarchyTests()
    {
        _mockUnitOfWork = new Mock<IUnitOfWork>();
        _mockTaskRepository = new Mock<ITaskRepository>();
        _mockLogger = new Mock<ILogger<TaskService>>();

        _mockUnitOfWork.Setup(u => u.Tasks).Returns(_mockTaskRepository.Object);
        _mockUnitOfWork.Setup(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(1);

        _taskService = new TaskService(_mockUnitOfWork.Object, _mockLogger.Object);
    }

    [Fact]
    public async System.Threading.Tasks.Task SetParentTaskAsync_PreventsSelfParent()
    {
        // Arrange
        var task = new TaskEntity { Id = _taskId, CreatedByUserId = _testUserId };
        _mockTaskRepository.Setup(r => r.GetByIdAsync(_taskId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(task);

        // Act & Assert
        var exception = await Assert.ThrowsAsync<ValidationException>(
            () => _taskService.SetParentTaskAsync(_taskId, _taskId, _testUserId));
        
        Assert.Contains("cannot be its own parent", exception.Message);
    }

    [Fact]
    public async System.Threading.Tasks.Task SetParentTaskAsync_PreventsDescendantAsParent()
    {
        // Arrange
        var task = new TaskEntity { Id = _taskId, CreatedByUserId = _testUserId };
        var parentTask = new TaskEntity { Id = _parentTaskId, CreatedByUserId = _testUserId };

        _mockTaskRepository.Setup(r => r.GetByIdAsync(_taskId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(task);
        _mockTaskRepository.Setup(r => r.GetByIdAsync(_parentTaskId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(parentTask);
        _mockTaskRepository.Setup(r => r.IsDescendantOfAsync(_parentTaskId, _taskId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true); // Parent is descendant of task

        // Act & Assert
        var exception = await Assert.ThrowsAsync<ValidationException>(
            () => _taskService.SetParentTaskAsync(_taskId, _parentTaskId, _testUserId));
        
        Assert.Contains("circular reference", exception.Message);
    }

    [Fact]
    public async System.Threading.Tasks.Task SetParentTaskAsync_EnforcesDepthLimit()
    {
        // Arrange
        var task = new TaskEntity { Id = _taskId, CreatedByUserId = _testUserId };
        var parentTask = new TaskEntity { Id = _parentTaskId, CreatedByUserId = _testUserId };

        _mockTaskRepository.Setup(r => r.GetByIdAsync(_taskId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(task);
        _mockTaskRepository.Setup(r => r.GetByIdAsync(_parentTaskId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(parentTask);
        _mockTaskRepository.Setup(r => r.IsDescendantOfAsync(_parentTaskId, _taskId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);
        _mockTaskRepository.Setup(r => r.GetTaskDepthAsync(_parentTaskId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(15); // Already at max depth

        // Act & Assert
        var exception = await Assert.ThrowsAsync<ValidationException>(
            () => _taskService.SetParentTaskAsync(_taskId, _parentTaskId, _testUserId));
        
        Assert.Contains("maximum hierarchy depth", exception.Message);
    }

    [Fact]
    public async System.Threading.Tasks.Task SetParentTaskAsync_SuccessfullyAssignsParent()
    {
        // Arrange
        var task = new TaskEntity { Id = _taskId, CreatedByUserId = _testUserId };
        var parentTask = new TaskEntity { Id = _parentTaskId, CreatedByUserId = _testUserId };

        _mockTaskRepository.Setup(r => r.GetByIdAsync(_taskId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(task);
        _mockTaskRepository.Setup(r => r.GetByIdAsync(_parentTaskId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(parentTask);
        _mockTaskRepository.Setup(r => r.IsDescendantOfAsync(_parentTaskId, _taskId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);
        _mockTaskRepository.Setup(r => r.GetTaskDepthAsync(_parentTaskId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(5); // Within limit

        // Act
        await _taskService.SetParentTaskAsync(_taskId, _parentTaskId, _testUserId);

        // Assert
        Assert.Equal(_parentTaskId, task.ParentTaskId);
        _mockTaskRepository.Verify(r => r.UpdateAsync(task, It.IsAny<CancellationToken>()), Times.Once);
        _mockUnitOfWork.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async System.Threading.Tasks.Task RemoveParentAsync_SuccessfullyRemovesParent()
    {
        // Arrange
        var task = new TaskEntity 
        { 
            Id = _taskId, 
            CreatedByUserId = _testUserId,
            ParentTaskId = _parentTaskId 
        };

        _mockTaskRepository.Setup(r => r.GetByIdAsync(_taskId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(task);

        // Act
        await _taskService.RemoveParentAsync(_taskId, _testUserId);

        // Assert
        Assert.Null(task.ParentTaskId);
        _mockTaskRepository.Verify(r => r.UpdateAsync(task, It.IsAny<CancellationToken>()), Times.Once);
        _mockUnitOfWork.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async System.Threading.Tasks.Task SetParentTaskAsync_ThrowsNotFoundForInvalidTask()
    {
        // Arrange
        _mockTaskRepository.Setup(r => r.GetByIdAsync(_taskId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((TaskEntity?)null);

        // Act & Assert
        await Assert.ThrowsAsync<NotFoundException>(
            () => _taskService.SetParentTaskAsync(_taskId, _parentTaskId, _testUserId));
    }

    [Fact]
    public async System.Threading.Tasks.Task SetParentTaskAsync_ThrowsUnauthorizedForWrongUser()
    {
        // Arrange
        var task = new TaskEntity { Id = _taskId, CreatedByUserId = Guid.NewGuid() }; // Different user
        _mockTaskRepository.Setup(r => r.GetByIdAsync(_taskId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(task);

        // Act & Assert
        await Assert.ThrowsAsync<UnauthorizedException>(
            () => _taskService.SetParentTaskAsync(_taskId, _parentTaskId, _testUserId));
    }

    [Fact]
    public async System.Threading.Tasks.Task GetChildrenAsync_ThrowsForbiddenForWrongUser()
    {
        // Arrange
        _mockTaskRepository.Setup(r => r.UserOwnsTaskAsync(_taskId, _testUserId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        // Act & Assert
        await Assert.ThrowsAsync<ForbiddenException>(
            () => _taskService.GetChildrenAsync(_taskId, _testUserId));
    }

    [Fact]
    public async System.Threading.Tasks.Task GetChildrenAsync_ReturnsChildren()
    {
        // Arrange
        var children = new List<TaskEntity>
        {
            new TaskEntity { Id = Guid.NewGuid(), Name = "Child 1", CreatedByUserId = _testUserId },
            new TaskEntity { Id = Guid.NewGuid(), Name = "Child 2", CreatedByUserId = _testUserId }
        };

        _mockTaskRepository.Setup(r => r.UserOwnsTaskAsync(_taskId, _testUserId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);
        _mockTaskRepository.Setup(r => r.GetChildrenAsync(_taskId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(children);

        // Act
        var result = await _taskService.GetChildrenAsync(_taskId, _testUserId);

        // Assert
        Assert.Equal(2, result.Count);
        _mockTaskRepository.Verify(r => r.GetChildrenAsync(_taskId, It.IsAny<CancellationToken>()), Times.Once);
    }
}
