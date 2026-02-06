using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using TaskFlow.Abstractions.Constants;
using TaskFlow.Abstractions.DTOs.Auth;
using TaskFlow.Abstractions.DTOs.Comments;
using TaskFlow.Abstractions.DTOs.Task;

namespace TaskFlow.Tests.Integration.Controllers;

public class CommentsControllerTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;
    private readonly HttpClient _client;

    public CommentsControllerTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
        _client = _factory.CreateClient();
    }

    private async Task<(string Token, Guid UserId)> RegisterAndLoginUserAsync(string email, string name = "Test User", string password = "ValidPass123")
    {
        var registerDto = new RegisterDto
        {
            Email = email,
            Password = password,
            Name = name
        };

        var registerResponse = await _client.PostAsJsonAsync("/api/auth/register", registerDto);
        var authResult = await registerResponse.Content.ReadFromJsonAsync<AuthResponseDto>();
        return (authResult!.Token, authResult.UserId);
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

    #region Create Comment Tests

    [Fact]
    public async Task PostComment_ShouldReturn201_WhenValidRequest()
    {
        // Arrange
        var email = "comment-create-" + Guid.NewGuid() + "@example.com";
        var (token, _) = await RegisterAndLoginUserAsync(email);
        var taskId = await CreateTaskAsync(token);

        var commentDto = new CommentCreateDto
        {
            Content = "This is a test comment"
        };

        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        // Act
        var response = await _client.PostAsJsonAsync($"/api/tasks/{taskId}/comments", commentDto);

        // Assert
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);

        var result = await response.Content.ReadFromJsonAsync<CommentResponseDto>();
        Assert.NotNull(result);
        Assert.NotEqual(Guid.Empty, result.Id);
        Assert.Equal(taskId, result.TaskId);
        Assert.Equal("This is a test comment", result.Content);
        Assert.False(result.IsEdited);
        Assert.False(result.IsDeleted);
        Assert.NotEmpty(result.AuthorName);
    }

    [Fact]
    public async Task PostComment_ShouldReturn404_WhenTaskNotFound()
    {
        // Arrange
        var email = "comment-notask-" + Guid.NewGuid() + "@example.com";
        var (token, _) = await RegisterAndLoginUserAsync(email);
        var nonExistentTaskId = Guid.NewGuid();

        var commentDto = new CommentCreateDto
        {
            Content = "Comment on non-existent task"
        };

        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        // Act
        var response = await _client.PostAsJsonAsync($"/api/tasks/{nonExistentTaskId}/comments", commentDto);

        // Assert
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    #endregion

    #region Get Task Comments Tests

    [Fact]
    public async Task GetComments_ShouldReturn200_WithChronologicalList()
    {
        // Arrange
        var email = "comment-get-" + Guid.NewGuid() + "@example.com";
        var (token, _) = await RegisterAndLoginUserAsync(email);
        var taskId = await CreateTaskAsync(token);

        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        // Create multiple comments
        for (int i = 1; i <= 3; i++)
        {
            var commentDto = new CommentCreateDto { Content = $"Comment {i}" };
            await _client.PostAsJsonAsync($"/api/tasks/{taskId}/comments", commentDto);
        }

        // Act
        var response = await _client.GetAsync($"/api/tasks/{taskId}/comments");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var result = await response.Content.ReadFromJsonAsync<List<CommentResponseDto>>();
        Assert.NotNull(result);
        Assert.Equal(3, result.Count);
        // Chronological order (ASC)
        Assert.Equal("Comment 1", result[0].Content);
        Assert.Equal("Comment 2", result[1].Content);
        Assert.Equal("Comment 3", result[2].Content);
    }

    [Fact]
    public async Task GetComments_ShouldReturn404_WhenTaskNotFound()
    {
        // Arrange
        var email = "comment-getnf-" + Guid.NewGuid() + "@example.com";
        var (token, _) = await RegisterAndLoginUserAsync(email);
        var nonExistentTaskId = Guid.NewGuid();

        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        // Act
        var response = await _client.GetAsync($"/api/tasks/{nonExistentTaskId}/comments");

        // Assert
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    #endregion

    #region Update Comment Tests

    [Fact]
    public async Task PutComment_ShouldReturn200_WhenAuthorUpdates()
    {
        // Arrange
        var email = "comment-update-" + Guid.NewGuid() + "@example.com";
        var (token, _) = await RegisterAndLoginUserAsync(email);
        var taskId = await CreateTaskAsync(token);

        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        // Create comment
        var createDto = new CommentCreateDto { Content = "Original content" };
        var createResponse = await _client.PostAsJsonAsync($"/api/tasks/{taskId}/comments", createDto);
        var createdComment = await createResponse.Content.ReadFromJsonAsync<CommentResponseDto>();

        // Act
        var updateDto = new CommentUpdateDto { Content = "Updated content" };
        var response = await _client.PutAsJsonAsync($"/api/comments/{createdComment!.Id}", updateDto);

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var result = await response.Content.ReadFromJsonAsync<CommentResponseDto>();
        Assert.NotNull(result);
        Assert.Equal("Updated content", result.Content);
        Assert.True(result.IsEdited);
        Assert.NotNull(result.ModifiedDate);
    }

    [Fact]
    public async Task PutComment_ShouldReturn403_WhenNonAuthorUpdates()
    {
        // Arrange
        var email1 = "comment-upd-user1-" + Guid.NewGuid() + "@example.com";
        var email2 = "comment-upd-user2-" + Guid.NewGuid() + "@example.com";
        var (token1, _) = await RegisterAndLoginUserAsync(email1);
        var (token2, _) = await RegisterAndLoginUserAsync(email2);

        var taskId = await CreateTaskAsync(token1);

        // User 1 creates comment
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token1);
        var createDto = new CommentCreateDto { Content = "User 1's comment" };
        var createResponse = await _client.PostAsJsonAsync($"/api/tasks/{taskId}/comments", createDto);
        var createdComment = await createResponse.Content.ReadFromJsonAsync<CommentResponseDto>();

        // User 2 tries to update
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token2);
        var updateDto = new CommentUpdateDto { Content = "Trying to edit someone else's comment" };

        // Act
        var response = await _client.PutAsJsonAsync($"/api/comments/{createdComment!.Id}", updateDto);

        // Assert
        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    #endregion

    #region Delete Comment Tests

    [Fact]
    public async Task DeleteComment_ShouldReturn204_WhenAuthorDeletes()
    {
        // Arrange
        var email = "comment-delete-" + Guid.NewGuid() + "@example.com";
        var (token, _) = await RegisterAndLoginUserAsync(email);
        var taskId = await CreateTaskAsync(token);

        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        // Create comment
        var createDto = new CommentCreateDto { Content = "To be deleted" };
        var createResponse = await _client.PostAsJsonAsync($"/api/tasks/{taskId}/comments", createDto);
        var createdComment = await createResponse.Content.ReadFromJsonAsync<CommentResponseDto>();

        // Act
        var response = await _client.DeleteAsync($"/api/comments/{createdComment!.Id}");

        // Assert
        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);

        // Verify comment no longer appears in GET
        var getResponse = await _client.GetAsync($"/api/tasks/{taskId}/comments");
        var comments = await getResponse.Content.ReadFromJsonAsync<List<CommentResponseDto>>();
        Assert.NotNull(comments);
        Assert.Empty(comments);
    }

    [Fact]
    public async Task DeleteComment_ShouldReturn403_WhenNonAuthorDeletes()
    {
        // Arrange
        var email1 = "comment-del-user1-" + Guid.NewGuid() + "@example.com";
        var email2 = "comment-del-user2-" + Guid.NewGuid() + "@example.com";
        var (token1, _) = await RegisterAndLoginUserAsync(email1);
        var (token2, _) = await RegisterAndLoginUserAsync(email2);

        var taskId = await CreateTaskAsync(token1);

        // User 1 creates comment
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token1);
        var createDto = new CommentCreateDto { Content = "User 1's comment" };
        var createResponse = await _client.PostAsJsonAsync($"/api/tasks/{taskId}/comments", createDto);
        var createdComment = await createResponse.Content.ReadFromJsonAsync<CommentResponseDto>();

        // User 2 tries to delete
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token2);

        // Act
        var response = await _client.DeleteAsync($"/api/comments/{createdComment!.Id}");

        // Assert
        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    #endregion

    #region Mention Tests

    [Fact]
    public async Task PostComment_WithMentionOfExistingUser_IncludesMentionedUserId()
    {
        // Arrange
        var email1 = "comment-mention1-" + Guid.NewGuid() + "@example.com";
        var mentionName = "MentionTarget" + Guid.NewGuid().ToString("N").Substring(0, 6);
        var email2 = "mentioneduser-" + Guid.NewGuid() + "@example.com";
        var (token1, _) = await RegisterAndLoginUserAsync(email1, "Author User");
        var (_, user2Id) = await RegisterAndLoginUserAsync(email2, mentionName);

        var taskId = await CreateTaskAsync(token1);

        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token1);

        var commentDto = new CommentCreateDto
        {
            Content = $"Hey @{mentionName} please check this"
        };

        // Act
        var response = await _client.PostAsJsonAsync($"/api/tasks/{taskId}/comments", commentDto);

        // Assert
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);

        var result = await response.Content.ReadFromJsonAsync<CommentResponseDto>();
        Assert.NotNull(result);
        Assert.Contains(user2Id, result.MentionedUserIds);
    }

    [Fact]
    public async Task PostComment_WithMentionOfNonExistingUser_MentionedUserIdsEmpty()
    {
        // Arrange
        var email = "comment-nomention-" + Guid.NewGuid() + "@example.com";
        var (token, _) = await RegisterAndLoginUserAsync(email);
        var taskId = await CreateTaskAsync(token);

        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var commentDto = new CommentCreateDto
        {
            Content = "Hey @nonexistentperson check this"
        };

        // Act
        var response = await _client.PostAsJsonAsync($"/api/tasks/{taskId}/comments", commentDto);

        // Assert
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);

        var result = await response.Content.ReadFromJsonAsync<CommentResponseDto>();
        Assert.NotNull(result);
        Assert.Empty(result.MentionedUserIds);
    }

    #endregion
}