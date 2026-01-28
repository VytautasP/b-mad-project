using System.ComponentModel.DataAnnotations;

namespace TaskFlow.Abstractions.DTOs.Task;

public class AssignUserDto
{
    [Required]
    public Guid UserId { get; set; }
}
