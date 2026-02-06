using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TaskFlow.Abstractions.Entities;

namespace TaskFlow.Infrastructure.Configurations;

/// <summary>
/// Entity Framework Core configuration for Comment entity.
/// </summary>
public class CommentConfiguration : IEntityTypeConfiguration<Comment>
{
    public void Configure(EntityTypeBuilder<Comment> builder)
    {
        builder.ToTable("comments");

        builder.HasKey(c => c.Id);

        builder.Property(c => c.Id)
            .HasColumnName("id")
            .IsRequired();

        builder.Property(c => c.TaskId)
            .HasColumnName("task_id")
            .IsRequired();

        builder.Property(c => c.UserId)
            .HasColumnName("user_id")
            .IsRequired();

        builder.Property(c => c.Content)
            .HasColumnName("content")
            .HasMaxLength(2000)
            .IsRequired();

        builder.Property(c => c.CreatedDate)
            .HasColumnName("created_date")
            .IsRequired();

        builder.Property(c => c.ModifiedDate)
            .HasColumnName("modified_date")
            .IsRequired(false);

        builder.Property(c => c.IsDeleted)
            .HasColumnName("is_deleted")
            .HasDefaultValue(false)
            .IsRequired();

        builder.Property(c => c.MentionedUserIds)
            .HasColumnName("mentioned_user_ids")
            .HasColumnType("jsonb")
            .IsRequired(false);

        // Foreign key relationships
        builder.HasOne(c => c.Task)
            .WithMany()
            .HasForeignKey(c => c.TaskId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(c => c.User)
            .WithMany()
            .HasForeignKey(c => c.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        // Indexes for performance
        builder.HasIndex(c => c.TaskId)
            .HasDatabaseName("idx_comments_task_id")
            .HasFilter("is_deleted = false");

        builder.HasIndex(c => c.UserId)
            .HasDatabaseName("idx_comments_user_id");

        builder.HasIndex(c => c.CreatedDate)
            .HasDatabaseName("idx_comments_created_date")
            .IsDescending()
            .HasFilter("is_deleted = false");

        // Global query filter: auto-exclude soft-deleted comments
        builder.HasQueryFilter(c => !c.IsDeleted);
    }
}