# 11. Backend Architecture

## Overview

The backend API is built with **ASP.NET Core 8.0 LTS** following Clean Architecture principles. The application is organized into distinct layers with clear separation of concerns, supporting the RESTful API endpoints defined in the OpenAPI specification.

**Architecture Style:**
- Three-tier architecture (Presentation, Business Logic, Data Access)
- Repository Pattern with Unit of Work for data access
- Dependency Injection for loose coupling
- Middleware pipeline for cross-cutting concerns
- JWT-based authentication with ASP.NET Core Identity

**Deployment:**
- Hosted on Fly.io as Docker container
- PostgreSQL database on Supabase
- RESTful API with JSON responses
- Swagger/OpenAPI documentation at `/swagger`

## Project Structure

```
backend/
├── TaskFlow.Api/                    # ASP.NET Core Web API project
│   ├── Controllers/                 # API controllers
│   │   ├── AuthController.cs        # POST /api/auth/register, /login
│   │   ├── TasksController.cs       # CRUD operations for tasks
│   │   ├── TimeTrackingController.cs # Time entry management
│   │   ├── CommentsController.cs    # Task comments
│   │   └── UsersController.cs       # User management
│   ├── Middleware/
│   │   ├── ErrorHandlingMiddleware.cs # Global exception handling
│   │   ├── RequestLoggingMiddleware.cs # Request/response logging
│   │   └── CorrelationIdMiddleware.cs # Trace ID for requests
│   ├── Filters/
│   │   ├── ValidateModelAttribute.cs # Model validation filter
│   │   └── ApiKeyAuthFilter.cs      # Future API key support
│   ├── Extensions/
│   │   ├── ServiceCollectionExtensions.cs # DI registration
│   │   └── ApplicationBuilderExtensions.cs # Middleware setup
│   ├── Program.cs                   # Application entry point
│   ├── appsettings.json             # Configuration
│   └── appsettings.Development.json
│
├── TaskFlow.Abstractions/           # Shared abstractions (no dependencies)
│   ├── Entities/                    # Domain entities (POCOs)
│   │   ├── User.cs
│   │   ├── Task.cs
│   │   ├── TimeEntry.cs
│   │   ├── Comment.cs
│   │   ├── TaskAssignee.cs
│   │   └── ActivityLog.cs
│   ├── DTOs/                        # Data Transfer Objects
│   │   ├── Auth/
│   │   │   ├── RegisterDto.cs
│   │   │   ├── LoginDto.cs
│   │   │   └── AuthResponseDto.cs
│   │   ├── Tasks/
│   │   │   ├── TaskCreateDto.cs
│   │   │   ├── TaskUpdateDto.cs
│   │   │   ├── TaskResponseDto.cs
│   │   │   └── TaskFilterDto.cs
│   │   ├── TimeEntries/
│   │   │   ├── TimeEntryCreateDto.cs
│   │   │   └── TimeEntryResponseDto.cs
│   │   └── Shared/
│   │       ├── PaginationDto.cs
│   │       └── ErrorResponseDto.cs
│   ├── Interfaces/                  # Service and repository abstractions
│   │   ├── Repositories/
│   │   │   ├── ITaskRepository.cs
│   │   │   ├── IUserRepository.cs
│   │   │   ├── ITimeEntryRepository.cs
│   │   │   └── ICommentRepository.cs
│   │   ├── Services/
│   │   │   ├── IAuthService.cs
│   │   │   ├── ITaskService.cs
│   │   │   ├── ITimeTrackingService.cs
│   │   │   └── IActivityLogService.cs
│   │   └── IUnitOfWork.cs           # Unit of Work pattern
│   ├── Exceptions/                  # Custom exceptions
│   │   ├── NotFoundException.cs
│   │   ├── ValidationException.cs
│   │   └── UnauthorizedException.cs
│   └── Constants/
│       ├── TaskStatus.cs            # Enum for task statuses
│       ├── TaskPriority.cs
│       └── ActivityType.cs
│
├── TaskFlow.Core/                   # Business logic layer
│   ├── Services/                    # Business logic services
│   │   ├── AuthService.cs
│   │   ├── TaskService.cs
│   │   ├── TimeTrackingService.cs
│   │   └── ActivityLogService.cs
│   └── Validators/                  # Business rule validators
│       └── TaskValidator.cs
│
├── TaskFlow.Infrastructure/         # Data access layer
│   ├── Data/
│   │   ├── ApplicationDbContext.cs  # EF Core DbContext
│   │   └── Migrations/              # EF Core migrations
│   ├── Repositories/                # Repository implementations
│   │   ├── TaskRepository.cs
│   │   ├── UserRepository.cs
│   │   ├── TimeEntryRepository.cs
│   │   ├── CommentRepository.cs
│   │   └── UnitOfWork.cs
│   ├── Configurations/              # EF Core entity configurations
│   │   ├── UserConfiguration.cs
│   │   ├── TaskConfiguration.cs
│   │   ├── TimeEntryConfiguration.cs
│   │   └── CommentConfiguration.cs
│   └── Services/
│       ├── JwtTokenService.cs       # JWT token generation
│       └── PasswordHasher.cs        # Bcrypt password hashing
│
└── TaskFlow.Tests/                  # Unit and integration tests
    ├── Unit/
    │   ├── Services/
    │   └── Repositories/
    └── Integration/
        └── Controllers/
```

