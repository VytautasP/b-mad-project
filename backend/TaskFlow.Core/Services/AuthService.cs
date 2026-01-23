using Microsoft.Extensions.Logging;
using TaskFlow.Abstractions.DTOs.Auth;
using TaskFlow.Abstractions.Entities;
using TaskFlow.Abstractions.Exceptions;
using TaskFlow.Abstractions.Interfaces;
using TaskFlow.Abstractions.Interfaces.Services;

namespace TaskFlow.Core.Services;

public class AuthService : IAuthService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IJwtTokenService _jwtTokenService;
    private readonly ILogger<AuthService> _logger;

    public AuthService(
        IUnitOfWork unitOfWork,
        IPasswordHasher passwordHasher,
        IJwtTokenService jwtTokenService,
        ILogger<AuthService> logger)
    {
        _unitOfWork = unitOfWork;
        _passwordHasher = passwordHasher;
        _jwtTokenService = jwtTokenService;
        _logger = logger;
    }

    public async Task<AuthResponseDto> RegisterAsync(RegisterDto dto, CancellationToken ct = default)
    {
        // Validate password strength
        if (!IsPasswordValid(dto.Password))
        {
            throw new ValidationException(
                "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number");
        }

        // Check if email already exists
        if (await _unitOfWork.Users.EmailExistsAsync(dto.Email, ct))
        {
            throw new ConflictException("Email already exists");
        }

        // Hash password
        var passwordHash = _passwordHasher.HashPassword(dto.Password);

        // Create user entity
        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = dto.Email,
            PasswordHash = passwordHash,
            Name = dto.Name,
            CreatedDate = DateTime.UtcNow
        };

        // Save user to database
        await _unitOfWork.Users.CreateAsync(user, ct);
        await _unitOfWork.SaveChangesAsync(ct);

        _logger.LogInformation("User registered successfully with email {Email}", dto.Email);

        // Generate JWT token
        var token = _jwtTokenService.GenerateToken(user);
        var expiresAt = DateTime.UtcNow.AddMinutes(1440); // 24 hours

        return new AuthResponseDto
        {
            Token = token,
            UserId = user.Id,
            Email = user.Email,
            Name = user.Name,
            ExpiresAt = expiresAt
        };
    }

    public async Task<AuthResponseDto> LoginAsync(LoginDto dto, CancellationToken ct = default)
    {
        // Find user by email
        var user = await _unitOfWork.Users.GetByEmailAsync(dto.Email, ct);
        if (user == null)
        {
            throw new UnauthorizedException("Invalid email or password");
        }

        // Verify password
        if (!_passwordHasher.VerifyPassword(dto.Password, user.PasswordHash))
        {
            throw new UnauthorizedException("Invalid email or password");
        }

        _logger.LogInformation("User logged in successfully with email {Email}", dto.Email);

        // Generate JWT token
        var token = _jwtTokenService.GenerateToken(user);
        var expiresAt = DateTime.UtcNow.AddMinutes(1440); // 24 hours

        return new AuthResponseDto
        {
            Token = token,
            UserId = user.Id,
            Email = user.Email,
            Name = user.Name,
            ExpiresAt = expiresAt
        };
    }

    private bool IsPasswordValid(string password)
    {
        if (password.Length < 8) return false;
        if (!password.Any(char.IsUpper)) return false;
        if (!password.Any(char.IsLower)) return false;
        if (!password.Any(char.IsDigit)) return false;
        return true;
    }
}