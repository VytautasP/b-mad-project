using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TaskFlow.Abstractions.Entities;

namespace TaskFlow.Infrastructure.Configurations;

public class TaskAssignmentConfiguration : IEntityTypeConfiguration<TaskAssignment>
{
    public void Configure(EntityTypeBuilder<TaskAssignment> builder)
    {
        builder.ToTable("task_assignees");

        // Composite primary key
        builder.HasKey(ta => new { ta.TaskId, ta.UserId });

        builder.Property(ta => ta.TaskId)
            .HasColumnName("task_id")
            .IsRequired();

        builder.Property(ta => ta.UserId)
            .HasColumnName("user_id")
            .IsRequired();

        builder.Property(ta => ta.AssignedDate)
            .HasColumnName("assigned_date")
            .IsRequired()
            .HasDefaultValueSql("CURRENT_TIMESTAMP");

        builder.Property(ta => ta.AssignedByUserId)
            .HasColumnName("assigned_by_user_id")
            .IsRequired();

        // Indexes
        builder.HasIndex(ta => ta.TaskId)
            .HasDatabaseName("idx_task_assignees_task_id");

        builder.HasIndex(ta => ta.UserId)
            .HasDatabaseName("idx_task_assignees_user_id");

        builder.HasIndex(ta => ta.AssignedDate)
            .HasDatabaseName("idx_task_assignees_assigned_date");

        // Foreign key relationships
        builder.HasOne(ta => ta.Task)
            .WithMany(t => t.TaskAssignments)
            .HasForeignKey(ta => ta.TaskId)
            .OnDelete(DeleteBehavior.Cascade)
            .IsRequired();

        builder.HasOne(ta => ta.User)
            .WithMany()
            .HasForeignKey(ta => ta.UserId)
            .OnDelete(DeleteBehavior.Cascade)
            .IsRequired();

        builder.HasOne(ta => ta.AssignedByUser)
            .WithMany()
            .HasForeignKey(ta => ta.AssignedByUserId)
            .OnDelete(DeleteBehavior.Cascade)
            .IsRequired();
    }
}
