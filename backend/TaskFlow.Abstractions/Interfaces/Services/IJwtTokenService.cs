using System.Security.Claims;
using TaskFlow.Abstractions.Entities;

namespace TaskFlow.Abstractions.Interfaces.Services;

public interface IJwtTokenService
{
    string GenerateToken(User user);
    ClaimsPrincipal? ValidateToken(string token);
}