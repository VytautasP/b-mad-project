using TaskFlow.Abstractions.Interfaces;
using TaskFlow.Abstractions.Interfaces.Repositories;
using TaskFlow.Infrastructure.Repositories;

namespace TaskFlow.Api.Extensions;

public static class RepositoryExtensions
{
    /// <summary>
    /// Registers all repository dependencies and Unit of Work pattern implementation.
    /// </summary>
    public static IServiceCollection AddRepositories(this IServiceCollection services)
    {
        // Register individual repositories
        services.AddScoped<IUserRepository, UserRepository>();
        services.AddScoped<ITaskRepository, TaskRepository>();
        services.AddScoped<ITaskAssignmentRepository, TaskAssignmentRepository>();
        services.AddScoped<ITimeEntryRepository, TimeEntryRepository>();
        services.AddScoped<ICommentRepository, CommentRepository>();
        
        // Register Unit of Work
        services.AddScoped<IUnitOfWork, UnitOfWork>();
        
        return services;
    }
}
