using Microsoft.Extensions.Logging;
using Moq;
using TaskFlow.Abstractions.Constants;
using TaskFlow.Abstractions.DTOs.Tasks;
using TaskFlow.Abstractions.Exceptions;
using TaskFlow.Abstractions.Interfaces;
using TaskFlow.Abstractions.Interfaces.Repositories;
using TaskFlow.Core.Services;
using TaskEntity = TaskFlow.Abstractions.Entities.Task;
using TaskStatus = TaskFlow.Abstractions.Constants.TaskStatus;
using TaskPriority = TaskFlow.Abstractions.Constants.TaskPriority;
using TaskType = TaskFlow.Abstractions.Constants.TaskType;

namespace TaskFlow.Tests.Unit.Services;

public class TaskServiceTimelineTests
{
    private readonly Mock<IUnitOfWork> _mockUnitOfWork;
    private readonly Mock<ITaskRepository> _mockTaskRepository;
    private readonly Mock<ILogger<TaskService>> _mockLogger;
    private readonly TaskService _taskService;
    private readonly Guid _testUserId = Guid.NewGuid();

    public TaskServiceTimelineTests()
    {
        _mockUnitOfWork = new Mock<IUnitOfWork>();
        _mockTaskRepository = new Mock<ITaskRepository>();
        _mockLogger = new Mock<ILogger<TaskService>>();

        _mockUnitOfWork.Setup(u => u.Tasks).Returns(_mockTaskRepository.Object);

        _taskService = new TaskService(_mockUnitOfWork.Object, _mockLogger.Object);
    }

