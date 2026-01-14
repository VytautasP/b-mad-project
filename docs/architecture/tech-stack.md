# Tech Stack

This is the **definitive technology selection** for the entire project. All development must use these exact versions and technologies.

| Category | Technology | Version | Purpose | Rationale |
|----------|-----------|---------|---------|-----------|
| **Frontend Language** | TypeScript | 5.9.3 | Type-safe JavaScript for Angular | Prevents runtime type errors, excellent IDE support, required by Angular, enables shared types with backend DTOs |
| **Frontend Framework** | Angular | 20 | SPA framework with standalone components | Latest Angular version with improved performance, enhanced signals support, standalone components, built-in dependency injection, meets NFR5-7 browser requirements |
| **UI Component Library** | Angular Material | 20 | Material Design component library | Production-ready components, accessibility (WCAG 2.1), theming support, maintained by Angular team, aligned with Angular 20 |
| **State Management** | RxJS + Services | 7.8+ | Reactive state via Observables | Built into Angular, sufficient for app complexity, avoids NgRx overhead, natural for HTTP and polling patterns |
| **Backend Language** | C# | 12.0 (.NET 8) | Strongly-typed OOP language | Type safety, async/await, LINQ, nullable reference types, excellent tooling (Visual Studio/Rider) |
| **Backend Framework** | ASP.NET Core | 8.0 LTS | Cross-platform web API framework | LTS support until Nov 2026, minimal APIs, built-in DI, middleware pipeline, fulfills NFR10 (Identity) |
| **ORM** | Entity Framework Core | 8.0 | Database ORM and migrations | Type-safe LINQ queries (NFR11), code-first migrations, lazy loading, change tracking, PostgreSQL provider |
| **API Style** | REST | OpenAPI 3.1 | RESTful HTTP endpoints | Simple, well-understood, HTTP caching, stateless (easy scaling), Swagger/OpenAPI docs generation |
| **Database** | PostgreSQL | 15+ | Relational database | Recursive CTEs (NFR19), full-text search, JSONB support, ACID transactions, free on Supabase |
| **Cache** | In-Memory | .NET MemoryCache | Server-side response caching | Built-in, zero infrastructure, sufficient for MVP, can upgrade to Redis later if needed |
| **File Storage** | Supabase Storage | Latest | Object storage for images | Free tier (1GB), signed URLs, image transformations, direct client uploads, RLS policies |
| **Authentication** | ASP.NET Core Identity | 8.0 | User authentication system | Fulfills NFR10 (bcrypt), JWT bearer tokens (FR1), refresh tokens (NFR9), password policies, email confirmation |
| **Frontend Testing** | Jasmine + Karma | 5.1+ / 6.4+ | Unit testing for Angular | Default Angular testing stack, component testing, async support, code coverage reports |
| **Backend Testing** | xUnit + Moq | 2.6+ / 4.20+ | Unit/integration testing .NET | Industry standard for .NET, async support, parameterized tests, mock EF Core DbContext |
| **E2E Testing** | Playwright | 1.40+ | Cross-browser end-to-end tests | Fast, reliable, multi-browser, auto-wait, screenshot/video capture, TypeScript support |
| **Build Tool (Frontend)** | Angular CLI | 20 | Build and dev server | Official Angular tooling, Vite-based build system, optimized production builds, tree-shaking, faster dev server |
| **Build Tool (Backend)** | .NET CLI | 8.0 | Build and publish .NET apps | Official Microsoft tooling, MSBuild, NuGet package management, Docker support |
| **Bundler** | Vite + esbuild | via Angular 20 | JavaScript bundling | Vite-based build system in Angular 20 with esbuild, 10-100x faster than webpack, HMR, ESM support, minimal config |
| **CSS Framework** | Tailwind CSS | 3.4+ | Utility-first CSS framework | Rapid UI development, tree-shaking (small bundles), design consistency, works with Angular Material |
| **Container Runtime** | Docker | 24+ | Containerization for deployment | Portable deployment to Fly.io, local dev parity with production, multi-stage builds for .NET |
| **IaC Tool** | Fly.io CLI + Dockerfile | Latest | Infrastructure as code | Simple TOML config (fly.toml), Dockerfile for .NET API, version-controlled infrastructure |
| **CI/CD** | GitHub Actions | Latest | Automated deployment pipeline | Free for public repos, matrix builds (frontend/backend), deploy to Vercel + Fly.io, secrets management |
| **Monitoring** | Fly.io Metrics + Logs | Built-in | Application monitoring | Free tier includes metrics, logs, health checks, alerting via webhook (can integrate Sentry later) |
| **Logging** | Serilog + Seq (local) | 3.1+ / Latest | Structured logging | Structured JSON logs, log levels, enrichers, writes to console (Fly.io captures), local debugging with Seq |
| **API Documentation** | Swashbuckle (Swagger) | 6.5+ | Interactive API documentation | Auto-generates OpenAPI spec from controllers, Swagger UI for testing, NSwag for TS client generation |
| **HTTP Client** | Angular HttpClient | Built-in | Frontend HTTP requests | Built into Angular, interceptors for auth, RxJS integration, automatic JSON serialization |