## Project Dependencies

The solution follows a clean architecture dependency flow, with `TaskFlow.Abstractions` as the foundation layer with **no dependencies** on other projects:

```
┌──────────────────────┐
│   TaskFlow.Api       │  ← Presentation Layer (References: Abstractions, Core, Infrastructure)
└──────────┬───────────┘
           │
    ┌──────┴──────┐
    │             │
┌───▼────────┐ ┌─▼─────────────────┐
│TaskFlow.   │ │ TaskFlow.         │  ← Business & Data Access Layers
│Core        │ │ Infrastructure    │     (Both reference: Abstractions)
└────────────┘ └───────────────────┘
    │                │
    └────────┬───────┘
             │
    ┌────────▼──────────┐
    │  TaskFlow.        │  ← Shared Contracts (No dependencies)
    │  Abstractions     │
    └───────────────────┘
```

**Dependency Rules:**
- **TaskFlow.Abstractions**: No dependencies on other projects (only .NET BCL)
- **TaskFlow.Core**: References `TaskFlow.Abstractions` only
- **TaskFlow.Infrastructure**: References `TaskFlow.Abstractions` (and EF Core packages)
- **TaskFlow.Api**: References all projects (Abstractions, Core, Infrastructure)
- **TaskFlow.Tests**: Can reference any project for testing

**Benefits:**
- **No Circular Dependencies**: Abstractions layer prevents circular references
- **Portable Contracts**: DTOs and entities can be shared with clients without pulling in business logic
- **Clear Boundaries**: Each layer has explicit dependencies and responsibilities
- **Testability**: Interfaces in Abstractions enable easy mocking
- **Versioning**: Abstractions can be versioned independently for API contracts

## Controller Organization

Controllers are thin orchestrators that delegate to service layer. All controllers inherit from `ControllerBase` and use attribute routing.

**TasksController.cs Example:**

```csharp
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using TaskFlow.Core.Interfaces.Services;
using TaskFlow.Core.DTOs.Tasks;
using System.Security.Claims;

namespace TaskFlow.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class TasksController : ControllerBase
{
    private readonly ITaskService _taskService;
    private readonly ILogger<TasksController> _logger;

    public TasksController(
        ITaskService taskService,
        ILogger<TasksController> logger)
    {
        _taskService = taskService;
        _logger = logger;
    }

    private Guid GetUserId() => 
        Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    // GET: api/tasks?status=InProgress&priority=High&page=1&pageSize=25
    [HttpGet]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<PagedResponseDto<TaskResponseDto>>> GetTasks(
        [FromQuery] TaskFilterDto filter,
        CancellationToken cancellationToken)
    {
        var userId = GetUserId();
        _logger.LogInformation("User {UserId} fetching tasks with filters", userId);
        
        var result = await _taskService.GetTasksAsync(userId, filter, cancellationToken);
        return Ok(result);
    }

    // GET: api/tasks/{id}
    [HttpGet("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<TaskResponseDto>> GetTask(
        Guid id,
        CancellationToken cancellationToken)
    {
        var userId = GetUserId();
        var task = await _taskService.GetTaskByIdAsync(userId, id, cancellationToken);
        return Ok(task);
    }

    // POST: api/tasks
    [HttpPost]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<TaskResponseDto>> CreateTask(
        [FromBody] TaskCreateDto dto,
        CancellationToken cancellationToken)
    {
        var userId = GetUserId();
        var task = await _taskService.CreateTaskAsync(userId, dto, cancellationToken);
        return CreatedAtAction(nameof(GetTask), new { id = task.Id }, task);
    }

    // PUT: api/tasks/{id}
    [HttpPut("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<TaskResponseDto>> UpdateTask(
        Guid id,
        [FromBody] TaskUpdateDto dto,
        CancellationToken cancellationToken)
    {
        var userId = GetUserId();
        var task = await _taskService.UpdateTaskAsync(userId, id, dto, cancellationToken);
        return Ok(task);
    }

    // DELETE: api/tasks/{id}
    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteTask(
        Guid id,
        CancellationToken cancellationToken)
    {
        var userId = GetUserId();
        await _taskService.DeleteTaskAsync(userId, id, cancellationToken);
        return NoContent();
    }

    // GET: api/tasks/{id}/hierarchy
    [HttpGet("{id:guid}/hierarchy")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<ActionResult<TaskHierarchyDto>> GetTaskHierarchy(
        Guid id,
        CancellationToken cancellationToken)
    {
        var userId = GetUserId();
        var hierarchy = await _taskService.GetTaskHierarchyAsync(userId, id, cancellationToken);
        return Ok(hierarchy);
    }
}
```

