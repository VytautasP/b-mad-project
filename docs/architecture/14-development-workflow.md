# 14. Development Workflow

This section defines the complete development setup and workflow for local development, including prerequisites, initial setup, daily development commands, and debugging procedures.

## Prerequisites

Before starting development, ensure the following tools are installed:

**Required:**
```powershell
# Node.js 20 LTS
node --version  # Should output v20.x.x
npm --version   # Should output v10.x.x

# .NET 8 SDK
dotnet --version  # Should output 8.0.x

# PostgreSQL 15+ (or use Docker)
psql --version  # Should output 15.x or higher

# Docker Desktop (for containerized development)
docker --version
docker-compose --version

# Git
git --version
```

**Recommended:**
```powershell
# Visual Studio Code
code --version

# Angular CLI (global)
npm install -g @angular/cli@20

# Entity Framework Core CLI
dotnet tool install --global dotnet-ef

# PowerShell 7+ (if on Windows)
pwsh --version
```

**VS Code Extensions:**
- Angular Language Service
- C# Dev Kit
- ESLint
- Prettier
- Docker
- GitLens
- REST Client

## Initial Setup

### 1. Clone Repository

```powershell
# Clone the repository
git clone https://github.com/your-org/taskflow.git
cd taskflow
```

### 2. Frontend Setup

```powershell
cd frontend

# Install dependencies
npm install

# Copy environment template
Copy-Item .env.example .env.development

# Edit .env.development with your local settings
code .env.development

# Verify setup
npm run lint
npm test -- --watch=false
```

**Frontend `.env.development` Configuration:**
```bash
VITE_API_URL=http://localhost:5000
VITE_API_TIMEOUT=30000
VITE_ENABLE_ANALYTICS=false
VITE_ENABLE_DEBUG_LOGGING=true
```

### 3. Backend Setup

```powershell
cd ../backend

# Restore NuGet packages
dotnet restore

# Copy environment template
Copy-Item .env.example .env

# Edit .env with your local database connection
code .env

# Build solution
dotnet build

# Run tests
dotnet test
```

**Backend `.env` Configuration:**
```bash
DATABASE_URL=Host=localhost;Database=taskflow_dev;Username=taskflow_user;Password=taskflow_pass
JWT_SECRET_KEY=dev-secret-key-minimum-32-characters-long-for-hs256
JWT_ISSUER=TaskFlow.Api
JWT_AUDIENCE=TaskFlow.Web
JWT_EXPIRY_MINUTES=60
JWT_REFRESH_TOKEN_EXPIRY_DAYS=7
FRONTEND_URL=http://localhost:4200
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
```

### 4. Database Setup

**Option A: Docker (Recommended)**

```powershell
# Start PostgreSQL container
docker-compose up -d postgres

# Wait for database to be ready
Start-Sleep -Seconds 5

# Run migrations
cd backend/TaskFlow.Api
dotnet ef database update

# Seed development data (optional)
dotnet run -- --seed
```

**Option B: Local PostgreSQL**

```powershell
# Create database and user
psql -U postgres

# In psql:
CREATE DATABASE taskflow_dev;
CREATE USER taskflow_user WITH PASSWORD 'taskflow_pass';
GRANT ALL PRIVILEGES ON DATABASE taskflow_dev TO taskflow_user;
\q

# Run migrations
cd backend/TaskFlow.Api
dotnet ef database update
```

### 5. Verify Setup

```powershell
# Terminal 1: Start backend
cd backend
dotnet run --project TaskFlow.Api

# Terminal 2: Start frontend
cd frontend
npm start

# Terminal 3: Run tests
cd backend
dotnet watch test

# Terminal 4: Frontend tests
cd frontend
npm test
```

Open browser to:
- Frontend: http://localhost:4200
- Backend API: http://localhost:5000
- Swagger UI: http://localhost:5000/swagger

## Development Commands

### Frontend Commands

