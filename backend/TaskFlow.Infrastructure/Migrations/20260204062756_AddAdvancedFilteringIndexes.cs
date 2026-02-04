using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TaskFlow.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddAdvancedFilteringIndexes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "idx_tasks_priority",
                table: "tasks",
                column: "priority");

            migrationBuilder.CreateIndex(
                name: "idx_tasks_status_created_date",
                table: "tasks",
                columns: new[] { "status", "created_date" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "idx_tasks_priority",
                table: "tasks");

            migrationBuilder.DropIndex(
                name: "idx_tasks_status_created_date",
                table: "tasks");
        }
    }
}
