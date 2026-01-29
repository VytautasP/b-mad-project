namespace TaskFlow.Abstractions.Constants;

/// <summary>
/// Represents the type of time entry.
/// </summary>
public enum EntryType
{
    /// <summary>
    /// Time logged automatically via a timer.
    /// </summary>
    Timer = 0,

    /// <summary>
    /// Time logged manually by the user.
    /// </summary>
    Manual = 1
}
