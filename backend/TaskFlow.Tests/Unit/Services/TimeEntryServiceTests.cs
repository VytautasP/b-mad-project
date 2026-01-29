using Microsoft.Extensions.Logging;
using Moq;
using TaskFlow.Abstractions.Constants;
using TaskFlow.Abstractions.DTOs.TimeEntries;
using TaskFlow.Abstractions.Entities;
using TaskFlow.Abstractions.Exceptions;
using TaskFlow.Abstractions.Interfaces;
using TaskFlow.Abstractions.Interfaces.Repositories;
using TaskFlow.Core.Services;
using TaskEntity = TaskFlow.Abstractions.Entities.Task;

namespace TaskFlow.Tests.Unit.Services;

public class TimeEntryServiceTests
{
    private readonly Mock<IUnitOfWork> _mockUnitOfWork;
    private readonly Mock<ITimeEntryRepository> _mockTimeEntryRepository;
    private readonly Mock<ITaskRepository> _mockTaskRepository;
    private readonly Mock<ILogger<TimeEntryService>> _mockLogger;
    private readonly TimeEntryService _service;
    private readonly Guid _testUserId = Guid.NewGuid();
    private readonly Guid _testTaskId = Guid.NewGuid();

    public TimeEntryServiceTests()
    {
        _mockUnitOfWork = new Mock<IUnitOfWork>();
        _mockTimeEntryRepository = new Mock<ITimeEntryRepository>();
        _mockTaskRepository = new Mock<ITaskRepository>();
        _mockLogger = new Mock<ILogger<TimeEntryService>>();

        _mockUnitOfWork.Setup(u => u.TimeEntries).Returns(_mockTimeEntryRepository.Object);
        _mockUnitOfWork.Setup(u => u.Tasks).Returns(_mockTaskRepository.Object);

        _service = new TimeEntryService(_mockUnitOfWork.Object, _mockLogger.Object);
    }