```powershell
cd frontend

# Start development server
npm start                           # Runs on http://localhost:4200

# Build for production
npm run build                       # Output to dist/

# Build with production optimization
npm run build:prod

# Run unit tests
npm test                            # Runs in watch mode
npm test -- --watch=false           # Single run
npm test -- --code-coverage         # With coverage report

# Run linter
npm run lint                        # Check for issues
npm run lint:fix                    # Auto-fix issues

# Format code
npm run format                      # Prettier format all files
npm run format:check                # Check formatting

# Type checking
npm run type-check                  # TypeScript type checking

# Analyze bundle size
npm run analyze                     # Opens bundle analyzer

# Generate component
ng generate component features/tasks/task-summary --style=scss

# Generate service
ng generate service core/services/notification

# Update dependencies
npm outdated                        # Check for updates
npm update                          # Update within semver range
```

### Backend Commands

```powershell
cd backend

# Start development server with hot reload
dotnet watch run --project TaskFlow.Api

# Build solution
dotnet build                        # Debug build
dotnet build -c Release             # Release build

# Run all tests
dotnet test                         # Run all tests
dotnet test --filter "FullyQualifiedName~TaskService"  # Specific tests
dotnet test --collect:"XPlat Code Coverage"  # With coverage

# Run specific test project
dotnet test TaskFlow.Tests/TaskFlow.Tests.csproj

# Entity Framework migrations
dotnet ef migrations add MigrationName --project TaskFlow.Infrastructure --startup-project TaskFlow.Api
dotnet ef database update --project TaskFlow.Api
dotnet ef migrations remove --project TaskFlow.Infrastructure --startup-project TaskFlow.Api
dotnet ef database drop --project TaskFlow.Api  # Careful!

# Clean solution
dotnet clean

# Restore packages
dotnet restore

# Format code
dotnet format                       # Format all code
dotnet format --verify-no-changes   # Check formatting

# Run API locally
dotnet run --project TaskFlow.Api --environment Development

# Generate API client (NSwag)
cd TaskFlow.Api
dotnet build
nswag run nswag.json
```

### Docker Commands

```powershell
# Start all services
docker-compose up -d

# Start specific service
docker-compose up -d postgres
docker-compose up -d backend

# View logs
docker-compose logs -f              # All services
docker-compose logs -f backend      # Specific service

# Stop all services
docker-compose down

# Stop and remove volumes (data loss!)
docker-compose down -v

# Rebuild containers
docker-compose build
docker-compose up -d --build

# Execute command in container
docker-compose exec postgres psql -U taskflow_user -d taskflow_dev
docker-compose exec backend dotnet ef database update

# View running containers
docker-compose ps
```

### Database Commands

```powershell
# Connect to database
psql -h localhost -U taskflow_user -d taskflow_dev

# Backup database
pg_dump -h localhost -U taskflow_user taskflow_dev > backup.sql

# Restore database
psql -h localhost -U taskflow_user taskflow_dev < backup.sql

# Run migration script
psql -h localhost -U taskflow_user -d taskflow_dev -f database/migrations/001_initial_schema.sql

# Run seed script
psql -h localhost -U taskflow_user -d taskflow_dev -f database/seeds/dev_seed_data.sql
```

### Git Workflow Commands

```powershell
# Create feature branch
git checkout -b feature/task-filters

# Stage changes
git add .

# Commit with conventional format
git commit -m "feat(tasks): add advanced filtering options

Implements task filtering by status, priority, and date range.
Adds query parameter support to TasksController.

Closes #123"

# Push branch
git push origin feature/task-filters

# Create pull request (using GitHub CLI)
gh pr create --title "Add advanced task filtering" --body "Description here"

# Update branch with main
git checkout main
git pull origin main
git checkout feature/task-filters
git rebase main

# Squash commits
git rebase -i HEAD~3
```

## Daily Development Workflow

**Morning Startup:**

```powershell
# 1. Pull latest changes
git checkout main
git pull origin main

# 2. Update dependencies
cd frontend
npm install
cd ../backend
dotnet restore

# 3. Start services
docker-compose up -d

# 4. Run migrations
cd backend/TaskFlow.Api
dotnet ef database update

# 5. Start development servers
# Terminal 1:
cd backend
dotnet watch run --project TaskFlow.Api

# Terminal 2:
cd frontend
npm start
```

