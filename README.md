# TaskFlow - Lightweight Task Management System

TaskFlow is a hierarchical task management application with integrated time tracking, built for freelancers and small teams who need professional-grade capabilities without enterprise complexity.

## 🚀 Quick Start

### Prerequisites

- **Node.js** 22+ and npm 10+
- **Angular CLI** 21+
- **.NET SDK** 8.0
- **PostgreSQL** 15+ (or Docker)
- **Git**

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd b-mad-project
   ```

2. **Install frontend dependencies**
   ```bash
   npm install
   ```

3. **Setup PostgreSQL database**
   
   Option A: Using Docker
   ```bash
   docker-compose up -d
   ```
   
   Option B: Local PostgreSQL
   - Install PostgreSQL 15+
   - Create database: `createdb taskflow`

4. **Backend setup**
   ```bash
   cd backend
   dotnet restore
   dotnet build
   
   # Set connection string environment variable
   $env:CONNECTION_STRING="Host=localhost;Database=taskflow;Username=postgres;Password=postgres"
   
   # Apply migrations
   cd TaskFlow.Api
   dotnet ef database update
   
   # Run the API
   dotnet run
   ```
   
   Backend API will run at `http://localhost:5000`

5. **Run frontend development server**
   ```bash
   # In root directory
   npm start
   ```
   
   Frontend will run at `http://localhost:4200`

## 🏗️ Tech Stack

### Frontend
- **Framework:** Angular 21 with standalone components
- **Language:** TypeScript 5.9.3
- **Build Tool:** Angular CLI 21 (Vite-based with esbuild)
- **UI Library:** Angular Material 20
- **State Management:** RxJS 7.8+ Observables with Services
- **HTTP Client:** Angular HttpClient (built-in)
- **Styling:** Tailwind CSS 4.x + Angular Material
- **Testing:** Jasmine 5.1+ and Karma 6.4+

### Backend
- **Framework:** ASP.NET Core 8.0 LTS
- **Language:** C# 12.0 (.NET 8)
- **ORM:** Entity Framework Core 8.0
- **Database:** PostgreSQL 15+
- **Authentication:** ASP.NET Core Identity 8.0 with JWT
- **Logging:** Serilog 3.1+
- **API Docs:** Swashbuckle (Swagger) 6.5+
- **Testing:** xUnit 2.6+ and Moq 4.20+

### Infrastructure
- **Container:** Docker 24+
- **CI/CD:** GitHub Actions
- **Hosting:** Fly.io (backend), Vercel (frontend)
- **Database:** Supabase PostgreSQL

## 📦 Available Scripts

### Frontend Development

```bash
npm start              # Start development server (localhost:4200)
npm run build          # Build for production
npm run watch          # Build in watch mode
npm test               # Run unit tests
ng test                # Run tests with Karma
```

### Backend Development

```bash
cd backend
dotnet build           # Build solution
dotnet test            # Run tests
dotnet run --project TaskFlow.Api  # Run API
dotnet ef migrations add <name> --project TaskFlow.Infrastructure --context ApplicationDbContext  # Create migration
dotnet ef database update --project TaskFlow.Api  # Apply migrations
```

### Docker

```bash
docker-compose up -d      # Start local PostgreSQL
docker-compose down       # Stop local PostgreSQL
docker-compose logs -f    # View database logs
```

### Deployment (Automated via GitHub Actions)

```bash
# Manual deployment commands (if needed)
vercel --prod             # Deploy frontend to Vercel
fly deploy                # Deploy backend to Fly.io
```

## 🔧 Configuration

### Environment Variables

**Frontend** (src/environments/)
- `environment.ts` - Local development
- `environment.prod.ts` - Production

**Backend** (when created)
- `.env.local` - Local development (not committed)
- Fly.io secrets - Production (set via `fly secrets set`)

## 🧪 Testing

```bash
# Run unit tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage
```

## 🚢 Deployment

**Automated deployments via GitHub Actions:**
- Push to `main` branch triggers automatic deployment
- Frontend deploys to Vercel
- Backend deploys to Fly.io
- See [Story 1.8](docs/prd/epic-1-foundation-basic-task-management.md#story-18-deployment-pipeline-and-production-environment) for details

**Production URLs:**
- Frontend: https://taskflow.vercel.app
- Backend API: https://taskflow-api.fly.dev
- Health Check: https://taskflow-api.fly.dev/api/health

## 🔐 Security

- All connections use HTTPS
- JWT bearer token authentication
- Passwords hashed with bcrypt (ASP.NET Core Identity)
- CORS configured for production domains only
- Security headers enforced (XSS, frame options, content-type)

## 📈 Project Status

**Current Phase:** Epic 1 - Foundation & Basic Task Management

- ✅ Angular project initialized
- ✅ Deployment infrastructure configured
- ⏳ Backend project setup (Story 1.1)
- ⏳ Authentication system (Stories 1.2-1.3)
- ⏳ Task CRUD operations (Stories 1.4-1.7)

## 🤝 Contributing

This is a solo development project following a structured epic/story workflow. See the PRD for detailed acceptance criteria for each story.

## 📄 License

[Add your license here]

## 🆘 Support

For setup issues or questions:
1. Check [Story 0.1](docs/prd/story-0.1-external-service-provisioning.md) for infrastructure setup
2. Review [Epic 1 stories](docs/prd/epic-1-foundation-basic-task-management.md) for development guidance
3. Verify all environment variables are configured correctly

---

## Development Workflow

1. Complete Story 0.1 (external services setup) - one-time only
2. Follow Epic 1 stories sequentially (1.1 → 1.8)
3. Each story has detailed acceptance criteria
4. Push to `main` branch deploys automatically to production
5. Monitor deployments in Vercel and Fly.io dashboards

