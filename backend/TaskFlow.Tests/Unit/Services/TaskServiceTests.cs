using Microsoft.Extensions.Logging;
using Moq;
using TaskFlow.Abstractions.Constants;
using TaskFlow.Abstractions.DTOs.Task;
using TaskFlow.Abstractions.Entities;
using TaskFlow.Abstractions.Interfaces;
using TaskFlow.Abstractions.Interfaces.Repositories;
using TaskFlow.Core.Services;
using TaskEntity = TaskFlow.Abstractions.Entities.Task;
using TaskStatus = TaskFlow.Abstractions.Constants.TaskStatus;
using TaskPriority = TaskFlow.Abstractions.Constants.TaskPriority;
using TaskType = TaskFlow.Abstractions.Constants.TaskType;

namespace TaskFlow.Tests.Unit.Services;

public class TaskServiceTests
{
    private readonly Mock<IUnitOfWork> _mockUnitOfWork;
    private readonly Mock<ITaskRepository> _mockTaskRepository;
    private readonly Mock<ILogger<TaskService>> _mockLogger;
    private readonly TaskService _taskService;
    private readonly Guid _testUserId = Guid.NewGuid();

    public TaskServiceTests()
    {
        _mockUnitOfWork = new Mock<IUnitOfWork>();
        _mockTaskRepository = new Mock<ITaskRepository>();
        _mockLogger = new Mock<ILogger<TaskService>>();

        _mockUnitOfWork.Setup(u => u.Tasks).Returns(_mockTaskRepository.Object);

        _taskService = new TaskService(_mockUnitOfWork.Object, _mockLogger.Object);
    }

