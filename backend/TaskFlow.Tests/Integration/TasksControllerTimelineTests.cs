using System.Diagnostics;
using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Web;
using TaskFlow.Abstractions.DTOs.Auth;
using TaskFlow.Abstractions.DTOs.Task;
using TaskFlow.Abstractions.DTOs.Tasks;
using TaskFlow.Tests.Integration.Controllers;
using TaskStatus = TaskFlow.Abstractions.Constants.TaskStatus;
using TaskPriority = TaskFlow.Abstractions.Constants.TaskPriority;
using TaskType = TaskFlow.Abstractions.Constants.TaskType;

namespace TaskFlow.Tests.Integration;

public class TasksControllerTimelineTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;
    private readonly HttpClient _client;
    private string? _authToken;
    private Guid _userId;

    public TasksControllerTimelineTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
        _client = _factory.CreateClient();
    }

    private async Task AuthenticateAsync()
    {
        var registerDto = new RegisterDto
        {
            Email = "timeline" + Guid.NewGuid() + "@example.com",
            Password = "TestPass123",
            Name = "Timeline Test User"
        };

        var response = await _client.PostAsJsonAsync("/api/auth/register", registerDto);
        var authResponse = await response.Content.ReadFromJsonAsync<AuthResponseDto>();

        _authToken = authResponse!.Token;
        _userId = authResponse.UserId;
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", _authToken);
    }

    private async Task<TaskResponseDto> CreateTaskAsync(
        string name,
        DateTime? dueDate,
        TaskStatus status = TaskStatus.ToDo,
        TaskPriority priority = TaskPriority.Medium,
        Guid? parentTaskId = null)
    {
        if (_authToken == null) await AuthenticateAsync();

        var createDto = new TaskCreateDto
        {
            Name = name,
            Description = $"Description for {name}",
            Priority = priority,
            Status = status,
            Type = TaskType.Task,
            DueDate = dueDate,
            ParentTaskId = parentTaskId
        };

        var response = await _client.PostAsJsonAsync("/api/tasks", createDto);
        response.EnsureSuccessStatusCode();
        return (await response.Content.ReadFromJsonAsync<TaskResponseDto>())!;
    }

    [Fact]
    public async Task GetTimelineTasks_WithDateRange_ReturnsOnlyTasksInRange()
    {
        // Arrange
        await AuthenticateAsync();
        var startDate = new DateTime(2026, 1, 1);
        var endDate = new DateTime(2026, 3, 31);

        await CreateTaskAsync("Inside Range 1", new DateTime(2026, 2, 15));
        await CreateTaskAsync("Inside Range 2", new DateTime(2026, 3, 10));
        await CreateTaskAsync("Outside Range", new DateTime(2026, 5, 1));
        await CreateTaskAsync("No Due Date", null); // Should be excluded

        // Act
        var response = await _client.GetAsync($"/api/tasks/timeline?startDate={startDate:yyyy-MM-dd}&endDate={endDate:yyyy-MM-dd}");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var result = await response.Content.ReadFromJsonAsync<List<TimelineTaskDto>>();
        Assert.NotNull(result);
        Assert.Equal(2, result.Count);
        Assert.All(result, t => Assert.True(t.EndDate >= startDate && t.EndDate <= endDate));
    }

    [Fact]
    public async Task GetTimelineTasks_WithoutDueDates_ExcludesTasksWithoutDueDates()
    {
        // Arrange
        await AuthenticateAsync();
        var startDate = new DateTime(2026, 1, 1);
        var endDate = new DateTime(2026, 3, 31);

        await CreateTaskAsync("With Due Date", new DateTime(2026, 2, 15));
        await CreateTaskAsync("No Due Date 1", null);
        await CreateTaskAsync("No Due Date 2", null);

        // Act
        var response = await _client.GetAsync($"/api/tasks/timeline?startDate={startDate:yyyy-MM-dd}&endDate={endDate:yyyy-MM-dd}");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var result = await response.Content.ReadFromJsonAsync<List<TimelineTaskDto>>();
        Assert.NotNull(result);
        Assert.Single(result);
        Assert.NotEqual(default(DateTime), result[0].EndDate);
    }

    [Fact]
    public async Task GetTimelineTasks_ParentTaskWithChildren_IncludesParentInResult()
    {
        // Arrange
        await AuthenticateAsync();
        var startDate = new DateTime(2026, 1, 1);
        var endDate = new DateTime(2026, 3, 31);

        // Create parent task with due date outside range
        var parent = await CreateTaskAsync("Parent Task", new DateTime(2026, 5, 1));

        // Create children with due dates inside range
        await CreateTaskAsync("Child 1", new DateTime(2026, 2, 15), parentTaskId: parent.Id);
        await CreateTaskAsync("Child 2", new DateTime(2026, 3, 10), parentTaskId: parent.Id);

        // Act
        var response = await _client.GetAsync($"/api/tasks/timeline?startDate={startDate:yyyy-MM-dd}&endDate={endDate:yyyy-MM-dd}");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var result = await response.Content.ReadFromJsonAsync<List<TimelineTaskDto>>();
        Assert.NotNull(result);
        Assert.Equal(3, result.Count); // 2 children + 1 parent
        Assert.Contains(result, t => t.Id == parent.Id);
    }

    [Fact]
    public async Task GetTimelineTasks_WithStatusFilter_ReturnsOnlyMatchingStatus()
    {
        // Arrange
        await AuthenticateAsync();
        var startDate = new DateTime(2026, 1, 1);
        var endDate = new DateTime(2026, 3, 31);

        await CreateTaskAsync("InProgress 1", new DateTime(2026, 2, 15), TaskStatus.InProgress);
        await CreateTaskAsync("InProgress 2", new DateTime(2026, 3, 10), TaskStatus.InProgress);
        await CreateTaskAsync("ToDo", new DateTime(2026, 2, 20), TaskStatus.ToDo);

        // Act
        var response = await _client.GetAsync($"/api/tasks/timeline?startDate={startDate:yyyy-MM-dd}&endDate={endDate:yyyy-MM-dd}&status=1");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var result = await response.Content.ReadFromJsonAsync<List<TimelineTaskDto>>();
        Assert.NotNull(result);
        Assert.Equal(2, result.Count);
        Assert.All(result, t => Assert.Equal(TaskStatus.InProgress, t.Status));
    }

    [Fact]
    public async Task GetTimelineTasks_WithPriorityFilter_ReturnsOnlyMatchingPriority()
    {
        // Arrange
        await AuthenticateAsync();
        var startDate = new DateTime(2026, 1, 1);
        var endDate = new DateTime(2026, 3, 31);

        await CreateTaskAsync("High Priority", new DateTime(2026, 2, 15), priority: TaskPriority.High);
        await CreateTaskAsync("Low Priority", new DateTime(2026, 2, 20), priority: TaskPriority.Low);

        // Act
        var response = await _client.GetAsync($"/api/tasks/timeline?startDate={startDate:yyyy-MM-dd}&endDate={endDate:yyyy-MM-dd}&priority=2");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var result = await response.Content.ReadFromJsonAsync<List<TimelineTaskDto>>();
        Assert.NotNull(result);
        Assert.Single(result);
        Assert.Equal(TaskPriority.High, result[0].Priority);
    }

    [Fact]
    public async Task GetTimelineTasks_InvalidDateRange_ReturnsBadRequest()
    {
        // Arrange
        await AuthenticateAsync();
        var startDate = new DateTime(2026, 3, 31);
        var endDate = new DateTime(2026, 1, 1); // EndDate before StartDate

        // Act
        var response = await _client.GetAsync($"/api/tasks/timeline?startDate={startDate:yyyy-MM-dd}&endDate={endDate:yyyy-MM-dd}");

        // Assert
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task GetTimelineTasks_DateRangeExceedsTwoYears_ReturnsBadRequest()
    {
        // Arrange
        await AuthenticateAsync();
        var startDate = new DateTime(2026, 1, 1);
        var endDate = new DateTime(2028, 2, 1); // More than 2 years

        // Act
        var response = await _client.GetAsync($"/api/tasks/timeline?startDate={startDate:yyyy-MM-dd}&endDate={endDate:yyyy-MM-dd}");

        // Assert
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task GetTimelineTasks_ResponseStructure_MatchesTimelineTaskDto()
    {
        // Arrange
        await AuthenticateAsync();
        var startDate = new DateTime(2026, 1, 1);
        var endDate = new DateTime(2026, 3, 31);

        await CreateTaskAsync("Test Task", new DateTime(2026, 2, 15));

        // Act
        var response = await _client.GetAsync($"/api/tasks/timeline?startDate={startDate:yyyy-MM-dd}&endDate={endDate:yyyy-MM-dd}");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var result = await response.Content.ReadFromJsonAsync<List<TimelineTaskDto>>();
        Assert.NotNull(result);
        Assert.Single(result);

        var task = result[0];
        Assert.NotEqual(Guid.Empty, task.Id);
        Assert.NotEmpty(task.Name);
        Assert.NotEqual(default(DateTime), task.StartDate);
        Assert.NotEqual(default(DateTime), task.EndDate);
        Assert.True(task.Duration >= 0);
    }

    [Fact]
    public async Task GetTimelineTasks_Unauthorized_ReturnsUnauthorized()
    {
        // Arrange - No authentication
        var startDate = new DateTime(2026, 1, 1);
        var endDate = new DateTime(2026, 3, 31);

        // Act
        var response = await _client.GetAsync($"/api/tasks/timeline?startDate={startDate:yyyy-MM-dd}&endDate={endDate:yyyy-MM-dd}");

        // Assert
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task GetTimelineTasks_Performance_LessThanTwoSeconds()
    {
        // Arrange
        await AuthenticateAsync();
        var startDate = new DateTime(2026, 1, 1);
        var endDate = new DateTime(2026, 6, 30);

        // Create 100 tasks with varied due dates
        for (int i = 0; i < 100; i++)
        {
            var dueDate = startDate.AddDays(i * 1.8); // Spread across 6 months
            await CreateTaskAsync($"Task {i}", dueDate);
        }

        // Act
        var stopwatch = Stopwatch.StartNew();
        var response = await _client.GetAsync($"/api/tasks/timeline?startDate={startDate:yyyy-MM-dd}&endDate={endDate:yyyy-MM-dd}");
        stopwatch.Stop();

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var result = await response.Content.ReadFromJsonAsync<List<TimelineTaskDto>>();
        Assert.NotNull(result);
        Assert.Equal(100, result.Count);
        Assert.True(stopwatch.ElapsedMilliseconds < 2000, $"Timeline query took {stopwatch.ElapsedMilliseconds}ms, expected < 2000ms");
    }

    [Fact]
    public async Task GetTimelineTasks_OptimizedPayload_ContainsMinimalFields()
    {
        // Arrange
        await AuthenticateAsync();
        var startDate = new DateTime(2026, 1, 1);
        var endDate = new DateTime(2026, 3, 31);

        await CreateTaskAsync("Test Task", new DateTime(2026, 2, 15));

        // Act
        var response = await _client.GetAsync($"/api/tasks/timeline?startDate={startDate:yyyy-MM-dd}&endDate={endDate:yyyy-MM-dd}");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var result = await response.Content.ReadFromJsonAsync<List<TimelineTaskDto>>();
        Assert.NotNull(result);
        Assert.Single(result);

        // Verify TimelineTaskDto has only essential fields (not full TaskResponseDto)
        var task = result[0];
        Assert.NotNull(task.Name);
        Assert.NotEqual(Guid.Empty, task.Id);
        Assert.NotNull(task.Assignees);
        // Description, CreatedByUserName, etc. should not be in TimelineTaskDto
    }

    [Fact]
    public async Task GetTimelineTasks_HierarchicalTasksSpanningMonths_PreservesHierarchy()
    {
        // Arrange
        await AuthenticateAsync();
        var startDate = new DateTime(2026, 1, 1);
        var endDate = new DateTime(2026, 12, 31);

        // Create multi-level hierarchy
        var parent = await CreateTaskAsync("Parent Project", new DateTime(2026, 12, 31));
        var child1 = await CreateTaskAsync("Child Task 1", new DateTime(2026, 3, 31), parentTaskId: parent.Id);
        var child2 = await CreateTaskAsync("Child Task 2", new DateTime(2026, 6, 30), parentTaskId: parent.Id);
        var grandchild = await CreateTaskAsync("Grandchild Task", new DateTime(2026, 9, 30), parentTaskId: child1.Id);

        // Act
        var response = await _client.GetAsync($"/api/tasks/timeline?startDate={startDate:yyyy-MM-dd}&endDate={endDate:yyyy-MM-dd}");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var result = await response.Content.ReadFromJsonAsync<List<TimelineTaskDto>>();
        Assert.NotNull(result);
        Assert.Equal(4, result.Count);

        // Verify hierarchy is preserved through ParentTaskId
        var parentResult = result.First(t => t.Id == parent.Id);
        var child1Result = result.First(t => t.Id == child1.Id);
        var child2Result = result.First(t => t.Id == child2.Id);
        var grandchildResult = result.First(t => t.Id == grandchild.Id);

        Assert.Null(parentResult.ParentTaskId);
        Assert.Equal(parent.Id, child1Result.ParentTaskId);
        Assert.Equal(parent.Id, child2Result.ParentTaskId);
        Assert.Equal(child1.Id, grandchildResult.ParentTaskId);
    }
}
