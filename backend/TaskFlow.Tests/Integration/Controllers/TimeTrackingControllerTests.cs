using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using TaskFlow.Abstractions.Constants;
using TaskFlow.Abstractions.DTOs.Auth;
using TaskFlow.Abstractions.DTOs.Task;
using TaskFlow.Abstractions.DTOs.Shared;
using TaskFlow.Abstractions.DTOs.TimeEntries;

namespace TaskFlow.Tests.Integration.Controllers;

public class TimeTrackingControllerTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;
    private readonly HttpClient _client;

    public TimeTrackingControllerTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
        _client = _factory.CreateClient();
    }

    private async Task<string> RegisterAndLoginUserAsync(string email, string password = "ValidPass123")
    {
        var registerDto = new RegisterDto
        {
            Email = email,
            Password = password,
            Name = "Test User"
        };

        var registerResponse = await _client.PostAsJsonAsync("/api/auth/register", registerDto);
        var authResult = await registerResponse.Content.ReadFromJsonAsync<AuthResponseDto>();
        return authResult!.Token;
    }

    private async Task<Guid> CreateTaskAsync(string token, string taskName = "Test Task")
    {
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        var taskDto = new TaskCreateDto
        {
            Name = taskName,
            Description = "Test Description",
            Priority = TaskPriority.Medium,
            Status = TaskFlow.Abstractions.Constants.TaskStatus.ToDo,
            Type = TaskType.Task
        };

        var response = await _client.PostAsJsonAsync("/api/tasks", taskDto);
        var task = await response.Content.ReadFromJsonAsync<TaskResponseDto>();
        return task!.Id;
    }

    [Fact]
    public async System.Threading.Tasks.Task PostTimeEntry_ShouldReturn201_WhenValidRequest()
    {
        // Arrange
        var email = "timeentry" + Guid.NewGuid() + "@example.com";
        var token = await RegisterAndLoginUserAsync(email);
        var taskId = await CreateTaskAsync(token);

        var timeEntryDto = new TimeEntryCreateDto
        {
            Minutes = 60,
            Note = "Worked on feature",
            EntryType = EntryType.Manual,
            EntryDate = DateTime.UtcNow
        };

        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        // Act
        var response = await _client.PostAsJsonAsync($"/api/tasks/{taskId}/timeentries", timeEntryDto);

        // Assert
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);

        var result = await response.Content.ReadFromJsonAsync<TimeEntryResponseDto>();
        Assert.NotNull(result);
        Assert.NotEqual(Guid.Empty, result.Id);
        Assert.Equal(taskId, result.TaskId);
        Assert.Equal(60, result.Minutes);
        Assert.Equal("Worked on feature", result.Note);
        Assert.Equal("Manual", result.EntryType);
    }

    [Fact]
    public async System.Threading.Tasks.Task PostTimeEntry_ShouldReturn400_WhenMinutesInvalid()
    {
        // Arrange
        var email = "invalidminutes" + Guid.NewGuid() + "@example.com";
        var token = await RegisterAndLoginUserAsync(email);
        var taskId = await CreateTaskAsync(token);

        var timeEntryDto = new TimeEntryCreateDto
        {
            Minutes = 0, // Invalid
            EntryType = EntryType.Manual
        };

        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        // Act
        var response = await _client.PostAsJsonAsync($"/api/tasks/{taskId}/timeentries", timeEntryDto);

        // Assert
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async System.Threading.Tasks.Task GetTimeEntries_ShouldReturn200WithList_WhenEntriesExist()
    {
        // Arrange
        var email = "gettimeentries" + Guid.NewGuid() + "@example.com";
        var token = await RegisterAndLoginUserAsync(email);
        var taskId = await CreateTaskAsync(token);

        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        // Create 3 time entries
        for (int i = 1; i <= 3; i++)
        {
            var timeEntryDto = new TimeEntryCreateDto
            {
                Minutes = 30 * i,
                Note = $"Entry {i}",
                EntryType = EntryType.Manual
            };
            await _client.PostAsJsonAsync($"/api/tasks/{taskId}/timeentries", timeEntryDto);
        }

        // Act
        var response = await _client.GetAsync($"/api/tasks/{taskId}/timeentries");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var result = await response.Content.ReadFromJsonAsync<List<TimeEntryResponseDto>>();
        Assert.NotNull(result);
        Assert.Equal(3, result.Count);
    }

    [Fact]
    public async System.Threading.Tasks.Task DeleteTimeEntry_ShouldReturn204_WhenUserIsCreator()
    {
        // Arrange
        var email = "deleteentry" + Guid.NewGuid() + "@example.com";
        var token = await RegisterAndLoginUserAsync(email);
        var taskId = await CreateTaskAsync(token);

        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var timeEntryDto = new TimeEntryCreateDto
        {
            Minutes = 60,
            EntryType = EntryType.Manual
        };

        var createResponse = await _client.PostAsJsonAsync($"/api/tasks/{taskId}/timeentries", timeEntryDto);
        var createdEntry = await createResponse.Content.ReadFromJsonAsync<TimeEntryResponseDto>();

        // Act
        var response = await _client.DeleteAsync($"/api/timeentries/{createdEntry!.Id}");

        // Assert
        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);

        // Verify the entry is deleted
        var getResponse = await _client.GetAsync($"/api/tasks/{taskId}/timeentries");
        var entries = await getResponse.Content.ReadFromJsonAsync<List<TimeEntryResponseDto>>();
        Assert.Empty(entries!);
    }

    [Fact]
    public async System.Threading.Tasks.Task DeleteTimeEntry_ShouldReturn403_WhenUserIsNotCreator()
    {
        // Arrange
        var email1 = "user1" + Guid.NewGuid() + "@example.com";
        var email2 = "user2" + Guid.NewGuid() + "@example.com";
        var token1 = await RegisterAndLoginUserAsync(email1);
        var token2 = await RegisterAndLoginUserAsync(email2);

        var taskId = await CreateTaskAsync(token1);

        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token1);

        var timeEntryDto = new TimeEntryCreateDto
        {
            Minutes = 60,
            EntryType = EntryType.Manual
        };

        var createResponse = await _client.PostAsJsonAsync($"/api/tasks/{taskId}/timeentries", timeEntryDto);
        var createdEntry = await createResponse.Content.ReadFromJsonAsync<TimeEntryResponseDto>();

        // Switch to user 2
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token2);

        // Act
        var response = await _client.DeleteAsync($"/api/timeentries/{createdEntry!.Id}");

        // Assert
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async System.Threading.Tasks.Task GetTasks_ShouldIncludeTotalLoggedMinutes_WhenTimeEntriesExist()
    {
        // Arrange
        var email = "totalminutes" + Guid.NewGuid() + "@example.com";
        var token = await RegisterAndLoginUserAsync(email);
        var taskId = await CreateTaskAsync(token, "Task with Time");

        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        // Create 2 time entries (60 + 120 = 180 minutes)
        await _client.PostAsJsonAsync($"/api/tasks/{taskId}/timeentries", new TimeEntryCreateDto
        {
            Minutes = 60,
            EntryType = EntryType.Manual
        });

        await _client.PostAsJsonAsync($"/api/tasks/{taskId}/timeentries", new TimeEntryCreateDto
        {
            Minutes = 120,
            EntryType = EntryType.Timer
        });

        // Act
        var response = await _client.GetAsync("/api/tasks?myTasks=true");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var result = await response.Content.ReadFromJsonAsync<PaginatedResultDto<TaskResponseDto>>();
        Assert.NotNull(result);
        
        var taskWithTime = result.Items.FirstOrDefault(t => t.Id == taskId);
        Assert.NotNull(taskWithTime);
        Assert.Equal(180, taskWithTime.TotalLoggedMinutes);
    }
}
