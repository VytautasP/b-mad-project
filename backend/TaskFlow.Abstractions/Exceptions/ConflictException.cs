namespace TaskFlow.Abstractions.Exceptions;

public class ConflictException : Exception
{
    public int StatusCode => 409;

    public ConflictException(string message) : base(message)
    {
    }
}