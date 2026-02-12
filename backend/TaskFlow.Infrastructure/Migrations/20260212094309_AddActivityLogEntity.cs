using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TaskFlow.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddActivityLogEntity : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "activity_logs",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    task_id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    activity_type = table.Column<int>(type: "integer", nullable: false),
                    description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    changed_field = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    old_value = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    new_value = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    timestamp = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_activity_logs", x => x.id);
                    table.ForeignKey(
                        name: "FK_activity_logs_tasks_task_id",
                        column: x => x.task_id,
                        principalTable: "tasks",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_activity_logs_users_user_id",
                        column: x => x.user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "idx_activity_logs_task_id_timestamp",
                table: "activity_logs",
                columns: new[] { "task_id", "timestamp" },
                descending: new[] { false, true });

            migrationBuilder.CreateIndex(
                name: "idx_activity_logs_timestamp",
                table: "activity_logs",
                column: "timestamp",
                descending: new bool[0]);

            migrationBuilder.CreateIndex(
                name: "IX_activity_logs_user_id",
                table: "activity_logs",
                column: "user_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "activity_logs");
        }
    }
}
