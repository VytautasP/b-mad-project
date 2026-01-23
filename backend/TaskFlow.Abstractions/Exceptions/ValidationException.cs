namespace TaskFlow.Abstractions.Exceptions;

public class ValidationException : Exception
{
    public int StatusCode => 400;

    public ValidationException(string message) : base(message)
    {
    }
}