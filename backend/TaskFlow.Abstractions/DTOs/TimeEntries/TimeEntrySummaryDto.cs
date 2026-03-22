namespace TaskFlow.Abstractions.DTOs.TimeEntries;

public class TimeEntrySummaryDto
{
    public int TotalMinutes { get; set; }
    public int BillableMinutes { get; set; }
    public int NonBillableMinutes { get; set; }
    public int PreviousPeriodTotalMinutes { get; set; }
    public int PreviousPeriodBillableMinutes { get; set; }
    public int PreviousPeriodNonBillableMinutes { get; set; }
}
