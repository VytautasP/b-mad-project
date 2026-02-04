using System.Diagnostics;
using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using TaskFlow.Abstractions.DTOs.Auth;
using TaskFlow.Abstractions.DTOs.Task;
using TaskFlow.Abstractions.DTOs.Tasks;
using TaskFlow.Abstractions.DTOs.Shared;
using TaskFlow.Tests.Integration.Controllers;
using TaskStatus = TaskFlow.Abstractions.Constants.TaskStatus;
using TaskPriority = TaskFlow.Abstractions.Constants.TaskPriority;
using TaskType = TaskFlow.Abstractions.Constants.TaskType;

namespace TaskFlow.Tests.Integration;

public class TasksControllerAdvancedQueryTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;
    private readonly HttpClient _client;
    private string? _authToken;
    private Guid _userId;

    public TasksControllerAdvancedQueryTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
        _client = _factory.CreateClient();
    }

    private async Task AuthenticateAsync()
    {
        var registerDto = new RegisterDto
        {
            Email = "advquery" + Guid.NewGuid() + "@example.com",
            Password = "TestPass123",
            Name = "Advanced Query Test User"
        };

        var response = await _client.PostAsJsonAsync("/api/auth/register", registerDto);
        var authResponse = await response.Content.ReadFromJsonAsync<AuthResponseDto>();

        _authToken = authResponse!.Token;
        _userId = authResponse.UserId;
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", _authToken);
    }

    private async Task<TaskResponseDto> CreateTaskAsync(
        string name,
        TaskStatus status = TaskStatus.ToDo,
        TaskPriority priority = TaskPriority.Medium,
        TaskType type = TaskType.Task,
        DateTime? dueDate = null)
    {
        if (_authToken == null) await AuthenticateAsync();

        var createDto = new TaskCreateDto
        {
            Name = name,
            Description = $"Description for {name}",
            Priority = priority,
            Status = status,
            Type = type,
            DueDate = dueDate
        };

        var response = await _client.PostAsJsonAsync("/api/tasks", createDto);
        response.EnsureSuccessStatusCode();
        return (await response.Content.ReadFromJsonAsync<TaskResponseDto>())!;
    }

    [Fact]
    public async Task GetTasks_WithStatusFilter_ReturnsOnlyMatchingTasks()
    {
        // Arrange
        await AuthenticateAsync();
        await CreateTaskAsync("Task 1", TaskStatus.InProgress);
        await CreateTaskAsync("Task 2", TaskStatus.ToDo);
        await CreateTaskAsync("Task 3", TaskStatus.InProgress);

        // Act
        var response = await _client.GetAsync("/api/tasks?status=1"); // InProgress = 1

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var result = await response.Content.ReadFromJsonAsync<PaginatedResultDto<TaskResponseDto>>();
        Assert.NotNull(result);
        Assert.Equal(2, result.Items.Count);
        Assert.All(result.Items, t => Assert.Equal(TaskStatus.InProgress, t.Status));
    }

    [Fact]
    public async Task GetTasks_WithPriorityFilter_ReturnsOnlyMatchingTasks()
    {
        // Arrange
        await AuthenticateAsync();
        await CreateTaskAsync("High Priority", priority: TaskPriority.High);
        await CreateTaskAsync("Low Priority", priority: TaskPriority.Low);
        await CreateTaskAsync("High Priority 2", priority: TaskPriority.High);

        // Act
        var response = await _client.GetAsync("/api/tasks?priority=2"); // High = 2

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var result = await response.Content.ReadFromJsonAsync<PaginatedResultDto<TaskResponseDto>>();
        Assert.NotNull(result);
        Assert.Equal(2, result.Items.Count);
        Assert.All(result.Items, t => Assert.Equal(TaskPriority.High, t.Priority));
    }

    [Fact]
    public async Task GetTasks_WithTypeFilter_ReturnsOnlyMatchingTasks()
    {
        // Arrange
        await AuthenticateAsync();
        await CreateTaskAsync("Project 1", type: TaskType.Project);
        await CreateTaskAsync("Task 1", type: TaskType.Task);
        await CreateTaskAsync("Milestone 1", type: TaskType.Milestone);

        // Act
        var response = await _client.GetAsync("/api/tasks?type=0"); // Project = 0

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var result = await response.Content.ReadFromJsonAsync<PaginatedResultDto<TaskResponseDto>>();
        Assert.NotNull(result);
        Assert.Single(result.Items);
        Assert.Equal(TaskType.Project, result.Items[0].Type);
    }

    [Fact]
    public async Task GetTasks_WithMultipleFilters_ReturnsMatchingTasks()
    {
        // Arrange
        await AuthenticateAsync();
        await CreateTaskAsync("Match", TaskStatus.InProgress, TaskPriority.High, TaskType.Task);
        await CreateTaskAsync("Wrong Status", TaskStatus.Done, TaskPriority.High, TaskType.Task);
        await CreateTaskAsync("Wrong Priority", TaskStatus.InProgress, TaskPriority.Low, TaskType.Task);
        await CreateTaskAsync("Wrong Type", TaskStatus.InProgress, TaskPriority.High, TaskType.Project);

        // Act
        var response = await _client.GetAsync("/api/tasks?status=1&priority=2&type=2"); // InProgress, High, Task

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var result = await response.Content.ReadFromJsonAsync<PaginatedResultDto<TaskResponseDto>>();
        Assert.NotNull(result);
        Assert.Single(result.Items);
        Assert.Equal("Match", result.Items[0].Name);
    }

    [Fact]
    public async Task GetTasks_WithSearchTerm_ReturnsMatchingTasks()
    {
        // Arrange
        await AuthenticateAsync();
        await CreateTaskAsync("Important Bug Fix");
        await CreateTaskAsync("Regular Feature");
        await CreateTaskAsync("Critical Bug");

        // Act
        var response = await _client.GetAsync("/api/tasks?searchTerm=bug");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var result = await response.Content.ReadFromJsonAsync<PaginatedResultDto<TaskResponseDto>>();
        Assert.NotNull(result);
        Assert.Equal(2, result.Items.Count);
        Assert.All(result.Items, t => Assert.Contains("Bug", t.Name, StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public async Task GetTasks_WithDueDateRange_ReturnsMatchingTasks()
    {
        // Arrange
        await AuthenticateAsync();
        var today = DateTime.UtcNow.Date;
        await CreateTaskAsync("Task 1", dueDate: today.AddDays(1));
        await CreateTaskAsync("Task 2", dueDate: today.AddDays(5));
        await CreateTaskAsync("Task 3", dueDate: today.AddDays(10));

        // Act
        var fromDate = today.ToString("yyyy-MM-dd");
        var toDate = today.AddDays(6).ToString("yyyy-MM-dd");
        var response = await _client.GetAsync($"/api/tasks?dueDateFrom={fromDate}&dueDateTo={toDate}");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var result = await response.Content.ReadFromJsonAsync<PaginatedResultDto<TaskResponseDto>>();
        Assert.NotNull(result);
        Assert.Equal(2, result.Items.Count);
    }

    [Fact]
    public async Task GetTasks_WithSortingByName_ReturnsSortedTasks()
    {
        // Arrange
        await AuthenticateAsync();
        await CreateTaskAsync("Charlie");
        await CreateTaskAsync("Alpha");
        await CreateTaskAsync("Bravo");

        // Act - Sort ascending
        var response = await _client.GetAsync("/api/tasks?sortBy=name&sortOrder=asc");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var result = await response.Content.ReadFromJsonAsync<PaginatedResultDto<TaskResponseDto>>();
        Assert.NotNull(result);
        Assert.Equal(3, result.Items.Count);
        Assert.Equal("Alpha", result.Items[0].Name);
        Assert.Equal("Bravo", result.Items[1].Name);
        Assert.Equal("Charlie", result.Items[2].Name);
    }

    [Fact]
    public async Task GetTasks_WithSortingByPriority_ReturnsSortedTasks()
    {
        // Arrange
        await AuthenticateAsync();
        await CreateTaskAsync("Task 1", priority: TaskPriority.Low);
        await CreateTaskAsync("Task 2", priority: TaskPriority.Critical);
        await CreateTaskAsync("Task 3", priority: TaskPriority.Medium);

        // Act - Sort descending
        var response = await _client.GetAsync("/api/tasks?sortBy=priority&sortOrder=desc");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var result = await response.Content.ReadFromJsonAsync<PaginatedResultDto<TaskResponseDto>>();
        Assert.NotNull(result);
        Assert.Equal(3, result.Items.Count);
        Assert.Equal(TaskPriority.Critical, result.Items[0].Priority);
        Assert.Equal(TaskPriority.Medium, result.Items[1].Priority);
        Assert.Equal(TaskPriority.Low, result.Items[2].Priority);
    }

    [Fact]
    public async Task GetTasks_WithPagination_ReturnsCorrectPage()
    {
        // Arrange
        await AuthenticateAsync();
        for (int i = 1; i <= 15; i++)
        {
            await CreateTaskAsync($"Task {i}");
        }

        // Act
        var response = await _client.GetAsync("/api/tasks?page=2&pageSize=5");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var result = await response.Content.ReadFromJsonAsync<PaginatedResultDto<TaskResponseDto>>();
        Assert.NotNull(result);
        Assert.Equal(5, result.Items.Count);
        Assert.Equal(15, result.TotalCount);
        Assert.Equal(2, result.Page);
        Assert.Equal(5, result.PageSize);
        Assert.Equal(3, result.TotalPages);
        Assert.True(result.HasPreviousPage);
        Assert.True(result.HasNextPage);
    }

    [Fact]
    public async Task GetTasks_WithInvalidQueryParameters_ReturnsBadRequest()
    {
        // Arrange
        await AuthenticateAsync();

        // Act - Invalid page number
        var response = await _client.GetAsync("/api/tasks?page=0");

        // Assert
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task GetTasks_WithInvalidSortBy_ReturnsBadRequest()
    {
        // Arrange
        await AuthenticateAsync();

        // Act - Invalid sortBy value
        var response = await _client.GetAsync("/api/tasks?sortBy=invalidField");

        // Assert
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task GetTasks_ReturnsPaginationMetadata()
    {
        // Arrange
        await AuthenticateAsync();
        for (int i = 1; i <= 100; i++)
        {
            await CreateTaskAsync($"Task {i}");
        }

        // Act
        var response = await _client.GetAsync("/api/tasks?page=1&pageSize=50");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var result = await response.Content.ReadFromJsonAsync<PaginatedResultDto<TaskResponseDto>>();
        Assert.NotNull(result);
        Assert.Equal(50, result.Items.Count);
        Assert.Equal(100, result.TotalCount);
        Assert.Equal(1, result.Page);
        Assert.Equal(50, result.PageSize);
        Assert.Equal(2, result.TotalPages);
    }

    [Fact]
    public async Task GetTasks_CompleteQueryWithFiltersAndSortingAndPagination()
    {
        // Arrange
        await AuthenticateAsync();
        for (int i = 1; i <= 20; i++)
        {
            await CreateTaskAsync($"Task {i}", TaskStatus.InProgress, TaskPriority.High);
        }
        for (int i = 1; i <= 10; i++)
        {
            await CreateTaskAsync($"Other {i}", TaskStatus.ToDo, TaskPriority.Low);
        }

        // Act
        var response = await _client.GetAsync("/api/tasks?status=1&priority=2&sortBy=name&sortOrder=asc&page=1&pageSize=10");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var result = await response.Content.ReadFromJsonAsync<PaginatedResultDto<TaskResponseDto>>();
        Assert.NotNull(result);
        Assert.Equal(10, result.Items.Count);
        Assert.Equal(20, result.TotalCount);
        Assert.All(result.Items, t =>
        {
            Assert.Equal(TaskStatus.InProgress, t.Status);
            Assert.Equal(TaskPriority.High, t.Priority);
        });
        // Verify sorting
        for (int i = 0; i < result.Items.Count - 1; i++)
        {
            Assert.True(string.Compare(result.Items[i].Name, result.Items[i + 1].Name, StringComparison.Ordinal) <= 0);
        }
    }

    [Fact]
    public async Task GetTasks_PerformanceTest_With500Tasks()
    {
        // Arrange
        await AuthenticateAsync();
        
        // Create 500 tasks with varied properties
        for (int i = 1; i <= 500; i++)
        {
            var status = (TaskStatus)(i % 5);
            var priority = (TaskPriority)(i % 4);
            var type = (TaskType)(i % 3);
            await CreateTaskAsync($"Task {i}", status, priority, type);
        }

        // Act
        var stopwatch = Stopwatch.StartNew();
        var response = await _client.GetAsync("/api/tasks?status=1&priority=2&sortBy=name&sortOrder=asc&page=1&pageSize=50");
        stopwatch.Stop();

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.True(stopwatch.ElapsedMilliseconds < 500, $"Query took {stopwatch.ElapsedMilliseconds}ms, expected <500ms");
        
        var result = await response.Content.ReadFromJsonAsync<PaginatedResultDto<TaskResponseDto>>();
        Assert.NotNull(result);
        Assert.True(result.Items.Count <= 50);
    }

    [Fact]
    public async Task GetTasks_OnlyReturnsUserOwnTasks()
    {
        // Arrange - Create first user and their tasks
        await AuthenticateAsync();
        var user1Task = await CreateTaskAsync("User 1 Task");

        // Create second user and their tasks
        var registerDto2 = new RegisterDto
        {
            Email = "user2" + Guid.NewGuid() + "@example.com",
            Password = "TestPass123",
            Name = "User 2"
        };
        var registerResponse = await _client.PostAsJsonAsync("/api/auth/register", registerDto2);
        var authResponse2 = await registerResponse.Content.ReadFromJsonAsync<AuthResponseDto>();
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", authResponse2!.Token);
        
        var user2Task = await CreateTaskAsync("User 2 Task");

        // Act - Query as user 2
        var response = await _client.GetAsync("/api/tasks");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var result = await response.Content.ReadFromJsonAsync<PaginatedResultDto<TaskResponseDto>>();
        Assert.NotNull(result);
        Assert.Single(result.Items);
        Assert.Equal(user2Task.Id, result.Items[0].Id);
        Assert.DoesNotContain(result.Items, t => t.Id == user1Task.Id);
    }
}