    [Fact]
    public async System.Threading.Tasks.Task GetUserTasksAsync_CallsRepositoryWithCorrectParameters()
    {
        // Arrange
        var tasks = new List<TaskEntity>
        {
            new TaskEntity
            {
                Id = Guid.NewGuid(),
                Name = "Test Task",
                Description = "Test Description",
                CreatedByUserId = _testUserId,
                Status = TaskStatus.InProgress,
                Priority = TaskPriority.Medium,
                Type = TaskType.Task,
                CreatedDate = DateTime.UtcNow,
                ModifiedDate = DateTime.UtcNow,
                IsDeleted = false,
                Progress = 50,
                TimeEntries = new List<TimeEntry>()
            }
        };

        _mockTaskRepository.Setup(r => r.GetUserTasksAsync(_testUserId, null, null, It.IsAny<CancellationToken>()))
            .ReturnsAsync(tasks);
        
        _mockTaskRepository.Setup(r => r.GetTimeRollupsAsync(It.IsAny<IEnumerable<Guid>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Dictionary<Guid, TaskTimeRollup>());

        // Act
        var result = await _taskService.GetUserTasksAsync(_testUserId, null, null, false);

        // Assert
        Assert.Single(result);
        _mockTaskRepository.Verify(r => r.GetUserTasksAsync(_testUserId, null, null, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async System.Threading.Tasks.Task GetUserTasksAsync_PassesStatusFilterToRepository()
    {
        // Arrange
        var tasks = new List<TaskEntity>();
        _mockTaskRepository.Setup(r => r.GetUserTasksAsync(_testUserId, TaskStatus.Done, null, It.IsAny<CancellationToken>()))
            .ReturnsAsync(tasks);
        
        _mockTaskRepository.Setup(r => r.GetTimeRollupsAsync(It.IsAny<IEnumerable<Guid>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Dictionary<Guid, TaskTimeRollup>());

        // Act
        await _taskService.GetUserTasksAsync(_testUserId, TaskStatus.Done, null, false);

        // Assert
        _mockTaskRepository.Verify(r => r.GetUserTasksAsync(_testUserId, TaskStatus.Done, null, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async System.Threading.Tasks.Task GetUserTasksAsync_PassesSearchTermToRepository()
    {
        // Arrange
        var tasks = new List<TaskEntity>();
        var searchTerm = "test search";
        _mockTaskRepository.Setup(r => r.GetUserTasksAsync(_testUserId, null, searchTerm, It.IsAny<CancellationToken>()))
            .ReturnsAsync(tasks);
        
        _mockTaskRepository.Setup(r => r.GetTimeRollupsAsync(It.IsAny<IEnumerable<Guid>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Dictionary<Guid, TaskTimeRollup>());

        // Act
        await _taskService.GetUserTasksAsync(_testUserId, null, searchTerm, false);

        // Assert
        _mockTaskRepository.Verify(r => r.GetUserTasksAsync(_testUserId, null, searchTerm, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async System.Threading.Tasks.Task GetUserTasksAsync_PassesBothStatusAndSearchToRepository()
    {
        // Arrange
        var tasks = new List<TaskEntity>();
        var searchTerm = "important";
        _mockTaskRepository.Setup(r => r.GetUserTasksAsync(_testUserId, TaskStatus.InProgress, searchTerm, It.IsAny<CancellationToken>()))
            .ReturnsAsync(tasks);
        
        _mockTaskRepository.Setup(r => r.GetTimeRollupsAsync(It.IsAny<IEnumerable<Guid>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Dictionary<Guid, TaskTimeRollup>());

        // Act
        await _taskService.GetUserTasksAsync(_testUserId, TaskStatus.InProgress, searchTerm, false);

        // Assert
        _mockTaskRepository.Verify(r => r.GetUserTasksAsync(_testUserId, TaskStatus.InProgress, searchTerm, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async System.Threading.Tasks.Task GetUserTasksAsync_ReturnsEmptyList_WhenNoTasksFound()
    {
        // Arrange
        _mockTaskRepository.Setup(r => r.GetUserTasksAsync(_testUserId, null, null, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<TaskEntity>());
        
        _mockTaskRepository.Setup(r => r.GetTimeRollupsAsync(It.IsAny<IEnumerable<Guid>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Dictionary<Guid, TaskTimeRollup>());

        // Act
        var result = await _taskService.GetUserTasksAsync(_testUserId, null, null, false);

        // Assert
        Assert.Empty(result);
    }

    [Fact]
    public async System.Threading.Tasks.Task GetUserTasksAsync_MapsTaskEntitiesToDtos()
    {
        // Arrange
        var taskId = Guid.NewGuid();
        var tasks = new List<TaskEntity>
        {
            new TaskEntity
            {
                Id = taskId,
                Name = "Test Task",
                Description = "Test Description",
                CreatedByUserId = _testUserId,
                Status = TaskStatus.InProgress,
                Priority = TaskPriority.High,
                Type = TaskType.Project,
                CreatedDate = DateTime.UtcNow,
                ModifiedDate = DateTime.UtcNow,
                DueDate = DateTime.UtcNow.AddDays(7),
                IsDeleted = false,
                Progress = 75,
                TimeEntries = new List<TimeEntry>()
            }
        };

        _mockTaskRepository.Setup(r => r.GetUserTasksAsync(_testUserId, null, null, It.IsAny<CancellationToken>()))
            .ReturnsAsync(tasks);
        
        _mockTaskRepository.Setup(r => r.GetTimeRollupsAsync(It.IsAny<IEnumerable<Guid>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Dictionary<Guid, TaskTimeRollup>());

        // Act
        var result = await _taskService.GetUserTasksAsync(_testUserId, null, null, false);

        // Assert
        Assert.Single(result);
        var dto = result[0];
        Assert.Equal(taskId, dto.Id);
        Assert.Equal("Test Task", dto.Name);
        Assert.Equal("Test Description", dto.Description);
        Assert.Equal(TaskStatus.InProgress, dto.Status);
        Assert.Equal(TaskPriority.High, dto.Priority);
        Assert.Equal(75, dto.Progress);
    }
}
