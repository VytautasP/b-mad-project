namespace TaskFlow.Abstractions.Exceptions;

/// <summary>
/// Exception thrown when a user is authenticated but does not have permission to perform an action
/// </summary>
public class ForbiddenException : Exception
{
    public ForbiddenException(string message) : base(message)
    {
    }

    public ForbiddenException(string message, Exception innerException) : base(message, innerException)
    {
    }
}