    [Fact]
    public async System.Threading.Tasks.Task LogTimeAsync_ShouldCreateTimeEntry_WhenValidInput()
    {
        // Arrange
        var task = new TaskEntity { Id = _testTaskId, Name = "Test Task", CreatedByUserId = _testUserId };
        var dto = new TimeEntryCreateDto
        {
            Minutes = 60,
            Note = "Test note",
            EntryType = EntryType.Manual
        };

        _mockTaskRepository.Setup(r => r.GetByIdAsync(_testTaskId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(task);

        _mockTimeEntryRepository.Setup(r => r.CreateAsync(It.IsAny<TimeEntry>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((TimeEntry te, CancellationToken ct) => te);

        _mockTimeEntryRepository.Setup(r => r.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((Guid id, CancellationToken ct) => new TimeEntry
            {
                Id = id,
                TaskId = _testTaskId,
                UserId = _testUserId,
                Minutes = dto.Minutes,
                Note = dto.Note,
                EntryType = dto.EntryType,
                EntryDate = DateTime.UtcNow,
                CreatedAt = DateTime.UtcNow,
                User = new User { Id = _testUserId, Name = "Test User", Email = "test@example.com" }
            });

        _mockUnitOfWork.Setup(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(1);

        // Act
        var result = await _service.LogTimeAsync(_testTaskId, _testUserId, dto, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(_testTaskId, result.TaskId);
        Assert.Equal(_testUserId, result.UserId);
        Assert.Equal(60, result.Minutes);
        Assert.Equal("Test note", result.Note);
        _mockUnitOfWork.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async System.Threading.Tasks.Task LogTimeAsync_ShouldThrowNotFoundException_WhenTaskNotFound()
    {
        // Arrange
        var dto = new TimeEntryCreateDto { Minutes = 60, EntryType = EntryType.Manual };
        _mockTaskRepository.Setup(r => r.GetByIdAsync(_testTaskId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((TaskEntity?)null);

        // Act & Assert
        await Assert.ThrowsAsync<NotFoundException>(() =>
            _service.LogTimeAsync(_testTaskId, _testUserId, dto, CancellationToken.None));
    }

    [Fact]
    public async System.Threading.Tasks.Task LogTimeAsync_ShouldThrowValidationException_WhenMinutesIsZero()
    {
        // Arrange
        var task = new TaskEntity { Id = _testTaskId, Name = "Test Task", CreatedByUserId = _testUserId };
        var dto = new TimeEntryCreateDto { Minutes = 0, EntryType = EntryType.Manual };
        _mockTaskRepository.Setup(r => r.GetByIdAsync(_testTaskId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(task);

        // Act & Assert
        await Assert.ThrowsAsync<ValidationException>(() =>
            _service.LogTimeAsync(_testTaskId, _testUserId, dto, CancellationToken.None));
    }

    [Fact]
    public async System.Threading.Tasks.Task LogTimeAsync_ShouldThrowValidationException_WhenMinutesExceeds24Hours()
    {
        // Arrange
        var task = new TaskEntity { Id = _testTaskId, Name = "Test Task", CreatedByUserId = _testUserId };
        var dto = new TimeEntryCreateDto { Minutes = 1500, EntryType = EntryType.Manual };
        _mockTaskRepository.Setup(r => r.GetByIdAsync(_testTaskId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(task);

        // Act & Assert
        await Assert.ThrowsAsync<ValidationException>(() =>
            _service.LogTimeAsync(_testTaskId, _testUserId, dto, CancellationToken.None));
    }

    [Fact]
    public async System.Threading.Tasks.Task DeleteTimeEntryAsync_ShouldDeleteEntry_WhenUserIsCreator()
    {
        // Arrange
        var entryId = Guid.NewGuid();
        var timeEntry = new TimeEntry
        {
            Id = entryId,
            TaskId = _testTaskId,
            UserId = _testUserId,
            Minutes = 60
        };

        _mockTimeEntryRepository.Setup(r => r.GetByIdAsync(entryId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(timeEntry);

        _mockTimeEntryRepository.Setup(r => r.DeleteAsync(timeEntry, It.IsAny<CancellationToken>()))
            .Returns(System.Threading.Tasks.Task.CompletedTask);

        _mockUnitOfWork.Setup(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(1);

        // Act
        await _service.DeleteTimeEntryAsync(entryId, _testUserId, CancellationToken.None);

        // Assert
        _mockTimeEntryRepository.Verify(r => r.DeleteAsync(timeEntry, It.IsAny<CancellationToken>()), Times.Once);
        _mockUnitOfWork.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async System.Threading.Tasks.Task DeleteTimeEntryAsync_ShouldThrowUnauthorizedException_WhenUserIsNotCreator()
    {
        // Arrange
        var entryId = Guid.NewGuid();
        var differentUserId = Guid.NewGuid();
        var timeEntry = new TimeEntry
        {
            Id = entryId,
            TaskId = _testTaskId,
            UserId = differentUserId,
            Minutes = 60
        };

        _mockTimeEntryRepository.Setup(r => r.GetByIdAsync(entryId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(timeEntry);

        // Act & Assert
        await Assert.ThrowsAsync<UnauthorizedException>(() =>
            _service.DeleteTimeEntryAsync(entryId, _testUserId, CancellationToken.None));

        _mockTimeEntryRepository.Verify(r => r.DeleteAsync(It.IsAny<TimeEntry>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async System.Threading.Tasks.Task GetTaskTimeEntriesAsync_ShouldReturnOrderedList_WhenMultipleEntries()
    {
        // Arrange
        var task = new TaskEntity { Id = _testTaskId, Name = "Test Task", CreatedByUserId = _testUserId };
        var entries = new List<TimeEntry>
        {
            new TimeEntry
            {
                Id = Guid.NewGuid(),
                TaskId = _testTaskId,
                UserId = _testUserId,
                Minutes = 60,
                EntryDate = DateTime.UtcNow.AddDays(-2),
                User = new User { Id = _testUserId, Name = "User 1", Email = "user1@example.com" }
            },
            new TimeEntry
            {
                Id = Guid.NewGuid(),
                TaskId = _testTaskId,
                UserId = _testUserId,
                Minutes = 120,
                EntryDate = DateTime.UtcNow.AddDays(-1),
                User = new User { Id = _testUserId, Name = "User 1", Email = "user1@example.com" }
            },
            new TimeEntry
            {
                Id = Guid.NewGuid(),
                TaskId = _testTaskId,
                UserId = _testUserId,
                Minutes = 90,
                EntryDate = DateTime.UtcNow,
                User = new User { Id = _testUserId, Name = "User 1", Email = "user1@example.com" }
            }
        };

        _mockTaskRepository.Setup(r => r.GetByIdAsync(_testTaskId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(task);

        // Repository returns entries ordered by EntryDate descending
        var orderedEntries = entries.OrderByDescending(e => e.EntryDate).ToList();
        _mockTimeEntryRepository.Setup(r => r.GetByTaskIdAsync(_testTaskId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(orderedEntries);

        // Act
        var result = await _service.GetTaskTimeEntriesAsync(_testTaskId, _testUserId, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(3, result.Count);
        Assert.Equal(90, result[0].Minutes); // Most recent first
        Assert.Equal(120, result[1].Minutes);
        Assert.Equal(60, result[2].Minutes);
    }
}
