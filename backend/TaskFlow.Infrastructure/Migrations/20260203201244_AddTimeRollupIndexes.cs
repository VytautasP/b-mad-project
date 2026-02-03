using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TaskFlow.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddTimeRollupIndexes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Add index on TimeEntry.TaskId for faster time entry lookups during rollup calculation
            migrationBuilder.CreateIndex(
                name: "IX_time_entries_task_id",
                table: "time_entries",
                column: "task_id");

            // Add index on Task.ParentTaskId for faster hierarchy traversal
            migrationBuilder.CreateIndex(
                name: "IX_tasks_parent_task_id",
                table: "tasks",
                column: "parent_task_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_time_entries_task_id",
                table: "time_entries");

            migrationBuilder.DropIndex(
                name: "IX_tasks_parent_task_id",
                table: "tasks");
        }
    }
}
