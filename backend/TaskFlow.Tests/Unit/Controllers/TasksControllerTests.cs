using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using TaskFlow.Abstractions.Constants;
using TaskFlow.Abstractions.DTOs.Task;
using TaskFlow.Abstractions.Interfaces.Services;
using TaskFlow.Api.Controllers;
using TaskStatus = TaskFlow.Abstractions.Constants.TaskStatus;
using TaskPriority = TaskFlow.Abstractions.Constants.TaskPriority;
using TaskType = TaskFlow.Abstractions.Constants.TaskType;

namespace TaskFlow.Tests.Unit.Controllers;

public class TasksControllerTests
{
    private readonly Mock<ITaskService> _mockTaskService;
    private readonly Mock<ILogger<TasksController>> _mockLogger;
    private readonly TasksController _controller;
    private readonly Guid _testUserId = Guid.NewGuid();

    public TasksControllerTests()
    {
        _mockTaskService = new Mock<ITaskService>();
        _mockLogger = new Mock<ILogger<TasksController>>();
        _controller = new TasksController(_mockTaskService.Object, _mockLogger.Object);

        // Setup user claims
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, _testUserId.ToString())
        };
        var identity = new ClaimsIdentity(claims, "TestAuth");
        var claimsPrincipal = new ClaimsPrincipal(identity);
        
        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = claimsPrincipal }
        };
    }

    [Fact]
    public async System.Threading.Tasks.Task GetUserTasks_ReturnsOkResult_WithTasks()
    {
        // Arrange
        var tasks = new List<TaskResponseDto>
        {
            new TaskResponseDto
            {
                Id = Guid.NewGuid(),
                Name = "Test Task",
                Description = "Test Description",
                Status = TaskStatus.InProgress,
                Priority = TaskPriority.Medium,
                Type = TaskType.Task,
                Progress = 50,
                CreatedDate = DateTime.UtcNow,
                ModifiedDate = DateTime.UtcNow
            }
        };

        _mockTaskService.Setup(s => s.GetUserTasksAsync(_testUserId, null, null, It.IsAny<bool>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(tasks);

        // Act
        var result = await _controller.GetUserTasks(null, null, false, CancellationToken.None);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var returnedTasks = Assert.IsAssignableFrom<List<TaskResponseDto>>(okResult.Value);
        Assert.Single(returnedTasks);
    }

    [Fact]
    public async System.Threading.Tasks.Task GetUserTasks_PassesStatusParameter_ToService()
    {
        // Arrange
        var tasks = new List<TaskResponseDto>();
        _mockTaskService.Setup(s => s.GetUserTasksAsync(_testUserId, TaskStatus.Done, null, It.IsAny<bool>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(tasks);

        // Act
        await _controller.GetUserTasks(TaskStatus.Done, null, false, CancellationToken.None);

        // Assert
        _mockTaskService.Verify(s => s.GetUserTasksAsync(_testUserId, TaskStatus.Done, null, It.IsAny<bool>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async System.Threading.Tasks.Task GetUserTasks_PassesSearchParameter_ToService()
    {
        // Arrange
        var searchTerm = "important task";
        var tasks = new List<TaskResponseDto>();
        _mockTaskService.Setup(s => s.GetUserTasksAsync(_testUserId, null, searchTerm, It.IsAny<bool>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(tasks);

        // Act
        await _controller.GetUserTasks(null, searchTerm, false, CancellationToken.None);

        // Assert
        _mockTaskService.Verify(s => s.GetUserTasksAsync(_testUserId, null, searchTerm, It.IsAny<bool>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async System.Threading.Tasks.Task GetUserTasks_PassesBothStatusAndSearch_ToService()
    {
        // Arrange
        var searchTerm = "bug fix";
        var tasks = new List<TaskResponseDto>();
        _mockTaskService.Setup(s => s.GetUserTasksAsync(_testUserId, TaskStatus.Blocked, searchTerm, It.IsAny<bool>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(tasks);

        // Act
        await _controller.GetUserTasks(TaskStatus.Blocked, searchTerm, false, CancellationToken.None);

        // Assert
        _mockTaskService.Verify(s => s.GetUserTasksAsync(_testUserId, TaskStatus.Blocked, searchTerm, It.IsAny<bool>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async System.Threading.Tasks.Task GetUserTasks_ReturnsEmptyList_WhenNoTasksFound()
    {
        // Arrange
        _mockTaskService.Setup(s => s.GetUserTasksAsync(_testUserId, null, null, It.IsAny<bool>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<TaskResponseDto>());

        // Act
        var result = await _controller.GetUserTasks(null, null, false, CancellationToken.None);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var returnedTasks = Assert.IsAssignableFrom<List<TaskResponseDto>>(okResult.Value);
        Assert.Empty(returnedTasks);
    }

    [Fact]
    public async System.Threading.Tasks.Task GetUserTasks_ExtractsUserId_FromClaims()
    {
        // Arrange
        var tasks = new List<TaskResponseDto>();
        _mockTaskService.Setup(s => s.GetUserTasksAsync(It.IsAny<Guid>(), null, null, It.IsAny<bool>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(tasks);

        // Act
        await _controller.GetUserTasks(null, null, false, CancellationToken.None);

        // Assert
        _mockTaskService.Verify(s => s.GetUserTasksAsync(_testUserId, null, null, It.IsAny<bool>(), It.IsAny<CancellationToken>()), Times.Once);
    }
}
