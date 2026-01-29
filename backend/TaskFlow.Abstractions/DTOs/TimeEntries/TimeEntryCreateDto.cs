using System.ComponentModel.DataAnnotations;
using TaskFlow.Abstractions.Constants;

namespace TaskFlow.Abstractions.DTOs.TimeEntries;

/// <summary>
/// Data transfer object for creating a time entry.
/// </summary>
public class TimeEntryCreateDto
{
    /// <summary>
    /// Duration in minutes. Must be between 1 and 1440 (24 hours).
    /// </summary>
    [Required]
    [Range(1, 1440, ErrorMessage = "Minutes must be between 1 and 1440 (24 hours).")]
    public int Minutes { get; set; }

    /// <summary>
    /// Optional note describing the work performed (max 500 characters).
    /// </summary>
    [MaxLength(500, ErrorMessage = "Note cannot exceed 500 characters.")]
    public string? Note { get; set; }

    /// <summary>
    /// Date when the work was performed. Defaults to current date if not provided.
    /// </summary>
    public DateTime? EntryDate { get; set; }

    /// <summary>
    /// Type of time entry (Timer or Manual).
    /// </summary>
    [Required]
    public EntryType EntryType { get; set; }
}
