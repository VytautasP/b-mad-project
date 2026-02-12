using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using TaskFlow.Abstractions.Constants;
using TaskFlow.Abstractions.DTOs.ActivityLogs;
using TaskFlow.Abstractions.DTOs.Auth;
using TaskFlow.Abstractions.DTOs.Comments;
using TaskFlow.Abstractions.DTOs.Shared;
using TaskFlow.Abstractions.DTOs.Task;
using TaskFlow.Abstractions.DTOs.TimeEntries;

namespace TaskFlow.Tests.Integration.Controllers;

public class ActivityLogControllerTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly HttpClient _client;

    public ActivityLogControllerTests(CustomWebApplicationFactory factory)
    {
        _client = factory.CreateClient();
    }

    private async Task<(string Token, Guid UserId, string Name)> RegisterAndLoginUserAsync(string email, string name)
    {
        var registerDto = new RegisterDto
        {
            Email = email,
            Password = "ValidPass123",
            Name = name
        };

        var registerResponse = await _client.PostAsJsonAsync("/api/auth/register", registerDto);
        var authResult = await registerResponse.Content.ReadFromJsonAsync<AuthResponseDto>();
        return (authResult!.Token, authResult.UserId, authResult.Name);
    }

    private async Task<Guid> CreateTaskAsync(string token, string taskName = "Activity Task")
    {
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        var dto = new TaskCreateDto
        {
            Name = taskName,
            Description = "Task for activity test",
            Priority = TaskPriority.Medium,
            Status = TaskFlow.Abstractions.Constants.TaskStatus.ToDo,
            Type = TaskType.Task
        };

        var response = await _client.PostAsJsonAsync("/api/tasks", dto);
        var task = await response.Content.ReadFromJsonAsync<TaskResponseDto>();
        return task!.Id;
    }

    [Fact]
    public async Task GetTaskActivity_ShouldReturn200_WithNewestFirstAndPagination()
    {
        // Arrange
        var owner = await RegisterAndLoginUserAsync($"owner-{Guid.NewGuid()}@example.com", "Owner User");
        var assignee = await RegisterAndLoginUserAsync($"assignee-{Guid.NewGuid()}@example.com", "Assignee User");
        var taskId = await CreateTaskAsync(owner.Token);

        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", owner.Token);

        await _client.PutAsJsonAsync($"/api/tasks/{taskId}", new TaskUpdateDto { Status = TaskFlow.Abstractions.Constants.TaskStatus.InProgress });
        await _client.PostAsJsonAsync($"/api/tasks/{taskId}/assignments", new AssignUserDto { UserId = assignee.UserId });
        await _client.PostAsJsonAsync($"/api/tasks/{taskId}/timeentries", new TimeEntryCreateDto { Minutes = 150, EntryType = EntryType.Manual });
        await _client.PostAsJsonAsync($"/api/tasks/{taskId}/comments", new CommentCreateDto { Content = "Test comment" });

        // Act
        var response = await _client.GetAsync($"/api/tasks/{taskId}/activity?page=1&pageSize=10");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var result = await response.Content.ReadFromJsonAsync<PaginatedResultDto<ActivityLogResponseDto>>();
        Assert.NotNull(result);
        Assert.True(result.Items.Count >= 5); // created + update + assign + time + comment
        Assert.Equal(1, result.Page);
        Assert.Equal(10, result.PageSize);

        var timestamps = result.Items.Select(i => i.Timestamp).ToList();
        var sorted = timestamps.OrderByDescending(t => t).ToList();
        Assert.Equal(sorted, timestamps);
    }

    [Fact]
    public async Task GetTaskActivity_ShouldReturn401_WhenUserDoesNotOwnTask()
    {
        // Arrange
        var owner = await RegisterAndLoginUserAsync($"owner2-{Guid.NewGuid()}@example.com", "Owner User");
        var other = await RegisterAndLoginUserAsync($"other-{Guid.NewGuid()}@example.com", "Other User");
        var taskId = await CreateTaskAsync(owner.Token);

        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", other.Token);

        // Act
        var response = await _client.GetAsync($"/api/tasks/{taskId}/activity?page=1&pageSize=20");

        // Assert
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task GetTaskActivity_ShouldReturn404_WhenTaskNotFound()
    {
        // Arrange
        var user = await RegisterAndLoginUserAsync($"missing-{Guid.NewGuid()}@example.com", "Missing User");
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", user.Token);

        // Act
        var response = await _client.GetAsync($"/api/tasks/{Guid.NewGuid()}/activity?page=1&pageSize=20");

        // Assert
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }
}