**AuthController.cs Example:**

```csharp
using Microsoft.AspNetCore.Mvc;
using TaskFlow.Core.Interfaces.Services;
using TaskFlow.Core.DTOs.Auth;

namespace TaskFlow.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly ILogger<AuthController> _logger;

    public AuthController(
        IAuthService authService,
        ILogger<AuthController> logger)
    {
        _authService = authService;
        _logger = logger;
    }

    // POST: api/auth/register
    [HttpPost("register")]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<AuthResponseDto>> Register(
        [FromBody] RegisterDto dto,
        CancellationToken cancellationToken)
    {
        _logger.LogInformation("New user registration attempt: {Email}", dto.Email);
        
        var response = await _authService.RegisterAsync(dto, cancellationToken);
        return CreatedAtAction(nameof(Register), response);
    }

    // POST: api/auth/login
    [HttpPost("login")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<AuthResponseDto>> Login(
        [FromBody] LoginDto dto,
        CancellationToken cancellationToken)
    {
        _logger.LogInformation("Login attempt: {Email}", dto.Email);
        
        var response = await _authService.LoginAsync(dto, cancellationToken);
        return Ok(response);
    }

    // POST: api/auth/refresh
    [HttpPost("refresh")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<AuthResponseDto>> RefreshToken(
        [FromBody] RefreshTokenDto dto,
        CancellationToken cancellationToken)
    {
        var response = await _authService.RefreshTokenAsync(dto, cancellationToken);
        return Ok(response);
    }
}
```

## Service Layer

Services contain business logic and coordinate between controllers and repositories. They validate business rules and orchestrate complex operations.

**TaskService.cs Example:**

