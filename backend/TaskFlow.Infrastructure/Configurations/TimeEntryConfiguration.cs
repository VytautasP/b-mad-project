using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TaskFlow.Abstractions.Entities;

namespace TaskFlow.Infrastructure.Configurations;

/// <summary>
/// Entity Framework Core configuration for TimeEntry entity.
/// </summary>
public class TimeEntryConfiguration : IEntityTypeConfiguration<TimeEntry>
{
    public void Configure(EntityTypeBuilder<TimeEntry> builder)
    {
        builder.ToTable("time_entries");

        builder.HasKey(te => te.Id);

        builder.Property(te => te.Id)
            .HasColumnName("id")
            .IsRequired();

        builder.Property(te => te.TaskId)
            .HasColumnName("task_id")
            .IsRequired();

        builder.Property(te => te.UserId)
            .HasColumnName("user_id")
            .IsRequired();

        builder.Property(te => te.Minutes)
            .HasColumnName("minutes")
            .IsRequired();

        builder.Property(te => te.EntryDate)
            .HasColumnName("entry_date")
            .IsRequired();

        builder.Property(te => te.Note)
            .HasColumnName("note")
            .HasMaxLength(500)
            .IsRequired(false);

        builder.Property(te => te.EntryType)
            .HasColumnName("entry_type")
            .IsRequired()
            .HasConversion<int>();

        builder.Property(te => te.CreatedAt)
            .HasColumnName("created_at")
            .IsRequired();

        // Foreign key relationships
        builder.HasOne(te => te.Task)
            .WithMany(t => t.TimeEntries)
            .HasForeignKey(te => te.TaskId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(te => te.User)
            .WithMany()
            .HasForeignKey(te => te.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        // Indexes for performance
        builder.HasIndex(te => te.TaskId)
            .HasDatabaseName("idx_time_entries_task_id");

        builder.HasIndex(te => te.UserId)
            .HasDatabaseName("idx_time_entries_user_id");

        builder.HasIndex(te => te.EntryDate)
            .HasDatabaseName("idx_time_entries_entry_date");

        // Check constraint for Minutes
        builder.ToTable(t => t.HasCheckConstraint("CK_TimeEntry_Minutes", "minutes > 0 AND minutes <= 1440"));
    }
}
