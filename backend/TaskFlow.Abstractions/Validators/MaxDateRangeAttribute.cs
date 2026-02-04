using System.ComponentModel.DataAnnotations;

namespace TaskFlow.Abstractions.Validators;

/// <summary>
/// Validates that a date range does not exceed a maximum number of days.
/// Expects the class to have StartDate and EndDate properties.
/// </summary>
[AttributeUsage(AttributeTargets.Class, AllowMultiple = false)]
public class MaxDateRangeAttribute : ValidationAttribute
{
    private readonly int _maxDays;

    public MaxDateRangeAttribute(int maxDays)
    {
        _maxDays = maxDays;
        ErrorMessage = $"Date range cannot exceed {maxDays} days";
    }

    protected override ValidationResult? IsValid(object? value, ValidationContext validationContext)
    {
        if (value == null)
            return ValidationResult.Success;

        var startDateProperty = validationContext.ObjectType.GetProperty("StartDate");
        var endDateProperty = validationContext.ObjectType.GetProperty("EndDate");

        if (startDateProperty == null || endDateProperty == null)
            return new ValidationResult("StartDate and EndDate properties are required for MaxDateRange validation");

        var startDate = startDateProperty.GetValue(value) as DateTime?;
        var endDate = endDateProperty.GetValue(value) as DateTime?;

        if (startDate == null || endDate == null)
            return ValidationResult.Success;

        var daysDifference = (endDate.Value - startDate.Value).TotalDays;
        if (daysDifference > _maxDays)
        {
            return new ValidationResult(
                $"Date range cannot exceed {_maxDays} days (approximately {_maxDays / 365} years)",
                new[] { "EndDate" });
        }

        return ValidationResult.Success;
    }
}
