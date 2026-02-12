using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TaskFlow.Abstractions.Entities;

namespace TaskFlow.Infrastructure.Configurations;

public class ActivityLogConfiguration : IEntityTypeConfiguration<ActivityLog>
{
    public void Configure(EntityTypeBuilder<ActivityLog> builder)
    {
        builder.ToTable("activity_logs");

        builder.HasKey(a => a.Id);

        builder.Property(a => a.Id)
            .HasColumnName("id")
            .ValueGeneratedOnAdd();

        builder.Property(a => a.TaskId)
            .HasColumnName("task_id")
            .IsRequired();

        builder.Property(a => a.UserId)
            .HasColumnName("user_id")
            .IsRequired();

        builder.Property(a => a.ActivityType)
            .HasColumnName("activity_type")
            .IsRequired();

        builder.Property(a => a.Description)
            .HasColumnName("description")
            .HasMaxLength(500)
            .IsRequired();

        builder.Property(a => a.ChangedField)
            .HasColumnName("changed_field")
            .HasMaxLength(100)
            .IsRequired(false);

        builder.Property(a => a.OldValue)
            .HasColumnName("old_value")
            .HasMaxLength(2000)
            .IsRequired(false);

        builder.Property(a => a.NewValue)
            .HasColumnName("new_value")
            .HasMaxLength(2000)
            .IsRequired(false);

        builder.Property(a => a.Timestamp)
            .HasColumnName("timestamp")
            .IsRequired();

        builder.HasOne(a => a.Task)
            .WithMany(t => t.ActivityLogs)
            .HasForeignKey(a => a.TaskId)
            .OnDelete(DeleteBehavior.Restrict)
            .IsRequired();

        builder.HasOne(a => a.User)
            .WithMany(u => u.ActivityLogs)
            .HasForeignKey(a => a.UserId)
            .OnDelete(DeleteBehavior.Restrict)
            .IsRequired();

        builder.HasIndex(a => new { a.TaskId, a.Timestamp })
            .HasDatabaseName("idx_activity_logs_task_id_timestamp")
            .IsDescending(false, true);

        builder.HasIndex(a => a.Timestamp)
            .HasDatabaseName("idx_activity_logs_timestamp")
            .IsDescending();
    }
}
