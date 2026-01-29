using TaskFlow.Abstractions.Constants;

namespace TaskFlow.Abstractions.Entities;

/// <summary>
/// Represents a time entry logged against a task.
/// </summary>
public class TimeEntry
{
    /// <summary>
    /// Unique identifier for the time entry.
    /// </summary>
    public Guid Id { get; set; }

    /// <summary>
    /// Foreign key to the task this time entry is associated with.
    /// </summary>
    public Guid TaskId { get; set; }

    /// <summary>
    /// Foreign key to the user who created this time entry.
    /// </summary>
    public Guid UserId { get; set; }

    /// <summary>
    /// Duration of the time entry in minutes. Must be > 0 and <= 1440 (24 hours).
    /// </summary>
    public int Minutes { get; set; }

    /// <summary>
    /// Date and time when the work was performed (UTC).
    /// </summary>
    public DateTime EntryDate { get; set; }

    /// <summary>
    /// Optional note describing the work performed (max 500 characters).
    /// </summary>
    public string? Note { get; set; }

    /// <summary>
    /// Type of time entry (Timer or Manual).
    /// </summary>
    public EntryType EntryType { get; set; }

    /// <summary>
    /// Date and time when this record was created (UTC).
    /// </summary>
    public DateTime CreatedAt { get; set; }

    // Navigation properties

    /// <summary>
    /// The task associated with this time entry.
    /// </summary>
    public Task Task { get; set; } = null!;

    /// <summary>
    /// The user who created this time entry.
    /// </summary>
    public User User { get; set; } = null!;
}
