using Microsoft.Extensions.Logging;
using Moq;
using TaskFlow.Abstractions.Constants;
using TaskFlow.Abstractions.DTOs.Task;
using TaskFlow.Abstractions.DTOs.Tasks;
using TaskFlow.Abstractions.Interfaces;
using TaskFlow.Abstractions.Interfaces.Repositories;
using TaskFlow.Abstractions.Interfaces.Services;
using TaskFlow.Core.Services;
using TaskEntity = TaskFlow.Abstractions.Entities.Task;
using TaskStatus = TaskFlow.Abstractions.Constants.TaskStatus;
using TaskPriority = TaskFlow.Abstractions.Constants.TaskPriority;
using TaskType = TaskFlow.Abstractions.Constants.TaskType;

namespace TaskFlow.Tests.Unit.Services;

public class TaskServiceAdvancedQueryTests
{
    private readonly Mock<IUnitOfWork> _mockUnitOfWork;
    private readonly Mock<IActivityLogService> _mockActivityLogService;
    private readonly Mock<ITaskRepository> _mockTaskRepository;
    private readonly Mock<ILogger<TaskService>> _mockLogger;
    private readonly TaskService _taskService;
    private readonly Guid _testUserId = Guid.NewGuid();

    public TaskServiceAdvancedQueryTests()
    {
        _mockUnitOfWork = new Mock<IUnitOfWork>();
        _mockActivityLogService = new Mock<IActivityLogService>();
        _mockTaskRepository = new Mock<ITaskRepository>();
        _mockLogger = new Mock<ILogger<TaskService>>();

        _mockUnitOfWork.Setup(u => u.Tasks).Returns(_mockTaskRepository.Object);
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
    public async System.Threading.Tasks.Task GetTasksAsync_WithStatusFilter_ReturnsOnlyMatchingTasks()
    {
        // Arrange
        var queryDto = new TaskQueryDto { Status = TaskStatus.InProgress };
        var tasks = new List<TaskEntity>
        {
            CreateTestTask(status: TaskStatus.InProgress),
            CreateTestTask(status: TaskStatus.InProgress)
        };

        _mockTaskRepository
            .Setup(r => r.GetTasksWithFiltersAsync(_testUserId, queryDto, It.IsAny<CancellationToken>()))
            .ReturnsAsync((tasks, 2));

        _mockTaskRepository
            .Setup(r => r.GetTimeRollupsAsync(It.IsAny<IEnumerable<Guid>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Dictionary<Guid, TaskTimeRollup>());

        // Act
        var result = await _taskService.GetTasksAsync(_testUserId, queryDto, CancellationToken.None);

        // Assert
        Assert.Equal(2, result.Items.Count);
        Assert.All(result.Items, t => Assert.Equal(TaskStatus.InProgress, t.Status));
    }

    [Fact]
    public async System.Threading.Tasks.Task GetTasksAsync_WithPriorityFilter_ReturnsOnlyMatchingTasks()
    {
        // Arrange
        var queryDto = new TaskQueryDto { Priority = TaskPriority.High };
        var tasks = new List<TaskEntity>
        {
            CreateTestTask(priority: TaskPriority.High)
        };

        _mockTaskRepository
            .Setup(r => r.GetTasksWithFiltersAsync(_testUserId, queryDto, It.IsAny<CancellationToken>()))
            .ReturnsAsync((tasks, 1));

        _mockTaskRepository
            .Setup(r => r.GetTimeRollupsAsync(It.IsAny<IEnumerable<Guid>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Dictionary<Guid, TaskTimeRollup>());

        // Act
        var result = await _taskService.GetTasksAsync(_testUserId, queryDto, CancellationToken.None);

        // Assert
        Assert.Single(result.Items);
        Assert.Equal(TaskPriority.High, result.Items[0].Priority);
    }

    [Fact]
    public async System.Threading.Tasks.Task GetTasksAsync_WithMultipleFilters_ReturnsMatchingTasks()
    {
        // Arrange
        var queryDto = new TaskQueryDto
        {
            Status = TaskStatus.InProgress,
            Priority = TaskPriority.High,
            Type = TaskType.Task
        };

        var tasks = new List<TaskEntity>
        {
            CreateTestTask(status: TaskStatus.InProgress, priority: TaskPriority.High, type: TaskType.Task)
        };

        _mockTaskRepository
            .Setup(r => r.GetTasksWithFiltersAsync(_testUserId, queryDto, It.IsAny<CancellationToken>()))
            .ReturnsAsync((tasks, 1));

        _mockTaskRepository
            .Setup(r => r.GetTimeRollupsAsync(It.IsAny<IEnumerable<Guid>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Dictionary<Guid, TaskTimeRollup>());

        // Act
        var result = await _taskService.GetTasksAsync(_testUserId, queryDto, CancellationToken.None);

        // Assert
        Assert.Single(result.Items);
        Assert.Equal(TaskStatus.InProgress, result.Items[0].Status);
        Assert.Equal(TaskPriority.High, result.Items[0].Priority);
        Assert.Equal(TaskType.Task, result.Items[0].Type);
    }

    [Fact]
    public async System.Threading.Tasks.Task GetTasksAsync_WithSearchTerm_ReturnsMatchingTasks()
    {
        // Arrange
        var queryDto = new TaskQueryDto { SearchTerm = "important" };
        var tasks = new List<TaskEntity>
        {
            CreateTestTask(name: "Important Task")
        };

        _mockTaskRepository
            .Setup(r => r.GetTasksWithFiltersAsync(_testUserId, queryDto, It.IsAny<CancellationToken>()))
            .ReturnsAsync((tasks, 1));

        _mockTaskRepository
            .Setup(r => r.GetTimeRollupsAsync(It.IsAny<IEnumerable<Guid>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Dictionary<Guid, TaskTimeRollup>());

        // Act
        var result = await _taskService.GetTasksAsync(_testUserId, queryDto, CancellationToken.None);

        // Assert
        Assert.Single(result.Items);
    }

    [Fact]
    public async System.Threading.Tasks.Task GetTasksAsync_WithPagination_ReturnsCorrectMetadata()
    {
        // Arrange
        var queryDto = new TaskQueryDto { Page = 1, PageSize = 10 };
        var tasks = new List<TaskEntity>
        {
            CreateTestTask(),
            CreateTestTask()
        };

        _mockTaskRepository
            .Setup(r => r.GetTasksWithFiltersAsync(_testUserId, queryDto, It.IsAny<CancellationToken>()))
            .ReturnsAsync((tasks, 25)); // Total count of 25

        _mockTaskRepository
            .Setup(r => r.GetTimeRollupsAsync(It.IsAny<IEnumerable<Guid>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Dictionary<Guid, TaskTimeRollup>());

        // Act
        var result = await _taskService.GetTasksAsync(_testUserId, queryDto, CancellationToken.None);

        // Assert
        Assert.Equal(2, result.Items.Count);
        Assert.Equal(25, result.TotalCount);
        Assert.Equal(1, result.Page);
        Assert.Equal(10, result.PageSize);
        Assert.Equal(3, result.TotalPages); // 25 / 10 = 3 pages
        Assert.True(result.HasNextPage);
        Assert.False(result.HasPreviousPage);
    }

    [Fact]
    public async System.Threading.Tasks.Task GetTasksAsync_WithDueDateRange_ReturnsMatchingTasks()
    {
        // Arrange
        var fromDate = DateTime.UtcNow;
        var toDate = fromDate.AddDays(7);
        var queryDto = new TaskQueryDto
        {
            DueDateFrom = fromDate,
            DueDateTo = toDate
        };

        var tasks = new List<TaskEntity>
        {
            CreateTestTask(dueDate: fromDate.AddDays(3))
        };

        _mockTaskRepository
            .Setup(r => r.GetTasksWithFiltersAsync(_testUserId, queryDto, It.IsAny<CancellationToken>()))
            .ReturnsAsync((tasks, 1));

        _mockTaskRepository
            .Setup(r => r.GetTimeRollupsAsync(It.IsAny<IEnumerable<Guid>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Dictionary<Guid, TaskTimeRollup>());

        // Act
        var result = await _taskService.GetTasksAsync(_testUserId, queryDto, CancellationToken.None);

        // Assert
        Assert.Single(result.Items);
    }

    [Fact]
    public async System.Threading.Tasks.Task GetTasksAsync_CalculatesTotalPagesCorrectly()
    {
        // Arrange
        var queryDto = new TaskQueryDto { Page = 1, PageSize = 50 };
        var tasks = new List<TaskEntity>();

        _mockTaskRepository
            .Setup(r => r.GetTasksWithFiltersAsync(_testUserId, queryDto, It.IsAny<CancellationToken>()))
            .ReturnsAsync((tasks, 234)); // Total count of 234

        _mockTaskRepository
            .Setup(r => r.GetTimeRollupsAsync(It.IsAny<IEnumerable<Guid>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Dictionary<Guid, TaskTimeRollup>());

        // Act
        var result = await _taskService.GetTasksAsync(_testUserId, queryDto, CancellationToken.None);

        // Assert
        Assert.Equal(234, result.TotalCount);
        Assert.Equal(5, result.TotalPages); // Ceiling(234 / 50) = 5
    }

    [Fact]
    public async System.Threading.Tasks.Task GetTasksAsync_WithAssigneeFilter_ReturnsMatchingTasks()
    {
        // Arrange
        var assigneeId = Guid.NewGuid();
        var queryDto = new TaskQueryDto { AssigneeId = assigneeId };
        var tasks = new List<TaskEntity>
        {
            CreateTestTask()
        };

        _mockTaskRepository
            .Setup(r => r.GetTasksWithFiltersAsync(_testUserId, queryDto, It.IsAny<CancellationToken>()))
            .ReturnsAsync((tasks, 1));

        _mockTaskRepository
            .Setup(r => r.GetTimeRollupsAsync(It.IsAny<IEnumerable<Guid>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Dictionary<Guid, TaskTimeRollup>());

        // Act
        var result = await _taskService.GetTasksAsync(_testUserId, queryDto, CancellationToken.None);

        // Assert
        Assert.Single(result.Items);
    }

    private TaskEntity CreateTestTask(
        string name = "Test Task",
        TaskStatus status = TaskStatus.ToDo,
        TaskPriority priority = TaskPriority.Medium,
        TaskType type = TaskType.Task,
        DateTime? dueDate = null)
    {
        return new TaskEntity
        {
            Id = Guid.NewGuid(),
            Name = name,
            Description = "Test Description",
            Status = status,
            Priority = priority,
            Type = type,
            DueDate = dueDate,
            CreatedByUserId = _testUserId,
            CreatedDate = DateTime.UtcNow,
            ModifiedDate = DateTime.UtcNow,
            Progress = 0,
            IsDeleted = false,
            CreatedByUser = new Abstractions.Entities.User
            {
                Id = _testUserId,
                Email = "test@example.com",
                Name = "Test User"
            },
            TimeEntries = new List<Abstractions.Entities.TimeEntry>()
        };
    }
}