**Feature Development:**

```powershell
# 1. Create feature branch
git checkout -b feature/add-task-tags

# 2. Generate necessary files
cd frontend
ng generate component features/tasks/tag-selector --style=scss

cd ../backend
# Add TagDto.cs, update TaskDto.cs, etc.

# 3. Implement feature
# Write code...

# 4. Add tests
cd frontend
ng generate component features/tasks/tag-selector --skip-import
# Edit tag-selector.component.spec.ts

cd ../backend
# Add TagServiceTests.cs

# 5. Run tests continuously
# Terminal 3:
cd frontend
npm test

# Terminal 4:
cd backend
dotnet watch test

# 6. Commit incrementally
git add .
git commit -m "feat(tasks): add tag selector component"

git add .
git commit -m "test(tasks): add tag selector tests"
```

**Before Pushing:**

```powershell
# 1. Run linters
cd frontend
npm run lint:fix
npm run format

cd ../backend
dotnet format

# 2. Run all tests
cd frontend
npm test -- --watch=false --code-coverage

cd ../backend
dotnet test --collect:"XPlat Code Coverage"

# 3. Build production
cd frontend
npm run build:prod

cd ../backend
dotnet build -c Release

# 4. Push changes
git push origin feature/add-task-tags

# 5. Create pull request
gh pr create --web
```

## Debugging

### Frontend Debugging (VS Code)

**launch.json:**
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "chrome",
      "request": "launch",
      "name": "Launch Chrome against localhost",
      "url": "http://localhost:4200",
      "webRoot": "${workspaceFolder}/frontend/src",
      "sourceMapPathOverrides": {
        "webpack:/*": "${webRoot}/*"
      }
    },
    {
      "type": "chrome",
      "request": "attach",
      "name": "Attach to Chrome",
      "port": 9222,
      "webRoot": "${workspaceFolder}/frontend/src"
    }
  ]
}
```

**Browser DevTools:**
- Install Angular DevTools extension
- Use breakpoints in Sources tab
- Inspect component state with Angular DevTools
- Monitor network requests in Network tab

### Backend Debugging (VS Code)

**launch.json:**
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": ".NET Core Launch (web)",
      "type": "coreclr",
      "request": "launch",
      "preLaunchTask": "build",
      "program": "${workspaceFolder}/backend/TaskFlow.Api/bin/Debug/net8.0/TaskFlow.Api.dll",
      "args": [],
      "cwd": "${workspaceFolder}/backend/TaskFlow.Api",
      "stopAtEntry": false,
      "serverReadyAction": {
        "action": "openExternally",
        "pattern": "\\bNow listening on:\\s+(https?://\\S+)"
      },
      "env": {
        "ASPNETCORE_ENVIRONMENT": "Development"
      },
      "sourceFileMap": {
        "/Views": "${workspaceFolder}/Views"
      }
    },
    {
      "name": ".NET Core Attach",
      "type": "coreclr",
      "request": "attach"
    }
  ]
}
```

**Debugging Steps:**
1. Set breakpoints in C# code
2. Press F5 to start debugging
3. Make API request from frontend or Swagger
4. Step through code with F10 (step over), F11 (step into)
5. Inspect variables in Debug Console

### Database Debugging

```powershell
# Enable query logging in appsettings.Development.json
{
  "Logging": {
    "LogLevel": {
      "Microsoft.EntityFrameworkCore.Database.Command": "Information"
    }
  }
}

# View SQL queries in console
dotnet watch run --project TaskFlow.Api

# Use pgAdmin or DBeaver for visual query debugging
# Connection: localhost:5432, user: taskflow_user, db: taskflow_dev

# Analyze query performance
EXPLAIN ANALYZE SELECT * FROM tasks WHERE status = 'InProgress';

# View active queries
SELECT * FROM pg_stat_activity WHERE datname = 'taskflow_dev';
```

## Troubleshooting

**Common Issues:**

**Frontend won't start:**
```powershell
# Clear node_modules and reinstall
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json
npm install

# Clear Angular cache
Remove-Item -Recurse -Force .angular
```

