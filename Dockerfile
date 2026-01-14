# TaskFlow Backend - .NET 8 Web API
# Multi-stage Dockerfile for production deployment to Fly.io

# ============================================================================
# Stage 1: Build Stage
# ============================================================================
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy solution and project files first (for layer caching)
# Adjust paths based on your actual backend project structure
COPY ["backend/TaskFlow.Api/TaskFlow.Api.csproj", "backend/TaskFlow.Api/"]
COPY ["backend/TaskFlow.Core/TaskFlow.Core.csproj", "backend/TaskFlow.Core/"]
COPY ["backend/TaskFlow.Infrastructure/TaskFlow.Infrastructure.csproj", "backend/TaskFlow.Infrastructure/"]

# Restore NuGet packages (cached layer if .csproj unchanged)
RUN dotnet restore "backend/TaskFlow.Api/TaskFlow.Api.csproj"

# Copy remaining source code
COPY backend/ backend/

# Build the application
WORKDIR /src/backend/TaskFlow.Api
RUN dotnet build "TaskFlow.Api.csproj" -c Release -o /app/build

# ============================================================================
# Stage 2: Publish Stage
# ============================================================================
FROM build AS publish
RUN dotnet publish "TaskFlow.Api.csproj" \
    -c Release \
    -o /app/publish \
    /p:UseAppHost=false \
    --no-restore

# ============================================================================
# Stage 3: Runtime Stage (Final Image)
# ============================================================================
FROM mcr.microsoft.com/dotnet/aspnet:8.0-alpine AS runtime

# Set working directory
WORKDIR /app

# Install curl for health checks (optional)
RUN apk add --no-cache curl

# Create non-root user for security
RUN addgroup -g 1000 taskflow && \
    adduser -D -u 1000 -G taskflow taskflow

# Copy published app from publish stage
COPY --from=publish /app/publish .

# Change ownership to non-root user
RUN chown -R taskflow:taskflow /app

# Switch to non-root user
USER taskflow

# Expose port (Fly.io uses PORT environment variable)
EXPOSE 8080

# Set environment variables
ENV ASPNETCORE_URLS=http://+:8080 \
    ASPNETCORE_ENVIRONMENT=Production \
    DOTNET_SYSTEM_GLOBALIZATION_INVARIANT=false

# Health check endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:8080/api/health || exit 1

# Start the application
ENTRYPOINT ["dotnet", "TaskFlow.Api.dll"]

# ============================================================================
# Build Instructions (from project root):
# ============================================================================
# docker build -t taskflow-api:latest .
# docker run -p 8080:8080 -e ConnectionStrings__DefaultConnection="..." taskflow-api:latest
#
# ============================================================================
# Fly.io Deployment:
# ============================================================================
# fly deploy (uses this Dockerfile automatically)
# fly secrets set ConnectionStrings__DefaultConnection="..."
# fly secrets set JwtSettings__SecretKey="..."
