using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using TaskFlow.Abstractions.Constants;
using TaskFlow.Abstractions.DTOs.Auth;
using TaskFlow.Abstractions.DTOs.Task;
using TaskFlow.Abstractions.DTOs.Shared;

namespace TaskFlow.Tests.Integration.Controllers;

public class TaskAssignmentControllerTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;
    private readonly HttpClient _client;
    private string? _authToken;
    private Guid _userId;
    private string? _secondAuthToken;
    private Guid _secondUserId;

    public TaskAssignmentControllerTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
        _client = _factory.CreateClient();
    }

    private async Task AuthenticateAsync()
    {
        var registerDto = new RegisterDto
        {
            Email = "assigntest" + Guid.NewGuid() + "@example.com",
            Password = "TestPass123",
            Name = "Assignment Test User"
        };

        var response = await _client.PostAsJsonAsync("/api/auth/register", registerDto);
        var authResponse = await response.Content.ReadFromJsonAsync<AuthResponseDto>();
        
        _authToken = authResponse!.Token;
        _userId = authResponse.UserId;
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", _authToken);
    }

    private async Task CreateSecondUserAsync()
    {
        var registerDto = new RegisterDto
        {
            Email = "seconduser" + Guid.NewGuid() + "@example.com",
            Password = "TestPass123",
            Name = "Second Test User"
        };

        var response = await _client.PostAsJsonAsync("/api/auth/register", registerDto);
        var authResponse = await response.Content.ReadFromJsonAsync<AuthResponseDto>();
        
        _secondAuthToken = authResponse!.Token;
        _secondUserId = authResponse.UserId;
    }

    private async Task<TaskResponseDto> CreateTaskAsync(string name)
    {
        if (_authToken == null) await AuthenticateAsync();

        var createDto = new TaskCreateDto
        {
            Name = name,
            Description = $"Test task: {name}",
            Priority = TaskPriority.Medium,
            Status = TaskFlow.Abstractions.Constants.TaskStatus.ToDo,
            Type = TaskType.Task
        };

        var response = await _client.PostAsJsonAsync("/api/tasks", createDto);
        response.EnsureSuccessStatusCode();
        return (await response.Content.ReadFromJsonAsync<TaskResponseDto>())!;
    }

    [Fact]
    public async Task AssignUser_WithValidUserId_Succeeds()
    {
        // Arrange
        await AuthenticateAsync();
        await CreateSecondUserAsync();
        var task = await CreateTaskAsync("Task for Assignment");

        var assignDto = new AssignUserDto { UserId = _secondUserId };

        // Act
        var response = await _client.PostAsJsonAsync($"/api/tasks/{task.Id}/assignments", assignDto);

        // Assert
        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
    }

    [Fact]
    public async Task AssignUser_WithInvalidUserId_ReturnsNotFound()
    {
        // Arrange
        await AuthenticateAsync();
        var task = await CreateTaskAsync("Task for Assignment");

        var assignDto = new AssignUserDto { UserId = Guid.NewGuid() };

        // Act
        var response = await _client.PostAsJsonAsync($"/api/tasks/{task.Id}/assignments", assignDto);

        // Assert
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task AssignUser_AsNonOwnerNonAssignee_ReturnsForbidden()
    {
        // Arrange
        await AuthenticateAsync();
        var task = await CreateTaskAsync("Task for Assignment");
        await CreateSecondUserAsync();

        // Switch to second user (who is not owner or assignee)
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", _secondAuthToken);

        var assignDto = new AssignUserDto { UserId = _userId };

        // Act
        var response = await _client.PostAsJsonAsync($"/api/tasks/{task.Id}/assignments", assignDto);

        // Assert
        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task UnassignUser_Successfully_ReturnsNoContent()
    {
        // Arrange
        await AuthenticateAsync();
        await CreateSecondUserAsync();
        var task = await CreateTaskAsync("Task for Unassignment");

        // Assign user first
        var assignDto = new AssignUserDto { UserId = _secondUserId };
        await _client.PostAsJsonAsync($"/api/tasks/{task.Id}/assignments", assignDto);

        // Act
        var response = await _client.DeleteAsync($"/api/tasks/{task.Id}/assignments/{_secondUserId}");

        // Assert
        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
    }

    [Fact]
    public async Task UnassignUser_WhenNotAssigned_ReturnsNotFound()
    {
        // Arrange
        await AuthenticateAsync();
        await CreateSecondUserAsync();
        var task = await CreateTaskAsync("Task for Unassignment");

        // Act
        var response = await _client.DeleteAsync($"/api/tasks/{task.Id}/assignments/{_secondUserId}");

        // Assert
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task UnassignUser_AsUnauthorizedUser_ReturnsForbidden()
    {
        // Arrange
        await AuthenticateAsync();
        await CreateSecondUserAsync();
        var task = await CreateTaskAsync("Task for Unassignment");

        // Assign second user
        var assignDto = new AssignUserDto { UserId = _secondUserId };
        await _client.PostAsJsonAsync($"/api/tasks/{task.Id}/assignments", assignDto);

        // Create a third user
        var thirdUserDto = new RegisterDto
        {
            Email = "thirduser" + Guid.NewGuid() + "@example.com",
            Password = "TestPass123",
            Name = "Third Test User"
        };
        var thirdResponse = await _client.PostAsJsonAsync("/api/auth/register", thirdUserDto);
        var thirdAuthResponse = await thirdResponse.Content.ReadFromJsonAsync<AuthResponseDto>();
        
        // Switch to third user (unauthorized)
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", thirdAuthResponse!.Token);

        // Act
        var response = await _client.DeleteAsync($"/api/tasks/{task.Id}/assignments/{_secondUserId}");

        // Assert
        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task GetTaskAssignees_ReturnsAllAssignedUsers()
    {
        // Arrange
        await AuthenticateAsync();
        await CreateSecondUserAsync();
        var task = await CreateTaskAsync("Task with Multiple Assignees");

        // Assign second user
        var assignDto = new AssignUserDto { UserId = _secondUserId };
        await _client.PostAsJsonAsync($"/api/tasks/{task.Id}/assignments", assignDto);

        // Act
        var response = await _client.GetAsync($"/api/tasks/{task.Id}/assignments");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var assignees = await response.Content.ReadFromJsonAsync<List<TaskAssignmentDto>>();
        Assert.NotNull(assignees);
        Assert.Single(assignees);
        Assert.Equal(_secondUserId, assignees[0].UserId);
        Assert.Equal("Second Test User", assignees[0].UserName);
    }

    [Fact]
    public async Task GetTasksWithMyTasksTrue_ReturnsAssignedTasks()
    {
        // Arrange
        await AuthenticateAsync();
        await CreateSecondUserAsync();
        
        // First user creates a task
        var task = await CreateTaskAsync("Task for Second User");

        // Assign second user to the task
        var assignDto = new AssignUserDto { UserId = _secondUserId };
        await _client.PostAsJsonAsync($"/api/tasks/{task.Id}/assignments", assignDto);

        // Switch to second user
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", _secondAuthToken);

        // Act
        var response = await _client.GetAsync($"/api/tasks?assigneeId={_secondUserId}");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var result = await response.Content.ReadFromJsonAsync<PaginatedResultDto<TaskResponseDto>>();
        Assert.NotNull(result);
        Assert.Single(result.Items);
        Assert.Equal(task.Id, result.Items[0].Id);
    }

    [Fact]
    public async Task MultipleUsersAssignedToSameTask_Succeeds()
    {
        // Arrange
        await AuthenticateAsync();
        await CreateSecondUserAsync();
        
        // Create third user
        var thirdUserDto = new RegisterDto
        {
            Email = "thirduser" + Guid.NewGuid() + "@example.com",
            Password = "TestPass123",
            Name = "Third Test User"
        };
        var thirdResponse = await _client.PostAsJsonAsync("/api/auth/register", thirdUserDto);
        var thirdAuthResponse = await thirdResponse.Content.ReadFromJsonAsync<AuthResponseDto>();
        var thirdUserId = thirdAuthResponse!.UserId;

        var task = await CreateTaskAsync("Task with Multiple Users");

        // Assign second and third users
        await _client.PostAsJsonAsync($"/api/tasks/{task.Id}/assignments", new AssignUserDto { UserId = _secondUserId });
        await _client.PostAsJsonAsync($"/api/tasks/{task.Id}/assignments", new AssignUserDto { UserId = thirdUserId });

        // Act
        var response = await _client.GetAsync($"/api/tasks/{task.Id}/assignments");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var assignees = await response.Content.ReadFromJsonAsync<List<TaskAssignmentDto>>();
        Assert.NotNull(assignees);
        Assert.Equal(2, assignees.Count);
        Assert.Contains(assignees, a => a.UserId == _secondUserId);
        Assert.Contains(assignees, a => a.UserId == thirdUserId);
    }

    [Fact]
    public async Task UserAssignedToMultipleTasks_Succeeds()
    {
        // Arrange
        await AuthenticateAsync();
        await CreateSecondUserAsync();
        
        var task1 = await CreateTaskAsync("Task 1");
        var task2 = await CreateTaskAsync("Task 2");

        // Assign second user to both tasks
        await _client.PostAsJsonAsync($"/api/tasks/{task1.Id}/assignments", new AssignUserDto { UserId = _secondUserId });
        await _client.PostAsJsonAsync($"/api/tasks/{task2.Id}/assignments", new AssignUserDto { UserId = _secondUserId });

        // Switch to second user
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", _secondAuthToken);

        // Act
        var response = await _client.GetAsync($"/api/tasks?assigneeId={_secondUserId}");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var result = await response.Content.ReadFromJsonAsync<PaginatedResultDto<TaskResponseDto>>();
        Assert.NotNull(result);
        Assert.Equal(2, result.Items.Count);
        Assert.Contains(result.Items, t => t.Id == task1.Id);
        Assert.Contains(result.Items, t => t.Id == task2.Id);
    }
}