**Backend won't start:**
```powershell
# Clear build artifacts
dotnet clean
Remove-Item -Recurse -Force */bin, */obj
dotnet restore
dotnet build
```

**Database connection fails:**
```powershell
# Check PostgreSQL is running
docker-compose ps

# Verify connection string in .env
# Check database exists
psql -h localhost -U taskflow_user -l

# Reset database
dotnet ef database drop --project TaskFlow.Api
dotnet ef database update --project TaskFlow.Api
```

**Port conflicts:**
```powershell
# Find process using port 4200 (frontend)
netstat -ano | findstr :4200
taskkill /PID <process_id> /F

# Find process using port 5000 (backend)
netstat -ano | findstr :5000
taskkill /PID <process_id> /F
```

**Migration conflicts:**
```powershell
# Revert last migration
cd backend/TaskFlow.Api
dotnet ef migrations remove --project ../TaskFlow.Infrastructure

# Reset database to specific migration
dotnet ef database update MigrationName --project TaskFlow.Api
```

**TypeScript errors:**
```powershell
cd frontend
# Clear TypeScript cache
Remove-Item -Recurse -Force node_modules/.cache
# Rebuild
npm run build
```

## Code Quality Checks

**Pre-commit Checks:**
```powershell
# Frontend quality checks
cd frontend
npm run lint
npm run format:check
npm run type-check
npm test -- --watch=false

# Backend quality checks
cd backend
dotnet format --verify-no-changes
dotnet build -warnaserror
dotnet test
```

**CI/CD Simulation:**
```powershell
# Simulate GitHub Actions locally
# Frontend
cd frontend
npm ci
npm run lint
npm test -- --watch=false --code-coverage
npm run build:prod

# Backend
cd backend
dotnet restore
dotnet build -c Release -warnaserror
dotnet test -c Release --collect:"XPlat Code Coverage"
```

## Performance Profiling

**Frontend:**
```powershell
# Build with source maps
npm run build:prod -- --source-map

# Lighthouse CI
npm install -g @lhci/cli
lhci autorun

# Bundle analyzer
npm run analyze
```

**Backend:**
```powershell
# Enable detailed logging
# appsettings.Development.json
{
  "Logging": {
    "LogLevel": {
      "Default": "Debug",
      "Microsoft.EntityFrameworkCore": "Information"
    }
  }
}

# Use dotnet-trace for profiling
dotnet tool install --global dotnet-trace
dotnet trace collect --process-id <pid> --profile cpu-sampling
```

## Useful Scripts

Create these PowerShell scripts in `scripts/` directory:

**scripts/dev-setup.ps1:**
```powershell
# Complete development setup
Write-Host "Setting up TaskFlow development environment..." -ForegroundColor Green

# Frontend
Write-Host "Installing frontend dependencies..." -ForegroundColor Yellow
cd frontend
npm install

# Backend
Write-Host "Restoring backend packages..." -ForegroundColor Yellow
cd ../backend
dotnet restore

# Database
Write-Host "Starting database..." -ForegroundColor Yellow
docker-compose up -d postgres
Start-Sleep -Seconds 5

# Migrations
Write-Host "Running migrations..." -ForegroundColor Yellow
cd TaskFlow.Api
dotnet ef database update

Write-Host "Setup complete! Run 'docker-compose up -d' to start all services." -ForegroundColor Green
```

**scripts/reset-dev-db.ps1:**
```powershell
# Reset development database
Write-Host "Resetting development database..." -ForegroundColor Yellow

cd backend/TaskFlow.Api
dotnet ef database drop --force
dotnet ef database update

Write-Host "Database reset complete!" -ForegroundColor Green
```

**scripts/run-all-tests.ps1:**
```powershell
# Run all tests
$ErrorActionPreference = "Stop"

Write-Host "Running frontend tests..." -ForegroundColor Yellow
cd frontend
npm test -- --watch=false --code-coverage

Write-Host "Running backend tests..." -ForegroundColor Yellow
cd ../backend
dotnet test --collect:"XPlat Code Coverage"

Write-Host "All tests passed!" -ForegroundColor Green
```

This development workflow enables efficient local development with clear commands and troubleshooting procedures.