```csharp
using TaskFlow.Core.Interfaces.Services;
using TaskFlow.Core.Interfaces;
using TaskFlow.Core.DTOs.Tasks;
using TaskFlow.Core.Entities;
using TaskFlow.Core.Exceptions;

namespace TaskFlow.Core.Services;

public class TaskService : ITaskService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IActivityLogService _activityLogService;
    private readonly ILogger<TaskService> _logger;

    public TaskService(
        IUnitOfWork unitOfWork,
        IActivityLogService activityLogService,
        ILogger<TaskService> logger)
    {
        _unitOfWork = unitOfWork;
        _activityLogService = activityLogService;
        _logger = logger;
    }

    public async Task<PagedResponseDto<TaskResponseDto>> GetTasksAsync(
        Guid userId,
        TaskFilterDto filter,
        CancellationToken cancellationToken)
    {
        // Validate user exists
        var userExists = await _unitOfWork.Users.ExistsAsync(userId, cancellationToken);
        if (!userExists)
            throw new UnauthorizedException("User not found");

        // Build query with filters
        var query = _unitOfWork.Tasks.GetTasksForUser(userId);

        if (filter.Status.HasValue)
            query = query.Where(t => t.Status == filter.Status.Value);

        if (filter.Priority.HasValue)
            query = query.Where(t => t.Priority == filter.Priority.Value);

        if (!string.IsNullOrEmpty(filter.Search))
            query = query.Where(t => 
                t.Name.Contains(filter.Search) || 
                t.Description.Contains(filter.Search));

        if (filter.DueDateFrom.HasValue)
            query = query.Where(t => t.DueDate >= filter.DueDateFrom.Value);

        if (filter.DueDateTo.HasValue)
            query = query.Where(t => t.DueDate <= filter.DueDateTo.Value);

        // Apply pagination
        var totalCount = await query.CountAsync(cancellationToken);
        var tasks = await query
            .OrderByDescending(t => t.CreatedAt)
            .Skip((filter.Page - 1) * filter.PageSize)
            .Take(filter.PageSize)
            .ToListAsync(cancellationToken);

        var taskDtos = tasks.Select(MapToDto).ToList();

        return new PagedResponseDto<TaskResponseDto>
        {
            Items = taskDtos,
            TotalCount = totalCount,
            Page = filter.Page,
            PageSize = filter.PageSize
        };
    }

    public async Task<TaskResponseDto> CreateTaskAsync(
        Guid userId,
        TaskCreateDto dto,
        CancellationToken cancellationToken)
    {
        // Validate parent task exists if specified
        if (dto.ParentTaskId.HasValue)
        {
            var parentExists = await _unitOfWork.Tasks.ExistsAsync(
                dto.ParentTaskId.Value, 
                cancellationToken);
            
            if (!parentExists)
                throw new ValidationException("Parent task not found");

            // Prevent circular dependencies
            var wouldCreateCycle = await _unitOfWork.Tasks
                .WouldCreateCycleAsync(dto.ParentTaskId.Value, userId, cancellationToken);
            
            if (wouldCreateCycle)
                throw new ValidationException("Cannot create circular task dependencies");
        }

        var task = new Task
        {
            Id = Guid.NewGuid(),
            Name = dto.Name,
            Description = dto.Description,
            Status = dto.Status,
            Priority = dto.Priority,
            EstimatedHours = dto.EstimatedHours,
            DueDate = dto.DueDate,
            ParentTaskId = dto.ParentTaskId,
            CreatedById = userId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        await _unitOfWork.Tasks.AddAsync(task, cancellationToken);
        await _unitOfWork.CommitAsync(cancellationToken);

        // Log activity
        await _activityLogService.LogActivityAsync(
            userId,
            task.Id,
            ActivityType.TaskCreated,
            $"Created task: {task.Name}",
            cancellationToken);

        _logger.LogInformation("Task {TaskId} created by user {UserId}", task.Id, userId);

        return MapToDto(task);
    }

    public async Task<TaskHierarchyDto> GetTaskHierarchyAsync(
        Guid userId,
        Guid taskId,
        CancellationToken cancellationToken)
    {
        var task = await _unitOfWork.Tasks.GetByIdAsync(taskId, cancellationToken);
        if (task == null)
            throw new NotFoundException("Task not found");

        // Use recursive CTE function from database
        var hierarchy = await _unitOfWork.Tasks
            .GetTaskHierarchyAsync(taskId, cancellationToken);

        return hierarchy;
    }

    private static TaskResponseDto MapToDto(Task task)
    {
        return new TaskResponseDto
        {
            Id = task.Id,
            Name = task.Name,
            Description = task.Description,
            Status = task.Status,
            Priority = task.Priority,
            EstimatedHours = task.EstimatedHours,
            ActualHours = task.ActualHours,
            DueDate = task.DueDate,
            ParentTaskId = task.ParentTaskId,
            CreatedById = task.CreatedById,
            CreatedAt = task.CreatedAt,
            UpdatedAt = task.UpdatedAt
        };
    }
}
```

## Repository Pattern

Repositories abstract data access logic using interfaces. Unit of Work pattern coordinates multiple repository operations in a transaction.

**ITaskRepository.cs Interface:**

```csharp
using TaskFlow.Core.Entities;

namespace TaskFlow.Core.Interfaces.Repositories;

public interface ITaskRepository : IRepository<Task>
{
    Task<IEnumerable<Task>> GetTasksForUserAsync(
        Guid userId, 
        CancellationToken cancellationToken);
    
    Task<TaskHierarchyDto> GetTaskHierarchyAsync(
        Guid taskId, 
        CancellationToken cancellationToken);
    
    Task<bool> WouldCreateCycleAsync(
        Guid parentId, 
        Guid childId, 
        CancellationToken cancellationToken);
    
    Task<IEnumerable<Task>> GetSubtasksAsync(
        Guid parentId, 
        CancellationToken cancellationToken);
    
    IQueryable<Task> GetTasksForUser(Guid userId);
}

public interface IRepository<T> where T : class
{
    Task<T?> GetByIdAsync(Guid id, CancellationToken cancellationToken);
    Task<IEnumerable<T>> GetAllAsync(CancellationToken cancellationToken);
    Task AddAsync(T entity, CancellationToken cancellationToken);
    void Update(T entity);
    void Delete(T entity);
    Task<bool> ExistsAsync(Guid id, CancellationToken cancellationToken);
}
```

