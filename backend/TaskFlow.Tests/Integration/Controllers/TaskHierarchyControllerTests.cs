using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using TaskFlow.Abstractions.Constants;
using TaskFlow.Abstractions.DTOs.Auth;
using TaskFlow.Abstractions.DTOs.Task;
using TaskFlow.Infrastructure.Data;

namespace TaskFlow.Tests.Integration.Controllers;

public class TaskHierarchyControllerTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;
    private readonly HttpClient _client;
    private string? _authToken;
    private Guid _userId;

    public TaskHierarchyControllerTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
        _client = _factory.CreateClient();
    }

    private async Task AuthenticateAsync()
    {
        var registerDto = new RegisterDto
        {
            Email = "hierarchytest" + Guid.NewGuid() + "@example.com",
            Password = "TestPass123",
            Name = "Hierarchy Test User"
        };

        var response = await _client.PostAsJsonAsync("/api/auth/register", registerDto);
        var authResponse = await response.Content.ReadFromJsonAsync<AuthResponseDto>();
        
        _authToken = authResponse!.Token;
        _userId = authResponse.UserId;
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", _authToken);
    }

    private async Task<TaskResponseDto> CreateTaskAsync(string name, Guid? parentTaskId = null)
    {
        if (_authToken == null) await AuthenticateAsync();

        var createDto = new TaskCreateDto
        {
            Name = name,
            Description = $"Test task: {name}",
            ParentTaskId = parentTaskId,
            Priority = TaskPriority.Medium,
            Status = TaskFlow.Abstractions.Constants.TaskStatus.ToDo,
            Type = TaskType.Task
        };

        var response = await _client.PostAsJsonAsync("/api/tasks", createDto);
        response.EnsureSuccessStatusCode();
        return (await response.Content.ReadFromJsonAsync<TaskResponseDto>())!;
    }

    [Fact]
    public async Task GetChildren_ReturnsImmediateChildren()
    {
        // Arrange
        await AuthenticateAsync();
        
        var root = await CreateTaskAsync("Root Task");
        var child1 = await CreateTaskAsync("Child 1", root.Id);
        var child2 = await CreateTaskAsync("Child 2", root.Id);
        var grandchild = await CreateTaskAsync("Grandchild", child1.Id);

        // Act
        var response = await _client.GetAsync($"/api/tasks/{root.Id}/children");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var children = await response.Content.ReadFromJsonAsync<List<TaskResponseDto>>();
        Assert.NotNull(children);
        Assert.Equal(2, children.Count);
        Assert.Contains(children, c => c.Id == child1.Id);
        Assert.Contains(children, c => c.Id == child2.Id);
        Assert.DoesNotContain(children, c => c.Id == grandchild.Id); // Should not include grandchild
    }

    [Fact]
    public async Task GetAncestors_ReturnsParentChain()
    {
        // Arrange
        await AuthenticateAsync();
        
        var root = await CreateTaskAsync("Root");
        var middle = await CreateTaskAsync("Middle", root.Id);
        var leaf = await CreateTaskAsync("Leaf", middle.Id);

        // Act
        var response = await _client.GetAsync($"/api/tasks/{leaf.Id}/ancestors");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var ancestors = await response.Content.ReadFromJsonAsync<List<TaskHierarchyDto>>();
        Assert.NotNull(ancestors);
        Assert.Equal(2, ancestors.Count);
        
        // Ancestors should be ordered from farthest to closest (root -> middle)
        Assert.Equal(root.Id, ancestors[0].TaskId);
        Assert.Equal(middle.Id, ancestors[1].TaskId);
    }

    [Fact]
    public async Task GetDescendants_ReturnsFullSubtree()
    {
        // Arrange
        await AuthenticateAsync();
        
        var root = await CreateTaskAsync("Root");
        var child1 = await CreateTaskAsync("Child 1", root.Id);
        var child2 = await CreateTaskAsync("Child 2", root.Id);
        var grandchild1 = await CreateTaskAsync("Grandchild 1", child1.Id);
        var grandchild2 = await CreateTaskAsync("Grandchild 2", child1.Id);

        // Act
        var response = await _client.GetAsync($"/api/tasks/{root.Id}/descendants");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var descendants = await response.Content.ReadFromJsonAsync<List<TaskHierarchyDto>>();
        Assert.NotNull(descendants);
        Assert.Equal(4, descendants.Count); // All descendants
        
        // Check depths
        var child1Dto = descendants.First(d => d.TaskId == child1.Id);
        var grandchild1Dto = descendants.First(d => d.TaskId == grandchild1.Id);
        Assert.Equal(1, child1Dto.Depth);
        Assert.Equal(2, grandchild1Dto.Depth);
    }

    [Fact]
    public async Task SetParent_SuccessfullyAssignsParent()
    {
        // Arrange
        await AuthenticateAsync();
        
        var parent = await CreateTaskAsync("Parent");
        var child = await CreateTaskAsync("Child");

        var setParentDto = new SetParentDto { ParentTaskId = parent.Id };

        // Act
        var response = await _client.PutAsJsonAsync($"/api/tasks/{child.Id}/parent", setParentDto);

        // Assert
        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
        
        // Verify parent was set
        var taskResponse = await _client.GetAsync($"/api/tasks/{child.Id}");
        var task = await taskResponse.Content.ReadFromJsonAsync<TaskResponseDto>();
        Assert.Equal(parent.Id, task!.ParentTaskId);
    }

    [Fact]
    public async Task SetParent_RejectsCircularReference()
    {
        // Arrange
        await AuthenticateAsync();
        
        var parent = await CreateTaskAsync("Parent");
        var child = await CreateTaskAsync("Child", parent.Id);

        // Try to set child as parent of parent (would create cycle)
        var setParentDto = new SetParentDto { ParentTaskId = child.Id };

        // Act
        var response = await _client.PutAsJsonAsync($"/api/tasks/{parent.Id}/parent", setParentDto);

        // Assert
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task RemoveParent_SuccessfullyRemovesParent()
    {
        // Arrange
        await AuthenticateAsync();
        
        var parent = await CreateTaskAsync("Parent");
        var child = await CreateTaskAsync("Child", parent.Id);

        // Act
        var response = await _client.DeleteAsync($"/api/tasks/{child.Id}/parent");

        // Assert
        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
        
        // Verify parent was removed
        var taskResponse = await _client.GetAsync($"/api/tasks/{child.Id}");
        var task = await taskResponse.Content.ReadFromJsonAsync<TaskResponseDto>();
        Assert.Null(task!.ParentTaskId);
    }

    [Fact]
    public async Task GetChildren_UnauthorizedForOtherUsersTask()
    {
        // Arrange
        await AuthenticateAsync();
        var task = await CreateTaskAsync("My Task");

        // Create another user
        var otherUserEmail = "otheruser" + Guid.NewGuid() + "@example.com";
        var registerDto = new RegisterDto
        {
            Email = otherUserEmail,
            Password = "OtherPass123",
            Name = "Other User"
        };
        var registerResponse = await _client.PostAsJsonAsync("/api/auth/register", registerDto);
        var otherUserAuth = await registerResponse.Content.ReadFromJsonAsync<AuthResponseDto>();
        
        // Switch to other user
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", otherUserAuth!.Token);

        // Act
        var response = await _client.GetAsync($"/api/tasks/{task.Id}/children");

        // Assert
        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }
}
