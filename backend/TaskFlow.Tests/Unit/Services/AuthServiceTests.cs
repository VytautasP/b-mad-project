using Microsoft.Extensions.Logging;
using Moq;
using TaskFlow.Abstractions.DTOs.Auth;
using TaskFlow.Abstractions.Entities;
using TaskFlow.Abstractions.Exceptions;
using TaskFlow.Abstractions.Interfaces;
using TaskFlow.Abstractions.Interfaces.Repositories;
using TaskFlow.Abstractions.Interfaces.Services;
using TaskFlow.Core.Services;

namespace TaskFlow.Tests.Unit.Services;

public class AuthServiceTests
{
    private readonly Mock<IUnitOfWork> _mockUnitOfWork;
    private readonly Mock<IPasswordHasher> _mockPasswordHasher;
    private readonly Mock<IJwtTokenService> _mockJwtTokenService;
    private readonly Mock<ILogger<AuthService>> _mockLogger;
    private readonly Mock<IUserRepository> _mockUserRepository;
    private readonly AuthService _authService;

    public AuthServiceTests()
    {
        _mockUnitOfWork = new Mock<IUnitOfWork>();
        _mockPasswordHasher = new Mock<IPasswordHasher>();
        _mockJwtTokenService = new Mock<IJwtTokenService>();
        _mockLogger = new Mock<ILogger<AuthService>>();
        _mockUserRepository = new Mock<IUserRepository>();

        _mockUnitOfWork.Setup(u => u.Users).Returns(_mockUserRepository.Object);

        _authService = new AuthService(
            _mockUnitOfWork.Object,
            _mockPasswordHasher.Object,
            _mockJwtTokenService.Object,
            _mockLogger.Object
        );
    }

    [Fact]
    public async System.Threading.Tasks.Task RegisterAsync_ValidatesPasswordRequirements()
    {
        // Arrange
        var dto = new RegisterDto
        {
            Email = "test@example.com",
            Password = "weak",
            Name = "Test User"
        };

        // Act & Assert
        await Assert.ThrowsAsync<ValidationException>(() => _authService.RegisterAsync(dto));
    }

    [Fact]
    public async System.Threading.Tasks.Task RegisterAsync_ThrowsConflictExceptionForDuplicateEmail()
    {
        // Arrange
        var dto = new RegisterDto
        {
            Email = "test@example.com",
            Password = "ValidPass123",
            Name = "Test User"
        };

        _mockUserRepository.Setup(r => r.EmailExistsAsync(dto.Email, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        // Act & Assert
        await Assert.ThrowsAsync<ConflictException>(() => _authService.RegisterAsync(dto));
    }

    [Fact]
    public async System.Threading.Tasks.Task RegisterAsync_HashesPasswordBeforeStoring()
    {
        // Arrange
        var dto = new RegisterDto
        {
            Email = "test@example.com",
            Password = "ValidPass123",
            Name = "Test User"
        };

        _mockUserRepository.Setup(r => r.EmailExistsAsync(dto.Email, It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        _mockPasswordHasher.Setup(p => p.HashPassword(dto.Password))
            .Returns("hashedPassword");

        _mockJwtTokenService.Setup(j => j.GenerateToken(It.IsAny<User>()))
            .Returns("jwt-token");

        _mockUserRepository.Setup(r => r.CreateAsync(It.IsAny<User>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((User u, CancellationToken ct) => u);

        _mockUnitOfWork.Setup(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(1);

        // Act
        var result = await _authService.RegisterAsync(dto);

        // Assert
        _mockPasswordHasher.Verify(p => p.HashPassword(dto.Password), Times.Once);
        _mockUserRepository.Verify(r => r.CreateAsync(
            It.Is<User>(u => u.PasswordHash == "hashedPassword"),
            It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async System.Threading.Tasks.Task LoginAsync_ReturnsTokenForValidCredentials()
    {
        // Arrange
        var dto = new LoginDto
        {
            Email = "test@example.com",
            Password = "ValidPass123"
        };

        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = dto.Email,
            Name = "Test User",
            PasswordHash = "hashedPassword",
            CreatedDate = DateTime.UtcNow
        };

        _mockUserRepository.Setup(r => r.GetByEmailAsync(dto.Email, It.IsAny<CancellationToken>()))
            .ReturnsAsync(user);

        _mockPasswordHasher.Setup(p => p.VerifyPassword(dto.Password, user.PasswordHash))
            .Returns(true);

        _mockJwtTokenService.Setup(j => j.GenerateToken(user))
            .Returns("jwt-token");

        // Act
        var result = await _authService.LoginAsync(dto);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("jwt-token", result.Token);
        Assert.Equal(user.Id, result.UserId);
        Assert.Equal(user.Email, result.Email);
    }

    [Fact]
    public async System.Threading.Tasks.Task LoginAsync_ThrowsUnauthorizedExceptionForInvalidCredentials()
    {
        // Arrange
        var dto = new LoginDto
        {
            Email = "test@example.com",
            Password = "WrongPassword"
        };

        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = dto.Email,
            Name = "Test User",
            PasswordHash = "hashedPassword",
            CreatedDate = DateTime.UtcNow
        };

        _mockUserRepository.Setup(r => r.GetByEmailAsync(dto.Email, It.IsAny<CancellationToken>()))
            .ReturnsAsync(user);

        _mockPasswordHasher.Setup(p => p.VerifyPassword(dto.Password, user.PasswordHash))
            .Returns(false);

        // Act & Assert
        await Assert.ThrowsAsync<UnauthorizedException>(() => _authService.LoginAsync(dto));
    }
}