using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TaskFlow.Abstractions.Entities;
using TaskEntity = TaskFlow.Abstractions.Entities.Task;

namespace TaskFlow.Infrastructure.Configurations;

public class TaskConfiguration : IEntityTypeConfiguration<TaskEntity>
{
    public void Configure(EntityTypeBuilder<TaskEntity> builder)
    {
        builder.ToTable("tasks");

        builder.HasKey(t => t.Id);

        builder.Property(t => t.Id)
            .HasColumnName("id")
            .ValueGeneratedOnAdd();

        builder.Property(t => t.Name)
            .HasColumnName("name")
            .HasMaxLength(200)
            .IsRequired();

        builder.Property(t => t.Description)
            .HasColumnName("description")
            .HasMaxLength(2000);

        builder.Property(t => t.ParentTaskId)
            .HasColumnName("parent_task_id");

        builder.Property(t => t.CreatedByUserId)
            .HasColumnName("created_by_user_id")
            .IsRequired();

        builder.Property(t => t.CreatedDate)
            .HasColumnName("created_date")
            .IsRequired();

        builder.Property(t => t.ModifiedDate)
            .HasColumnName("modified_date")
            .IsRequired();

        builder.Property(t => t.DueDate)
            .HasColumnName("due_date");

        builder.Property(t => t.Priority)
            .HasColumnName("priority")
            .IsRequired();

        builder.Property(t => t.Status)
            .HasColumnName("status")
            .IsRequired();

        builder.Property(t => t.Progress)
            .HasColumnName("progress")
            .IsRequired()
            .HasDefaultValue(0);

        builder.Property(t => t.Type)
            .HasColumnName("type")
            .IsRequired();

        builder.Property(t => t.IsDeleted)
            .HasColumnName("is_deleted")
            .IsRequired()
            .HasDefaultValue(false);

        // Indexes
        builder.HasIndex(t => t.CreatedByUserId)
            .HasDatabaseName("idx_tasks_created_by_user_id");

        builder.HasIndex(t => t.Status)
            .HasDatabaseName("idx_tasks_status");

        builder.HasIndex(t => t.DueDate)
            .HasDatabaseName("idx_tasks_due_date");

        builder.HasIndex(t => t.ParentTaskId)
            .HasDatabaseName("idx_tasks_parent_task_id");
        
        builder.HasIndex(t => t.Priority)
            .HasDatabaseName("idx_tasks_priority");
        
        builder.HasIndex(t => new { t.Status, t.CreatedDate })
            .HasDatabaseName("idx_tasks_status_created_date");

        // Self-referencing relationship
        builder.HasOne(t => t.ParentTask)
            .WithMany(t => t.Children)
            .HasForeignKey(t => t.ParentTaskId)
            .OnDelete(DeleteBehavior.Restrict);

        // User relationship
        builder.HasOne(t => t.CreatedByUser)
            .WithMany()
            .HasForeignKey(t => t.CreatedByUserId)
            .OnDelete(DeleteBehavior.Restrict)
            .IsRequired();
    }
}