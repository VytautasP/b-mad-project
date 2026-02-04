using System.ComponentModel.DataAnnotations;
using TaskFlow.Abstractions.Constants;
using TaskFlow.Abstractions.Validators;

namespace TaskFlow.Abstractions.DTOs.Tasks;

[MaxDateRange(730)] // 2 years maximum
public class TimelineQueryDto : IValidatableObject
{
    [Required(ErrorMessage = "View parameter is required")]
    [RegularExpression(@"^timeline$", ErrorMessage = "View must be 'timeline'")]
    public string View { get; set; } = "timeline";

    [Required(ErrorMessage = "StartDate is required")]
    public DateTime StartDate { get; set; }

    [Required(ErrorMessage = "EndDate is required")]
    public DateTime EndDate { get; set; }

    // Optional filtering properties
    public Guid? AssigneeId { get; set; }
    public Constants.TaskStatus? Status { get; set; }
    public Constants.TaskPriority? Priority { get; set; }

    // Custom validation
    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        var results = new List<ValidationResult>();

        if (EndDate <= StartDate)
        {
            results.Add(new ValidationResult(
                "EndDate must be after StartDate",
                new[] { nameof(EndDate) }));
        }

        return results;
    }
}