**TaskRepository.cs Implementation:**

```csharp
using Microsoft.EntityFrameworkCore;
using TaskFlow.Core.Entities;
using TaskFlow.Core.Interfaces.Repositories;
using TaskFlow.Infrastructure.Data;

namespace TaskFlow.Infrastructure.Repositories;

public class TaskRepository : Repository<Task>, ITaskRepository
{
    public TaskRepository(ApplicationDbContext context) : base(context)
    {
    }

    public async Task<IEnumerable<Task>> GetTasksForUserAsync(
        Guid userId,
        CancellationToken cancellationToken)
    {
        return await _context.Tasks
            .Where(t => t.CreatedById == userId)
            .Include(t => t.Assignees)
            .OrderByDescending(t => t.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public IQueryable<Task> GetTasksForUser(Guid userId)
    {
        return _context.Tasks
            .Where(t => t.CreatedById == userId)
            .AsQueryable();
    }

    public async Task<TaskHierarchyDto> GetTaskHierarchyAsync(
        Guid taskId,
        CancellationToken cancellationToken)
    {
        // Call PostgreSQL recursive CTE function
        var result = await _context.TaskHierarchies
            .FromSqlRaw("SELECT * FROM get_task_hierarchy({0})", taskId)
            .ToListAsync(cancellationToken);

        return BuildHierarchyTree(result);
    }

    public async Task<bool> WouldCreateCycleAsync(
        Guid parentId,
        Guid childId,
        CancellationToken cancellationToken)
    {
        // Check if parentId appears in childId's ancestor chain
        var ancestors = await _context.Tasks
            .FromSqlRaw(@"
                WITH RECURSIVE ancestors AS (
                    SELECT id, parent_task_id
                    FROM tasks
                    WHERE id = {0}
                    UNION ALL
                    SELECT t.id, t.parent_task_id
                    FROM tasks t
                    INNER JOIN ancestors a ON t.id = a.parent_task_id
                )
                SELECT id FROM ancestors WHERE id = {1}",
                childId, parentId)
            .Select(t => t.Id)
            .ToListAsync(cancellationToken);

        return ancestors.Any();
    }

    public async Task<IEnumerable<Task>> GetSubtasksAsync(
        Guid parentId,
        CancellationToken cancellationToken)
    {
        return await _context.Tasks
            .Where(t => t.ParentTaskId == parentId)
            .Include(t => t.Assignees)
            .ToListAsync(cancellationToken);
    }

    private TaskHierarchyDto BuildHierarchyTree(List<TaskHierarchy> flatList)
    {
        // Build tree structure from flat list
        var lookup = flatList.ToDictionary(t => t.Id);
        foreach (var item in flatList.Where(t => t.ParentTaskId.HasValue))
        {
            if (lookup.TryGetValue(item.ParentTaskId.Value, out var parent))
            {
                parent.Children ??= new List<TaskHierarchyDto>();
                parent.Children.Add(MapToDto(item));
            }
        }
        return MapToDto(flatList.First(t => !t.ParentTaskId.HasValue));
    }
}

public class Repository<T> : IRepository<T> where T : class
{
    protected readonly ApplicationDbContext _context;
    protected readonly DbSet<T> _dbSet;

    public Repository(ApplicationDbContext context)
    {
        _context = context;
        _dbSet = context.Set<T>();
    }

    public async Task<T?> GetByIdAsync(Guid id, CancellationToken cancellationToken)
    {
        return await _dbSet.FindAsync(new object[] { id }, cancellationToken);
    }

    public async Task<IEnumerable<T>> GetAllAsync(CancellationToken cancellationToken)
    {
        return await _dbSet.ToListAsync(cancellationToken);
    }

    public async Task AddAsync(T entity, CancellationToken cancellationToken)
    {
        await _dbSet.AddAsync(entity, cancellationToken);
    }

    public void Update(T entity)
    {
        _dbSet.Update(entity);
    }

    public void Delete(T entity)
    {
        _dbSet.Remove(entity);
    }

    public async Task<bool> ExistsAsync(Guid id, CancellationToken cancellationToken)
    {
        return await _dbSet.FindAsync(new object[] { id }, cancellationToken) != null;
    }
}
```

