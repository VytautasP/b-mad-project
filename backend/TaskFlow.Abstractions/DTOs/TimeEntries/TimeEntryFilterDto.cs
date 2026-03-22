using System.ComponentModel.DataAnnotations;

namespace TaskFlow.Abstractions.DTOs.TimeEntries;

public class TimeEntryFilterDto
{
    [Range(1, int.MaxValue)]
    public int Page { get; set; } = 1;

    [Range(1, 100)]
    public int PageSize { get; set; } = 10;

    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public Guid? UserId { get; set; }
    public Guid? ProjectId { get; set; }
    public bool? IsBillable { get; set; }

    [MaxLength(200)]
    public string? Search { get; set; }
}
