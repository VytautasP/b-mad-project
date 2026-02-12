using Microsoft.Extensions.Logging;
using Moq;
using TaskFlow.Abstractions.Constants;
using TaskFlow.Abstractions.DTOs.Task;
using TaskFlow.Abstractions.Entities;
using TaskFlow.Abstractions.Interfaces;
using TaskFlow.Abstractions.Interfaces.Repositories;
using TaskFlow.Abstractions.Interfaces.Services;
using TaskFlow.Core.Services;
using TaskEntity = TaskFlow.Abstractions.Entities.Task;
using TaskStatus = TaskFlow.Abstractions.Constants.TaskStatus;
using TaskPriority = TaskFlow.Abstractions.Constants.TaskPriority;
using TaskType = TaskFlow.Abstractions.Constants.TaskType;

namespace TaskFlow.Tests.Unit.Services;

public class TaskServiceTests
{
    private readonly Mock<IUnitOfWork> _mockUnitOfWork;
    private readonly Mock<IActivityLogService> _mockActivityLogService;
    private readonly Mock<ITaskRepository> _mockTaskRepository;
    private readonly Mock<IUserRepository> _mockUserRepository;
    private readonly Mock<ILogger<TaskService>> _mockLogger;
    private readonly TaskService _taskService;
    private readonly Guid _testUserId = Guid.NewGuid();

    public TaskServiceTests()
    {
        _mockUnitOfWork = new Mock<IUnitOfWork>();
        _mockActivityLogService = new Mock<IActivityLogService>();
        _mockTaskRepository = new Mock<ITaskRepository>();
        _mockUserRepository = new Mock<IUserRepository>();
        _mockLogger = new Mock<ILogger<TaskService>>();

        _mockUnitOfWork.Setup(u => u.Tasks).Returns(_mockTaskRepository.Object);
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
    public async System.Threading.Tasks.Task UpdateTaskAsync_WhenStatusChanges_LogsStatusChangedActivity()
    {
        // Arrange
        var taskId = Guid.NewGuid();
        var task = new TaskEntity
        {
            Id = taskId,
            Name = "Task",
            CreatedByUserId = _testUserId,
            Status = TaskStatus.ToDo,
            Priority = TaskPriority.Medium,
            Type = TaskType.Task,
            CreatedDate = DateTime.UtcNow,
            ModifiedDate = DateTime.UtcNow
        };

        var updateDto = new TaskUpdateDto { Status = TaskStatus.Done };

        _mockTaskRepository.Setup(r => r.GetByIdAsync(taskId, It.IsAny<CancellationToken>())).ReturnsAsync(task);
        _mockTaskRepository.Setup(r => r.UserOwnsTaskAsync(taskId, _testUserId, It.IsAny<CancellationToken>())).ReturnsAsync(true);
        _mockTaskRepository.Setup(r => r.GetByIdWithUserAsync(taskId, It.IsAny<CancellationToken>())).ReturnsAsync(task);
        _mockUserRepository.Setup(r => r.GetByIdAsync(_testUserId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new User { Id = _testUserId, Name = "Tester", Email = "tester@example.com", PasswordHash = "hash" });

        // Act
        await _taskService.UpdateTaskAsync(taskId, updateDto, _testUserId, CancellationToken.None);

        // Assert
        _mockActivityLogService.Verify(s => s.LogActivityAsync(
            taskId,
            _testUserId,
            ActivityType.StatusChanged,
            It.Is<string>(desc => desc.Contains("changed status", StringComparison.OrdinalIgnoreCase)),
            "Status",
            "ToDo",
            "Done",
            It.IsAny<CancellationToken>()), Times.Once);
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