**UnitOfWork.cs:**

```csharp
using TaskFlow.Core.Interfaces;
using TaskFlow.Core.Interfaces.Repositories;
using TaskFlow.Infrastructure.Data;

namespace TaskFlow.Infrastructure.Repositories;

public class UnitOfWork : IUnitOfWork
{
    private readonly ApplicationDbContext _context;

    public ITaskRepository Tasks { get; }
    public IUserRepository Users { get; }
    public ITimeEntryRepository TimeEntries { get; }
    public ICommentRepository Comments { get; }

    public UnitOfWork(
        ApplicationDbContext context,
        ITaskRepository taskRepository,
        IUserRepository userRepository,
        ITimeEntryRepository timeEntryRepository,
        ICommentRepository commentRepository)
    {
        _context = context;
        Tasks = taskRepository;
        Users = userRepository;
        TimeEntries = timeEntryRepository;
        Comments = commentRepository;
    }

    public async Task<int> CommitAsync(CancellationToken cancellationToken)
    {
        return await _context.SaveChangesAsync(cancellationToken);
    }

    public void Dispose()
    {
        _context.Dispose();
    }
}
```

## Middleware Pipeline

Middleware handles cross-cutting concerns in the request pipeline.

**Program.cs Configuration:**

```csharp
using TaskFlow.Api.Extensions;
using TaskFlow.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// Add services
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Database
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// Custom service registration (DI)
builder.Services.AddApplicationServices();
builder.Services.AddInfrastructureServices();

// Authentication
builder.Services.AddJwtAuthentication(builder.Configuration);

// CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins(builder.Configuration["FrontendUrl"]!)
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials();
    });
});

var app = builder.Build();

// Middleware pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseMiddleware<CorrelationIdMiddleware>();
app.UseMiddleware<RequestLoggingMiddleware>();
app.UseMiddleware<ErrorHandlingMiddleware>();

app.UseHttpsRedirection();
app.UseCors("AllowFrontend");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// Apply migrations on startup (for Fly.io deployment)
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    await db.Database.MigrateAsync();
}

app.Run();
```

**ErrorHandlingMiddleware.cs:**

```csharp
using System.Net;
using System.Text.Json;
using TaskFlow.Core.Exceptions;
using TaskFlow.Core.DTOs.Shared;

namespace TaskFlow.Api.Middleware;

public class ErrorHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ErrorHandlingMiddleware> _logger;

    public ErrorHandlingMiddleware(
        RequestDelegate next,
        ILogger<ErrorHandlingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            await HandleExceptionAsync(context, ex);
        }
    }

    private async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        var response = context.Response;
        response.ContentType = "application/json";

        var errorResponse = new ErrorResponseDto
        {
            TraceId = context.TraceIdentifier,
            Timestamp = DateTime.UtcNow
        };

        switch (exception)
        {
            case NotFoundException notFound:
                response.StatusCode = (int)HttpStatusCode.NotFound;
                errorResponse.Message = notFound.Message;
                errorResponse.Errors = null;
                _logger.LogWarning(notFound, "Resource not found");
                break;

            case ValidationException validation:
                response.StatusCode = (int)HttpStatusCode.BadRequest;
                errorResponse.Message = "Validation failed";
                errorResponse.Errors = validation.Errors;
                _logger.LogWarning(validation, "Validation error");
                break;

            case UnauthorizedException unauthorized:
                response.StatusCode = (int)HttpStatusCode.Unauthorized;
                errorResponse.Message = unauthorized.Message;
                _logger.LogWarning(unauthorized, "Unauthorized access");
                break;

            default:
                response.StatusCode = (int)HttpStatusCode.InternalServerError;
                errorResponse.Message = "An unexpected error occurred";
                _logger.LogError(exception, "Unhandled exception");
                break;
        }

        var jsonResponse = JsonSerializer.Serialize(errorResponse);
        await response.WriteAsync(jsonResponse);
    }
}
```

## Dependency Injection Setup

**ServiceCollectionExtensions.cs:**

