using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using TaskFlow.Abstractions.Constants;
using TaskFlow.Abstractions.DTOs.Task;
using TaskFlow.Abstractions.DTOs.Tasks;
using TaskFlow.Abstractions.DTOs.Shared;
using TaskFlow.Abstractions.Interfaces.Services;
using TaskFlow.Api.Controllers;
using TaskStatus = TaskFlow.Abstractions.Constants.TaskStatus;
using TaskPriority = TaskFlow.Abstractions.Constants.TaskPriority;
using TaskType = TaskFlow.Abstractions.Constants.TaskType;

namespace TaskFlow.Tests.Unit.Controllers;

public class TasksControllerTests
{
    private readonly Mock<ITaskService> _mockTaskService;
    private readonly Mock<ITimeEntryService> _mockTimeEntryService;
    private readonly Mock<ILogger<TasksController>> _mockLogger;
    private readonly TasksController _controller;
    private readonly Guid _testUserId = Guid.NewGuid();

    public TasksControllerTests()
    {
        _mockTaskService = new Mock<ITaskService>();
        _mockTimeEntryService = new Mock<ITimeEntryService>();
        _mockLogger = new Mock<ILogger<TasksController>>();
        _controller = new TasksController(_mockTaskService.Object, _mockTimeEntryService.Object, _mockLogger.Object);

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
        var task = new TaskResponseDto
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
        };

        var paginatedResult = new PaginatedResultDto<TaskResponseDto>
        {
            Items = new List<TaskResponseDto> { task },
            TotalCount = 1,
            Page = 1,
            PageSize = 50,
            TotalPages = 1
        };

        _mockTaskService.Setup(s => s.GetTasksAsync(_testUserId, It.IsAny<TaskQueryDto>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(paginatedResult);

        // Act
        var result = await _controller.GetUserTasks(new TaskQueryDto(), CancellationToken.None);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var returnedResult = Assert.IsAssignableFrom<PaginatedResultDto<TaskResponseDto>>(okResult.Value);
        Assert.Single(returnedResult.Items);
    }

    [Fact]
    public async System.Threading.Tasks.Task GetUserTasks_PassesStatusParameter_ToService()
    {
        // Arrange
        var paginatedResult = new PaginatedResultDto<TaskResponseDto>
        {
            Items = new List<TaskResponseDto>(),
            TotalCount = 0,
            Page = 1,
            PageSize = 50,
            TotalPages = 0
        };

        _mockTaskService.Setup(s => s.GetTasksAsync(_testUserId, It.IsAny<TaskQueryDto>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(paginatedResult);

        var queryDto = new TaskQueryDto { Status = TaskStatus.Done };

        // Act
        await _controller.GetUserTasks(queryDto, CancellationToken.None);

        // Assert
        _mockTaskService.Verify(s => s.GetTasksAsync(
            _testUserId, 
            It.Is<TaskQueryDto>(q => q.Status == TaskStatus.Done), 
            It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async System.Threading.Tasks.Task GetUserTasks_PassesSearchParameter_ToService()
    {
        // Arrange
        var searchTerm = "important task";
        var paginatedResult = new PaginatedResultDto<TaskResponseDto>
        {
            Items = new List<TaskResponseDto>(),
            TotalCount = 0,
            Page = 1,
            PageSize = 50,
            TotalPages = 0
        };

        _mockTaskService.Setup(s => s.GetTasksAsync(_testUserId, It.IsAny<TaskQueryDto>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(paginatedResult);

        var queryDto = new TaskQueryDto { SearchTerm = searchTerm };

        // Act
        await _controller.GetUserTasks(queryDto, CancellationToken.None);

        // Assert
        _mockTaskService.Verify(s => s.GetTasksAsync(
            _testUserId, 
            It.Is<TaskQueryDto>(q => q.SearchTerm == searchTerm), 
            It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async System.Threading.Tasks.Task GetUserTasks_PassesBothStatusAndSearch_ToService()
    {
        // Arrange
        var searchTerm = "bug fix";
        var paginatedResult = new PaginatedResultDto<TaskResponseDto>
        {
            Items = new List<TaskResponseDto>(),
            TotalCount = 0,
            Page = 1,
            PageSize = 50,
            TotalPages = 0
        };

        _mockTaskService.Setup(s => s.GetTasksAsync(_testUserId, It.IsAny<TaskQueryDto>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(paginatedResult);

        var queryDto = new TaskQueryDto { Status = TaskStatus.Blocked, SearchTerm = searchTerm };

        // Act
        await _controller.GetUserTasks(queryDto, CancellationToken.None);

        // Assert
        _mockTaskService.Verify(s => s.GetTasksAsync(
            _testUserId, 
            It.Is<TaskQueryDto>(q => q.Status == TaskStatus.Blocked && q.SearchTerm == searchTerm), 
            It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async System.Threading.Tasks.Task GetUserTasks_ReturnsEmptyList_WhenNoTasksFound()
    {
        // Arrange
        var paginatedResult = new PaginatedResultDto<TaskResponseDto>
        {
            Items = new List<TaskResponseDto>(),
            TotalCount = 0,
            Page = 1,
            PageSize = 50,
            TotalPages = 0
        };

        _mockTaskService.Setup(s => s.GetTasksAsync(_testUserId, It.IsAny<TaskQueryDto>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(paginatedResult);

        // Act
        var result = await _controller.GetUserTasks(new TaskQueryDto(), CancellationToken.None);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var returnedResult = Assert.IsAssignableFrom<PaginatedResultDto<TaskResponseDto>>(okResult.Value);
        Assert.Empty(returnedResult.Items);
    }

    [Fact]
    public async System.Threading.Tasks.Task GetUserTasks_ExtractsUserId_FromClaims()
    {
        // Arrange
        var paginatedResult = new PaginatedResultDto<TaskResponseDto>
        {
            Items = new List<TaskResponseDto>(),
            TotalCount = 0,
            Page = 1,
            PageSize = 50,
            TotalPages = 0
        };

        _mockTaskService.Setup(s => s.GetTasksAsync(It.IsAny<Guid>(), It.IsAny<TaskQueryDto>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(paginatedResult);

        // Act
        await _controller.GetUserTasks(new TaskQueryDto(), CancellationToken.None);

        // Assert
        _mockTaskService.Verify(s => s.GetTasksAsync(_testUserId, It.IsAny<TaskQueryDto>(), It.IsAny<CancellationToken>()), Times.Once);
    }
}
