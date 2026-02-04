namespace TaskFlow.Abstractions.DTOs.Shared;

public class PaginatedResultDto<T>
{
    public List<T> Items { get; set; } = new List<T>();
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalPages { get; set; }
    
    // Computed properties for convenience
    public bool HasNextPage => Page < TotalPages;
    public bool HasPreviousPage => Page > 1;
}