```csharp
using TaskFlow.Core.Interfaces;
using TaskFlow.Core.Interfaces.Services;
using TaskFlow.Core.Interfaces.Repositories;
using TaskFlow.Core.Services;
using TaskFlow.Infrastructure.Repositories;
using TaskFlow.Infrastructure.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;

namespace TaskFlow.Api.Extensions;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddApplicationServices(this IServiceCollection services)
    {
        // Core services
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<ITaskService, TaskService>();
        services.AddScoped<ITimeTrackingService, TimeTrackingService>();
        services.AddScoped<IActivityLogService, ActivityLogService>();

        return services;
    }

    public static IServiceCollection AddInfrastructureServices(this IServiceCollection services)
    {
        // Repositories
        services.AddScoped<ITaskRepository, TaskRepository>();
        services.AddScoped<IUserRepository, UserRepository>();
        services.AddScoped<ITimeEntryRepository, TimeEntryRepository>();
        services.AddScoped<ICommentRepository, CommentRepository>();
        
        // Unit of Work
        services.AddScoped<IUnitOfWork, UnitOfWork>();

        // Infrastructure services
        services.AddSingleton<IJwtTokenService, JwtTokenService>();
        services.AddSingleton<IPasswordHasher, PasswordHasher>();

        return services;
    }

    public static IServiceCollection AddJwtAuthentication(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        var jwtSettings = configuration.GetSection("JwtSettings");
        var secretKey = jwtSettings["SecretKey"]!;

        services.AddAuthentication(options =>
        {
            options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
            options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
        })
        .AddJwtBearer(options =>
        {
            options.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidateAudience = true,
                ValidateLifetime = true,
                ValidateIssuerSigningKey = true,
                ValidIssuer = jwtSettings["Issuer"],
                ValidAudience = jwtSettings["Audience"],
                IssuerSigningKey = new SymmetricSecurityKey(
                    Encoding.UTF8.GetBytes(secretKey)),
                ClockSkew = TimeSpan.Zero
            };
        });

        return services;
    }
}
```

## EF Core Configuration

**ApplicationDbContext.cs:**

```csharp
using Microsoft.EntityFrameworkCore;
using TaskFlow.Core.Entities;
using TaskFlow.Infrastructure.Configurations;

namespace TaskFlow.Infrastructure.Data;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    public DbSet<User> Users { get; set; }
    public DbSet<Task> Tasks { get; set; }
    public DbSet<TaskAssignee> TaskAssignees { get; set; }
    public DbSet<TimeEntry> TimeEntries { get; set; }
    public DbSet<Comment> Comments { get; set; }
    public DbSet<ActivityLog> ActivityLogs { get; set; }

    // For raw SQL queries
    public DbSet<TaskHierarchy> TaskHierarchies { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Apply configurations from separate files
        modelBuilder.ApplyConfiguration(new UserConfiguration());
        modelBuilder.ApplyConfiguration(new TaskConfiguration());
        modelBuilder.ApplyConfiguration(new TaskAssigneeConfiguration());
        modelBuilder.ApplyConfiguration(new TimeEntryConfiguration());
        modelBuilder.ApplyConfiguration(new CommentConfiguration());
        modelBuilder.ApplyConfiguration(new ActivityLogConfiguration());

        // Configure TaskHierarchy as keyless entity for raw SQL
        modelBuilder.Entity<TaskHierarchy>().HasNoKey().ToView(null);
    }
}
```

**TaskConfiguration.cs Example:**

```csharp
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TaskFlow.Core.Entities;

namespace TaskFlow.Infrastructure.Configurations;

public class TaskConfiguration : IEntityTypeConfiguration<Task>
{
    public void Configure(EntityTypeBuilder<Task> builder)
    {
        builder.ToTable("tasks");

        builder.HasKey(t => t.Id);
        builder.Property(t => t.Id).HasColumnName("id");

        builder.Property(t => t.Name)
            .HasColumnName("name")
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(t => t.Description)
            .HasColumnName("description")
            .HasMaxLength(2000);

        builder.Property(t => t.Status)
            .HasColumnName("status")
            .IsRequired()
            .HasConversion<string>();

        builder.Property(t => t.Priority)
            .HasColumnName("priority")
            .IsRequired()
            .HasConversion<string>();

        builder.Property(t => t.EstimatedHours)
            .HasColumnName("estimated_hours")
            .HasPrecision(10, 2);

        builder.Property(t => t.ActualHours)
            .HasColumnName("actual_hours")
            .HasPrecision(10, 2);

        builder.Property(t => t.DueDate)
            .HasColumnName("due_date");

        builder.Property(t => t.ParentTaskId)
            .HasColumnName("parent_task_id");

        builder.Property(t => t.CreatedById)
            .HasColumnName("created_by_id")
            .IsRequired();

        builder.Property(t => t.CreatedAt)
            .HasColumnName("created_at")
            .IsRequired();

        builder.Property(t => t.UpdatedAt)
            .HasColumnName("updated_at")
            .IsRequired();

        // Relationships
        builder.HasOne(t => t.CreatedBy)
            .WithMany(u => u.CreatedTasks)
            .HasForeignKey(t => t.CreatedById)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(t => t.ParentTask)
            .WithMany(t => t.Subtasks)
            .HasForeignKey(t => t.ParentTaskId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(t => t.Assignees)
            .WithOne(ta => ta.Task)
            .HasForeignKey(ta => ta.TaskId);

        builder.HasMany(t => t.TimeEntries)
            .WithOne(te => te.Task)
            .HasForeignKey(te => te.TaskId);

        builder.HasMany(t => t.Comments)
            .WithOne(c => c.Task)
            .HasForeignKey(c => c.TaskId);

        // Indexes
        builder.HasIndex(t => t.Status);
        builder.HasIndex(t => t.Priority);
        builder.HasIndex(t => t.DueDate);
        builder.HasIndex(t => t.CreatedById);
        builder.HasIndex(t => t.ParentTaskId);
        builder.HasIndex(t => t.CreatedAt);
    }
}
```

