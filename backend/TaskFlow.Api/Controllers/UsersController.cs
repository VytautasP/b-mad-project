using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TaskFlow.Abstractions.DTOs.Shared;
using TaskFlow.Abstractions.Interfaces.Repositories;

namespace TaskFlow.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/users")]
public class UsersController : ControllerBase
{
    private readonly IUserRepository _userRepository;
    private readonly ILogger<UsersController> _logger;

    public UsersController(IUserRepository userRepository, ILogger<UsersController> logger)
    {
        _userRepository = userRepository;
        _logger = logger;
    }

    /// <summary>
    /// Search users by name or email
    /// </summary>
    [HttpGet("search")]
    public async Task<IActionResult> SearchUsers([FromQuery] string q, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(q))
        {
            return BadRequest(new { message = "Search query cannot be empty" });
        }

        var users = await _userRepository.SearchUsersAsync(q, 20, ct);
        
        var userDtos = users.Select(u => new UserDto
        {
            Id = u.Id,
            Name = u.Name,
            Email = u.Email,
            AvatarUrl = u.ProfileImageUrl
        }).ToList();

        return Ok(userDtos);
    }

    /// <summary>
    /// Get all users (optional, for small user bases)
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetAllUsers(CancellationToken ct)
    {
        var users = await _userRepository.GetAllUsersAsync(ct);
        
        var userDtos = users.Select(u => new UserDto
        {
            Id = u.Id,
            Name = u.Name,
            Email = u.Email,
            AvatarUrl = u.ProfileImageUrl
        }).ToList();

        return Ok(userDtos);
    }
}