    [Fact]
    public async System.Threading.Tasks.Task GetTimelineTasksAsync_WithDateRangeFilter_ReturnsOnlyTasksInRange()
    {
        // Arrange
        var startDate = new DateTime(2026, 1, 1);
        var endDate = new DateTime(2026, 3, 31);
        var queryDto = new TimelineQueryDto
        {
            StartDate = startDate,
            EndDate = endDate
        };

        var tasks = new List<TaskEntity>
        {
            CreateTestTask("Task 1", dueDate: new DateTime(2026, 2, 15)),
            CreateTestTask("Task 2", dueDate: new DateTime(2026, 3, 10)),
            CreateTestTask("Task 3", dueDate: new DateTime(2026, 1, 20))
        };

        _mockTaskRepository
            .Setup(r => r.GetTasksForTimelineAsync(_testUserId, queryDto, It.IsAny<CancellationToken>()))
            .ReturnsAsync(tasks);

        // Act
        var result = await _taskService.GetTimelineTasksAsync(_testUserId, queryDto, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(3, result.Count);
        Assert.All(result, t => Assert.True(t.EndDate >= startDate && t.EndDate <= endDate));
    }

    [Fact]
    public async System.Threading.Tasks.Task GetTimelineTasksAsync_WithoutDueDates_ExcludedFromTimeline()
    {
        // Arrange
        var queryDto = new TimelineQueryDto
        {
            StartDate = new DateTime(2026, 1, 1),
            EndDate = new DateTime(2026, 3, 31)
        };

        // Repository should filter out tasks without due dates
        var tasks = new List<TaskEntity>
        {
            CreateTestTask("Task 1", dueDate: new DateTime(2026, 2, 15)),
            CreateTestTask("Task 2", dueDate: new DateTime(2026, 3, 10))
            // Tasks without due dates not included by repository
        };

        _mockTaskRepository
            .Setup(r => r.GetTasksForTimelineAsync(_testUserId, queryDto, It.IsAny<CancellationToken>()))
            .ReturnsAsync(tasks);

        // Act
        var result = await _taskService.GetTimelineTasksAsync(_testUserId, queryDto, CancellationToken.None);

        // Assert
        Assert.Equal(2, result.Count);
        Assert.All(result, t => Assert.NotEqual(default(DateTime), t.EndDate));
    }

    [Fact]
    public async System.Threading.Tasks.Task GetTimelineTasksAsync_ParentTaskWithChildren_CalculatesSpan()
    {
        // Arrange
        var parentId = Guid.NewGuid();
        var queryDto = new TimelineQueryDto
        {
            StartDate = new DateTime(2026, 1, 1),
            EndDate = new DateTime(2026, 3, 31)
        };

        var parentTask = CreateTestTask("Parent Task", dueDate: new DateTime(2026, 3, 1));
        parentTask.Id = parentId;

        var child1 = CreateTestTask("Child 1", dueDate: new DateTime(2026, 1, 15));
        child1.ParentTaskId = parentId;
        child1.CreatedDate = new DateTime(2026, 1, 1);

        var child2 = CreateTestTask("Child 2", dueDate: new DateTime(2026, 3, 15));
        child2.ParentTaskId = parentId;
        child2.CreatedDate = new DateTime(2026, 2, 1);

        var tasks = new List<TaskEntity> { parentTask, child1, child2 };

        _mockTaskRepository
            .Setup(r => r.GetTasksForTimelineAsync(_testUserId, queryDto, It.IsAny<CancellationToken>()))
            .ReturnsAsync(tasks);

        // Act
        var result = await _taskService.GetTimelineTasksAsync(_testUserId, queryDto, CancellationToken.None);

        // Assert
        Assert.Equal(3, result.Count);
        
        var parentResult = result.First(t => t.Id == parentId);
        Assert.Equal(new DateTime(2026, 1, 1), parentResult.StartDate); // Earliest child start
        Assert.Equal(new DateTime(2026, 3, 15), parentResult.EndDate); // Latest child end (child2 DueDate > parent DueDate)
        Assert.Equal((int)(parentResult.EndDate - parentResult.StartDate).TotalDays, parentResult.Duration);
    }

    [Fact]
    public async System.Threading.Tasks.Task GetTimelineTasksAsync_WithStatusFilter_ReturnsOnlyMatchingStatus()
    {
        // Arrange
        var queryDto = new TimelineQueryDto
        {
            StartDate = new DateTime(2026, 1, 1),
            EndDate = new DateTime(2026, 3, 31),
            Status = TaskStatus.InProgress
        };

        var tasks = new List<TaskEntity>
        {
            CreateTestTask("Task 1", status: TaskStatus.InProgress, dueDate: new DateTime(2026, 2, 15)),
            CreateTestTask("Task 2", status: TaskStatus.InProgress, dueDate: new DateTime(2026, 3, 10))
        };

        _mockTaskRepository
            .Setup(r => r.GetTasksForTimelineAsync(_testUserId, queryDto, It.IsAny<CancellationToken>()))
            .ReturnsAsync(tasks);

        // Act
        var result = await _taskService.GetTimelineTasksAsync(_testUserId, queryDto, CancellationToken.None);

        // Assert
        Assert.Equal(2, result.Count);
        Assert.All(result, t => Assert.Equal(TaskStatus.InProgress, t.Status));
    }

    [Fact]
    public async System.Threading.Tasks.Task GetTimelineTasksAsync_WithPriorityFilter_ReturnsOnlyMatchingPriority()
    {
        // Arrange
        var queryDto = new TimelineQueryDto
        {
            StartDate = new DateTime(2026, 1, 1),
            EndDate = new DateTime(2026, 3, 31),
            Priority = TaskPriority.High
        };

        var tasks = new List<TaskEntity>
        {
            CreateTestTask("Task 1", priority: TaskPriority.High, dueDate: new DateTime(2026, 2, 15))
        };

        _mockTaskRepository
            .Setup(r => r.GetTasksForTimelineAsync(_testUserId, queryDto, It.IsAny<CancellationToken>()))
            .ReturnsAsync(tasks);

        // Act
        var result = await _taskService.GetTimelineTasksAsync(_testUserId, queryDto, CancellationToken.None);

        // Assert
        Assert.Single(result);
        Assert.Equal(TaskPriority.High, result[0].Priority);
    }

    [Fact]
    public async System.Threading.Tasks.Task GetTimelineTasksAsync_WithAssigneeFilter_ReturnsOnlyAssignedTasks()
    {
        // Arrange
        var assigneeId = Guid.NewGuid();
        var queryDto = new TimelineQueryDto
        {
            StartDate = new DateTime(2026, 1, 1),
            EndDate = new DateTime(2026, 3, 31),
            AssigneeId = assigneeId
        };

        var assignedTask = CreateTestTask("Assigned Task", dueDate: new DateTime(2026, 2, 15));
        assignedTask.TaskAssignments = new List<Abstractions.Entities.TaskAssignment>
        {
            new Abstractions.Entities.TaskAssignment
            {
                UserId = assigneeId,
                User = new Abstractions.Entities.User { Id = assigneeId, Name = "Assignee User", Email = "assignee@test.com" }
            }
        };

        var tasks = new List<TaskEntity> { assignedTask };

        _mockTaskRepository
            .Setup(r => r.GetTasksForTimelineAsync(_testUserId, queryDto, It.IsAny<CancellationToken>()))
            .ReturnsAsync(tasks);

        // Act
        var result = await _taskService.GetTimelineTasksAsync(_testUserId, queryDto, CancellationToken.None);

        // Assert
        Assert.Single(result);
        Assert.Single(result[0].Assignees);
        Assert.Equal(assigneeId, result[0].Assignees[0].UserId);
    }

    [Fact]
    public async System.Threading.Tasks.Task GetTimelineTasksAsync_InvalidDateRange_ThrowsValidationException()
    {
        // Arrange
        var queryDto = new TimelineQueryDto
        {
            StartDate = new DateTime(2026, 3, 31),
            EndDate = new DateTime(2026, 1, 1) // EndDate before StartDate
        };

        // Act & Assert
        await Assert.ThrowsAsync<ValidationException>(() =>
            _taskService.GetTimelineTasksAsync(_testUserId, queryDto, CancellationToken.None));
    }

    [Fact]
    public async System.Threading.Tasks.Task GetTimelineTasksAsync_DateRangeExceedsTwoYears_ThrowsValidationException()
    {
        // Arrange
        var queryDto = new TimelineQueryDto
        {
            StartDate = new DateTime(2026, 1, 1),
            EndDate = new DateTime(2028, 2, 1) // More than 2 years
        };

        // Act & Assert
        await Assert.ThrowsAsync<ValidationException>(() =>
            _taskService.GetTimelineTasksAsync(_testUserId, queryDto, CancellationToken.None));
    }

    [Fact]
    public async System.Threading.Tasks.Task GetTimelineTasksAsync_CalculatesStartDateAndDuration()
    {
        // Arrange
        var createdDate = new DateTime(2026, 1, 10, 10, 0, 0);
        var dueDate = new DateTime(2026, 2, 15, 10, 0, 0);
        var queryDto = new TimelineQueryDto
        {
            StartDate = new DateTime(2026, 1, 1),
            EndDate = new DateTime(2026, 3, 31)
        };

        var task = CreateTestTask("Task 1", dueDate: dueDate);
        task.CreatedDate = createdDate;

        _mockTaskRepository
            .Setup(r => r.GetTasksForTimelineAsync(_testUserId, queryDto, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<TaskEntity> { task });

        // Act
        var result = await _taskService.GetTimelineTasksAsync(_testUserId, queryDto, CancellationToken.None);

        // Assert
        Assert.Single(result);
        Assert.Equal(createdDate, result[0].StartDate);
        Assert.Equal(dueDate, result[0].EndDate);
        Assert.Equal((int)(dueDate - createdDate).TotalDays, result[0].Duration);
    }

    [Fact]
    public async System.Threading.Tasks.Task GetTimelineTasksAsync_SingleDayTask_CalculatesDurationCorrectly()
    {
        // Arrange
        var sameDate = new DateTime(2026, 2, 15);
        var queryDto = new TimelineQueryDto
        {
            StartDate = new DateTime(2026, 1, 1),
            EndDate = new DateTime(2026, 3, 31)
        };

        var task = CreateTestTask("Single Day Task", dueDate: sameDate);
        task.CreatedDate = sameDate;

        _mockTaskRepository
            .Setup(r => r.GetTasksForTimelineAsync(_testUserId, queryDto, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<TaskEntity> { task });

        // Act
        var result = await _taskService.GetTimelineTasksAsync(_testUserId, queryDto, CancellationToken.None);

        // Assert
        Assert.Single(result);
        Assert.Equal(0, result[0].Duration); // Same day = 0 days duration
    }

    [Fact]
    public async System.Threading.Tasks.Task GetTimelineTasksAsync_TasksSpanningMultipleMonths_CalculatesCorrectly()
    {
        // Arrange
        var queryDto = new TimelineQueryDto
        {
            StartDate = new DateTime(2026, 1, 1),
            EndDate = new DateTime(2026, 12, 31)
        };

        var longTask = CreateTestTask("Long Task", dueDate: new DateTime(2026, 6, 30));
        longTask.CreatedDate = new DateTime(2026, 1, 1);

        _mockTaskRepository
            .Setup(r => r.GetTasksForTimelineAsync(_testUserId, queryDto, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<TaskEntity> { longTask });

        // Act
        var result = await _taskService.GetTimelineTasksAsync(_testUserId, queryDto, CancellationToken.None);

        // Assert
        Assert.Single(result);
        Assert.Equal(180, result[0].Duration); // ~180 days from Jan 1 to Jun 30
    }

    [Fact]
    public async System.Threading.Tasks.Task GetTimelineTasksAsync_VerifyRepositoryMethodCalled()
    {
        // Arrange
        var queryDto = new TimelineQueryDto
        {
            StartDate = new DateTime(2026, 1, 1),
            EndDate = new DateTime(2026, 3, 31)
        };

        _mockTaskRepository
            .Setup(r => r.GetTasksForTimelineAsync(_testUserId, queryDto, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<TaskEntity>());

        // Act
        await _taskService.GetTimelineTasksAsync(_testUserId, queryDto, CancellationToken.None);

        // Assert
        _mockTaskRepository.Verify(
            r => r.GetTasksForTimelineAsync(_testUserId, queryDto, It.IsAny<CancellationToken>()),
            Times.Once);
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
            TaskAssignments = new List<Abstractions.Entities.TaskAssignment>(),
            TimeEntries = new List<Abstractions.Entities.TimeEntry>()
        };
    }
}