## Authentication Flow

**JwtTokenService.cs:**

```csharp
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using TaskFlow.Core.Interfaces.Services;
using TaskFlow.Core.Entities;

namespace TaskFlow.Infrastructure.Services;

public class JwtTokenService : IJwtTokenService
{
    private readonly IConfiguration _configuration;

    public JwtTokenService(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public string GenerateAccessToken(User user)
    {
        var jwtSettings = _configuration.GetSection("JwtSettings");
        var secretKey = jwtSettings["SecretKey"]!;
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(ClaimTypes.Name, user.DisplayName),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        var token = new JwtSecurityToken(
            issuer: jwtSettings["Issuer"],
            audience: jwtSettings["Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(int.Parse(jwtSettings["ExpiryMinutes"]!)),
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    public string GenerateRefreshToken()
    {
        return Convert.ToBase64String(Guid.NewGuid().ToByteArray());
    }

    public ClaimsPrincipal ValidateToken(string token)
    {
        var jwtSettings = _configuration.GetSection("JwtSettings");
        var secretKey = jwtSettings["SecretKey"]!;
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));

        var tokenHandler = new JwtSecurityTokenHandler();
        var validationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = false, // Don't validate expiry for refresh
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtSettings["Issuer"],
            ValidAudience = jwtSettings["Audience"],
            IssuerSigningKey = key
        };

        return tokenHandler.ValidateToken(token, validationParameters, out _);
    }
}
```

## Deployment Configuration

**Dockerfile:**

```dockerfile
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 8080

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["TaskFlow.Api/TaskFlow.Api.csproj", "TaskFlow.Api/"]
COPY ["TaskFlow.Core/TaskFlow.Core.csproj", "TaskFlow.Core/"]
COPY ["TaskFlow.Infrastructure/TaskFlow.Infrastructure.csproj", "TaskFlow.Infrastructure/"]
RUN dotnet restore "TaskFlow.Api/TaskFlow.Api.csproj"
COPY . .
WORKDIR "/src/TaskFlow.Api"
RUN dotnet build "TaskFlow.Api.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "TaskFlow.Api.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "TaskFlow.Api.dll"]
```

**fly.toml:**

```toml
app = "taskflow-api"
primary_region = "iad"

[build]
  dockerfile = "Dockerfile"

[env]
  ASPNETCORE_ENVIRONMENT = "Production"
  ASPNETCORE_URLS = "http://0.0.0.0:8080"

[[services]]
  internal_port = 8080
  protocol = "tcp"

  [[services.ports]]
    port = 80
    handlers = ["http"]

  [[services.ports]]
    port = 443
    handlers = ["tls", "http"]

  [[services.http_checks]]
    interval = 10000
    timeout = 2000
    grace_period = "10s"
    method = "GET"
    path = "/health"
```

**appsettings.Production.json:**

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "${DATABASE_URL}"
  },
  "JwtSettings": {
    "SecretKey": "${JWT_SECRET_KEY}",
    "Issuer": "TaskFlow.Api",
    "Audience": "TaskFlow.Web",
    "ExpiryMinutes": 60,
    "RefreshTokenExpiryDays": 7
  },
  "FrontendUrl": "${FRONTEND_URL}",
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning",
      "Microsoft.EntityFrameworkCore": "Warning"
    }
  }
}
```

---
