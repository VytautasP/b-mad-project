using Microsoft.EntityFrameworkCore;
using TaskFlow.Abstractions.Constants;
using TaskFlow.Infrastructure.Data;
using TaskFlow.Infrastructure.Repositories;
using TaskEntity = TaskFlow.Abstractions.Entities.Task;
using TaskStatus = TaskFlow.Abstractions.Constants.TaskStatus;
using TaskPriority = TaskFlow.Abstractions.Constants.TaskPriority;
using TaskType = TaskFlow.Abstractions.Constants.TaskType;

namespace TaskFlow.Tests.Unit.Repositories;

public class TaskRepositoryTests : IDisposable
{
    private readonly ApplicationDbContext _context;
    private readonly TaskRepository _repository;
    private readonly Guid _testUserId = Guid.NewGuid();

    public TaskRepositoryTests()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _context = new ApplicationDbContext(options);
        _repository = new TaskRepository(_context);
        
        SeedTestData();
    }

    private void SeedTestData()
    {
        var tasks = new List<TaskEntity>
        {
            new TaskEntity
            {
                Id = Guid.NewGuid(),
                Name = "Implement search feature",
                Description = "Add search functionality to the task list",
                CreatedByUserId = _testUserId,
                Status = TaskStatus.InProgress,
                Priority = TaskPriority.High,
                Type = TaskType.Task,
                CreatedDate = DateTime.UtcNow.AddDays(-5),
                ModifiedDate = DateTime.UtcNow.AddDays(-5),
                IsDeleted = false,
                Progress = 50
            },
            new TaskEntity
            {
                Id = Guid.NewGuid(),
                Name = "Write unit tests",
                Description = "Create comprehensive unit tests for search",
                CreatedByUserId = _testUserId,
                Status = TaskStatus.ToDo,
                Priority = TaskPriority.Medium,
                Type = TaskType.Task,
                CreatedDate = DateTime.UtcNow.AddDays(-3),
                ModifiedDate = DateTime.UtcNow.AddDays(-3),
                IsDeleted = false,
                Progress = 0
            },
            new TaskEntity
            {
                Id = Guid.NewGuid(),
                Name = "Update documentation",
                Description = "Document the new filtering capabilities",
                CreatedByUserId = _testUserId,
                Status = TaskStatus.Done,
                Priority = TaskFlow.Abstractions.Constants.TaskPriority.Low,
                Type = TaskFlow.Abstractions.Constants.TaskType.Task,
                CreatedDate = DateTime.UtcNow.AddDays(-7),
                ModifiedDate = DateTime.UtcNow.AddDays(-1),
                IsDeleted = false,
                Progress = 100
            },
            new TaskEntity
            {
                Id = Guid.NewGuid(),
                Name = "Fix bug in API",
                Description = null,
                CreatedByUserId = _testUserId,
                Status = TaskStatus.Blocked,
                Priority = TaskPriority.Critical,
                Type = TaskType.Task,
                CreatedDate = DateTime.UtcNow.AddDays(-2),
                ModifiedDate = DateTime.UtcNow.AddDays(-2),
                IsDeleted = false,
                Progress = 25
            },
            new TaskEntity
            {
                Id = Guid.NewGuid(),
                Name = "Deleted task",
                Description = "This task should not appear",
                CreatedByUserId = _testUserId,
                Status = TaskStatus.Done,
                Priority = TaskPriority.Low,
                Type = TaskType.Task,
                CreatedDate = DateTime.UtcNow.AddDays(-10),
                ModifiedDate = DateTime.UtcNow.AddDays(-1),
                IsDeleted = true,
                Progress = 100
            }
        };

        _context.Tasks.AddRange(tasks);
        _context.SaveChanges();
    }

    [Fact]
    public async System.Threading.Tasks.Task GetUserTasksAsync_ReturnsAllNonDeletedTasks_WhenNoFilters()
    {
        // Act
        var result = await _repository.GetUserTasksAsync(_testUserId, null, null);

        // Assert
        Assert.Equal(4, result.Count); // Should exclude deleted task
        Assert.All(result, task => Assert.False(task.IsDeleted));
    }

    [Fact]
    public async System.Threading.Tasks.Task GetUserTasksAsync_FiltersTasksByStatus()
    {
        // Act
        var result = await _repository.GetUserTasksAsync(_testUserId, TaskStatus.InProgress);

        // Assert
        Assert.Single(result);
        Assert.Equal("Implement search feature", result[0].Name);
    }

    [Fact]
    public async System.Threading.Tasks.Task GetUserTasksAsync_SearchesByName()
    {
        // Act
        var result = await _repository.GetUserTasksAsync(_testUserId, null, "Implement");

        // Assert
        Assert.Single(result);
        Assert.Equal("Implement search feature", result[0].Name);
    }

    [Fact]
    public async System.Threading.Tasks.Task GetUserTasksAsync_SearchesByDescription()
    {
        // Act
        var result = await _repository.GetUserTasksAsync(_testUserId, null, "filtering");

        // Assert
        Assert.Single(result);
        Assert.Equal("Update documentation", result[0].Name);
    }

    [Fact]
    public async System.Threading.Tasks.Task GetUserTasksAsync_SearchIsCaseInsensitive()
    {
        // Act
        var resultLower = await _repository.GetUserTasksAsync(_testUserId, null, "implement");
        var resultUpper = await _repository.GetUserTasksAsync(_testUserId, null, "IMPLEMENT");
        var resultMixed = await _repository.GetUserTasksAsync(_testUserId, null, "ImPlEmEnT");

        // Assert
        Assert.Single(resultLower);
        Assert.Single(resultUpper);
        Assert.Single(resultMixed);
        Assert.Equal(resultLower[0].Id, resultUpper[0].Id);
        Assert.Equal(resultLower[0].Id, resultMixed[0].Id);
    }

    [Fact]
    public async System.Threading.Tasks.Task GetUserTasksAsync_CombinesStatusAndSearch()
    {
        // Act
        var result = await _repository.GetUserTasksAsync(_testUserId, TaskStatus.InProgress, "search");

        // Assert
        Assert.Single(result);
        Assert.Equal("Implement search feature", result[0].Name);
        Assert.Equal(TaskStatus.InProgress, result[0].Status);
    }

    [Fact]
    public async System.Threading.Tasks.Task GetUserTasksAsync_ReturnsEmptyList_WhenSearchNotFound()
    {
        // Act
        var result = await _repository.GetUserTasksAsync(_testUserId, null, "nonexistent");

        // Assert
        Assert.Empty(result);
    }

    [Fact]
    public async System.Threading.Tasks.Task GetUserTasksAsync_HandlesNullDescription()
    {
        // Act
        var result = await _repository.GetUserTasksAsync(_testUserId, null, "bug");

        // Assert
        Assert.Single(result);
        Assert.Equal("Fix bug in API", result[0].Name);
    }

    [Fact]
    public async System.Threading.Tasks.Task GetUserTasksAsync_OrdersByCreatedDateDescending()
    {
        // Act
        var result = await _repository.GetUserTasksAsync(_testUserId, null, null);

        // Assert
        Assert.Equal(4, result.Count);
        // Most recent first
        Assert.Equal("Fix bug in API", result[0].Name); // -2 days
        Assert.Equal("Write unit tests", result[1].Name); // -3 days
        Assert.Equal("Implement search feature", result[2].Name); // -5 days
        Assert.Equal("Update documentation", result[3].Name); // -7 days
    }

    [Fact]
    public async System.Threading.Tasks.Task GetUserTasksAsync_IgnoresWhitespaceInSearch()
    {
        // Act
        var result = await _repository.GetUserTasksAsync(_testUserId, null, "  Implement  ");

        // Assert
        Assert.Single(result);
        Assert.Equal("Implement search feature", result[0].Name);
    }

    public void Dispose()
    {
        _context.Database.EnsureDeleted();
        _context.Dispose();
    }
}
