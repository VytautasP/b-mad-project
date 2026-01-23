namespace TaskFlow.Abstractions.DTOs.Shared;

public class ErrorResponseDto
{
    public string Message { get; set; } = string.Empty;
    public int StatusCode { get; set; }
    public string? TraceId { get; set; }
}