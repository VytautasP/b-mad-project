namespace TaskFlow.Abstractions.DTOs.TimeEntries;

/// <summary>
/// Data transfer object for time entry responses.
/// </summary>
public class TimeEntryResponseDto
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
    /// Name of the user who created the time entry (for display).
    /// </summary>
    public string UserName { get; set; } = string.Empty;

    /// <summary>
    /// Duration of the time entry in minutes.
    /// </summary>
    public int Minutes { get; set; }

    /// <summary>
    /// Date and time when the work was performed.
    /// </summary>
    public DateTime EntryDate { get; set; }

    /// <summary>
    /// Optional note describing the work performed.
    /// </summary>
    public string? Note { get; set; }

    /// <summary>
    /// Type of time entry ("Timer" or "Manual").
    /// </summary>
    public string EntryType { get; set; } = string.Empty;

    /// <summary>
    /// Date and time when this record was created.
    /// </summary>
    public DateTime CreatedAt { get; set; }
}
