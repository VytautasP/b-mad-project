# TaskFlow - Lightweight Task Management System

TaskFlow is a hierarchical task management application with integrated time tracking, built for freelancers and small teams who need professional-grade capabilities without enterprise complexity.

## 🚀 Quick Start

### Prerequisites

- **Node.js** 20+ and npm
- **Docker Desktop** (for local database)
- **Git**

### First-Time Setup

**Before running the application, complete external service provisioning:**

👉 **Follow [Story 0.1: External Service Provisioning](docs/prd/story-0.1-external-service-provisioning.md)**

This one-time setup creates accounts and infrastructure for:
- Supabase (PostgreSQL database)
- Fly.io (backend hosting)
- Vercel (frontend hosting)
- GitHub secrets configuration

### Local Development

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd b-mad-project
   ```

2. **Install frontend dependencies**
   ```bash
   npm install
   ```

3. **Start local PostgreSQL database**
   ```bash
   docker-compose up -d
   ```

4. **Create environment file**
   ```bash
   # Create .env.local in project root (see Story 0.1 for template)
   # Add database connection string and configuration
   ```

5. **Run frontend development server**
   ```bash
   npm start
   ```

   The application will automatically open at `http://localhost:4200/`

6. **Backend setup** (when ready)
   ```bash
   cd backend/TaskFlow.Api
   dotnet restore
   dotnet run
   ```

## 📚 Documentation

- **[Product Requirements Document (PRD)](docs/prd.md)** - Complete product specification
- **[Architecture Document](docs/architecture.md)** - Technical architecture and design
- **[Story 0.1: Setup Guide](docs/prd/story-0.1-external-service-provisioning.md)** - External services setup
- **[Epic 1: Foundation](docs/prd/epic-1-foundation-basic-task-management.md)** - Development stories

## 🏗️ Tech Stack

### Frontend
- **Framework:** Angular 20 with standalone components
- **Language:** TypeScript 5.9
- **Styling:** Tailwind CSS 4.x + Angular Material 20
- **Build:** Vite + esbuild (via Angular CLI)
- **Testing:** Vitest + Jasmine

### Backend (Coming Soon)
- **Framework:** ASP.NET Core 8.0 LTS
- **Language:** C# 12
- **ORM:** Entity Framework Core 8.0
- **Database:** PostgreSQL 15+ (Supabase)
- **Authentication:** ASP.NET Core Identity + JWT

### Infrastructure
- **Frontend Hosting:** Vercel
- **Backend Hosting:** Fly.io
- **Database:** Supabase PostgreSQL
- **CI/CD:** GitHub Actions

## 📦 Available Scripts

### Development

```bash
npm start              # Start development server (localhost:4200)
npm run build          # Build for production
npm run watch          # Build in watch mode
npm test               # Run unit tests
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

