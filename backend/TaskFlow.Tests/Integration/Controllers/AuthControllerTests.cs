using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using TaskFlow.Abstractions.DTOs.Auth;
using TaskFlow.Infrastructure.Data;

namespace TaskFlow.Tests.Integration.Controllers;

public class AuthControllerTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;
    private readonly HttpClient _client;

    public AuthControllerTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
        _client = _factory.CreateClient();
    }

    [Fact]
    public async Task Register_ValidData_Returns201AndToken()
    {
        // Arrange
        var registerDto = new RegisterDto
        {
            Email = "newuser@example.com",
            Password = "ValidPass123",
            Name = "New User"
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/auth/register", registerDto);

        // Assert
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);

        var result = await response.Content.ReadFromJsonAsync<AuthResponseDto>();
        Assert.NotNull(result);
        Assert.NotEmpty(result.Token);
        Assert.Equal(registerDto.Email, result.Email);
        Assert.Equal(registerDto.Name, result.Name);
    }

    [Fact]
    public async Task Register_DuplicateEmail_Returns409()
    {
        // Arrange
        var registerDto = new RegisterDto
        {
            Email = "duplicate" + Guid.NewGuid() + "@example.com",
            Password = "ValidPass123",
            Name = "First User"
        };

        // Register the first user
        await _client.PostAsJsonAsync("/api/auth/register", registerDto);

        // Act - Try to register again with the same email
        var response = await _client.PostAsJsonAsync("/api/auth/register", registerDto);

        // Assert
        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
    }

    [Fact]
    public async Task Register_WeakPassword_Returns400()
    {
        // Arrange
        var registerDto = new RegisterDto
        {
            Email = "weakpass@example.com",
            Password = "weak",
            Name = "Weak Pass User"
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/auth/register", registerDto);

        // Assert
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Login_ValidCredentials_Returns200AndToken()
    {
        // Arrange - First register a user with unique email
        var email = "logintest" + Guid.NewGuid() + "@example.com";
        var registerDto = new RegisterDto
        {
            Email = email,
            Password = "ValidPass123",
            Name = "Login Test User"
        };

        await _client.PostAsJsonAsync("/api/auth/register", registerDto);

        var loginDto = new LoginDto
        {
            Email = registerDto.Email,
            Password = registerDto.Password
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/auth/login", loginDto);

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var result = await response.Content.ReadFromJsonAsync<AuthResponseDto>();
        Assert.NotNull(result);
        Assert.NotEmpty(result.Token);
        Assert.Equal(loginDto.Email, result.Email);
    }

    [Fact]
    public async Task Login_InvalidEmail_Returns401()
    {
        // Arrange
        var loginDto = new LoginDto
        {
            Email = "nonexistent@example.com",
            Password = "ValidPass123"
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/auth/login", loginDto);

        // Assert
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Login_WrongPassword_Returns401()
    {
        // Arrange - First register a user with unique email
        var email = "wrongpass" + Guid.NewGuid() + "@example.com";
        var registerDto = new RegisterDto
        {
            Email = email,
            Password = "ValidPass123",
            Name = "Wrong Pass User"
        };

        await _client.PostAsJsonAsync("/api/auth/register", registerDto);

        var loginDto = new LoginDto
        {
            Email = registerDto.Email,
            Password = "WrongPassword456"
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/auth/login", loginDto);

        // Assert
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task JwtToken_IncludesCorrectUserIdAndEmailClaims()
    {
        // Arrange
        var registerDto = new RegisterDto
        {
            Email = "claimstest" + Guid.NewGuid() + "@example.com",
            Password = "ValidPass123",
            Name = "Claims Test User"
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/auth/register", registerDto);
        var result = await response.Content.ReadFromJsonAsync<AuthResponseDto>();

        // Assert
        Assert.NotNull(result);
        Assert.NotEmpty(result.Token);
        Assert.NotEqual(Guid.Empty, result.UserId);
        Assert.Equal(registerDto.Email, result.Email);
        Assert.Equal(registerDto.Name, result.Name);
    }

    [Fact]
    public async Task UserCanBeRetrievedFromDatabaseAfterRegistration()
    {
        // Arrange
        var registerDto = new RegisterDto
        {
            Email = "dbtest" + Guid.NewGuid() + "@example.com",
            Password = "ValidPass123",
            Name = "DB Test User"
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/auth/register", registerDto);
        var result = await response.Content.ReadFromJsonAsync<AuthResponseDto>();

        // Assert - Verify user was created in database
        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var user = await context.Users.FirstOrDefaultAsync(u => u.Email == registerDto.Email);

        Assert.NotNull(user);
        Assert.Equal(registerDto.Email, user.Email);
        Assert.Equal(registerDto.Name, user.Name);
        Assert.NotNull(user.PasswordHash);
        Assert.NotEqual(registerDto.Password, user.PasswordHash); // Password should be hashed
    }
}

public class CustomWebApplicationFactory : WebApplicationFactory<Program>
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.ConfigureServices(services =>
        {
            // Remove the existing DbContext registration
            var descriptor = services.SingleOrDefault(
                d => d.ServiceType == typeof(DbContextOptions<ApplicationDbContext>));
            if (descriptor != null)
            {
                services.Remove(descriptor);
            }

            // Add in-memory database for testing with a persistent database name
            services.AddDbContext<ApplicationDbContext>(options =>
            {
                options.UseInMemoryDatabase("TestDatabase");
            });

            // Build the service provider
            var sp = services.BuildServiceProvider();

            // Create a scope to obtain a reference to the database context
            using var scope = sp.CreateScope();
            var scopedServices = scope.ServiceProvider;
            var db = scopedServices.GetRequiredService<ApplicationDbContext>();

            // Ensure the database is created
            db.Database.EnsureCreated();
        });
    }
}