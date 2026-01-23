namespace TaskFlow.Abstractions.Exceptions;

public class UnauthorizedException : Exception
{
    public int StatusCode => 401;

    public UnauthorizedException(string message) : base(message)
    {
    }
}