namespace TaskFlow.Abstractions.DTOs.Task;

public class TaskHierarchyDto
{
    public Guid TaskId { get; set; }
    public string Name { get; set; } = string.Empty;
    public Guid? ParentTaskId { get; set; }
    public int Depth { get; set; }
    public bool HasChildren { get; set; }
    public string Path { get; set; } = string.Empty;
}
