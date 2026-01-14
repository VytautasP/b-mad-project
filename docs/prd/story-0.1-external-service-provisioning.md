# Story 0.1: External Service Provisioning & Infrastructure Setup

**Epic:** Pre-Epic 1 (Foundation Setup)

**As a** developer,
**I want** all external service accounts created, provisioned, and configured,
**so that** I have complete infrastructure ready for development and deployment before writing any code.

---

## Overview

This story must be completed **BEFORE Story 1.1** to ensure all external dependencies are available when development begins. This is a one-time setup task that establishes the cloud infrastructure foundation for the entire project.

---

## User Responsibilities (Manual Actions)

These tasks **MUST be performed by a human** as they require account creation, payment method verification (even for free tiers), and accepting terms of service.

### 1. Supabase Database Setup

**Purpose:** PostgreSQL database for development, testing, and production

**Steps:**
1. Navigate to [https://supabase.com](https://supabase.com)
2. Create account using GitHub authentication (recommended) or email
3. Click "New Project"
4. Configure project:
   - **Organization:** Create new or select existing
   - **Project Name:** `taskflow-prod`
   - **Database Password:** Generate strong password (save in password manager)
   - **Region:** `East US (North Virginia)` (us-east-1)
   - **Pricing Plan:** Free (0$/month - includes 500MB database, 2GB bandwidth)
5. Wait for project provisioning (2-3 minutes)
6. Navigate to **Settings > Database**
7. Copy and save the following credentials:
   - **Connection String (URI):** `postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres`
   - **Connection String (Pooling):** Use for production (connection pooler)
   - **Direct Connection String:** Use for migrations
8. Navigate to **Settings > API** and copy:
   - **Project URL:** `https://[PROJECT-REF].supabase.co`
   - **anon public key:** For frontend client (if needed later)
   - **service_role secret:** For backend server operations (keep secure)

**Deliverable:** Supabase project active with PostgreSQL database accessible

---

### 2. Fly.io Backend Hosting Setup

**Purpose:** Host .NET 8 Web API backend as Docker container

**Steps:**
1. Navigate to [https://fly.io/app/sign-up](https://fly.io/app/sign-up)
2. Create account using GitHub authentication (recommended)
3. **Payment Method:** Add credit card for verification (required even for free tier - no charges within free tier limits)
4. Install Fly.io CLI:
   - **Windows:** `iwr https://fly.io/install.ps1 -useb | iex`
   - **macOS/Linux:** `curl -L https://fly.io/install.sh | sh`
5. Authenticate CLI: `fly auth login` (opens browser)
6. Verify installation: `fly version`
7. **Do NOT run `fly launch` yet** - this will be done in Story 1.8 after Dockerfile is created

**Free Tier Limits:**
- Up to 3 shared-cpu-1x VMs with 256MB RAM each
- 160GB outbound data transfer per month
- Automatic HTTPS with Let's Encrypt certificates

**Deliverable:** Fly.io account active, CLI installed and authenticated

---

### 3. Vercel Frontend Hosting Setup

**Purpose:** Host Angular SPA with global CDN and automatic deployments

**Steps:**
1. Navigate to [https://vercel.com/signup](https://vercel.com/signup)
2. Create account using **GitHub authentication** (required for repo integration)
3. Grant Vercel access to your GitHub account/organization
4. Install Vercel CLI (optional but recommended):
   - `npm install -g vercel`
5. Authenticate CLI: `vercel login`
6. **Do NOT import project yet** - this will be done in Story 1.8 after frontend is ready

**Free Tier Limits:**
- 100GB bandwidth per month
- Automatic HTTPS with SSL certificates
- Unlimited deployments and preview environments
- Global edge network (CDN)

**Deliverable:** Vercel account active, GitHub integration authorized

---

### 4. GitHub Repository Secrets Configuration

**Purpose:** Securely store sensitive credentials for CI/CD pipelines

**Steps:**
1. Navigate to your GitHub repository
2. Go to **Settings > Secrets and variables > Actions**
3. Click **New repository secret** for each of the following:

**Secrets to Add:**

| Secret Name | Value | Purpose |
|-------------|-------|---------|
| `SUPABASE_CONNECTION_STRING` | PostgreSQL connection string (pooling) | Backend database connection |
| `SUPABASE_DIRECT_CONNECTION` | PostgreSQL direct connection string | EF Core migrations |
| `JWT_SECRET_KEY` | Generate 64-char random string | JWT token signing |
| `FLY_API_TOKEN` | From `fly auth token` command | GitHub Actions deployment to Fly.io |
| `VERCEL_TOKEN` | From Vercel Account Settings > Tokens | GitHub Actions deployment to Vercel |
| `VERCEL_ORG_ID` | From Vercel project settings | Vercel organization identifier |
| `VERCEL_PROJECT_ID` | From Vercel project settings (after import) | Vercel project identifier |

**Generate JWT Secret:**
```bash
# PowerShell
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 64 | ForEach-Object {[char]$_})

# macOS/Linux
openssl rand -base64 64
```

**Get Fly.io API Token:**
```bash
fly auth token
```

**Deliverable:** All secrets configured in GitHub repository

---

### 5. Local Development Environment File Setup

**Purpose:** Configure local development environment variables

**Steps:**
1. Create `.env.local` file in project root (this file is gitignored)
2. Add the following configuration:

```env
# Database Configuration
ConnectionStrings__DefaultConnection=Host=localhost;Port=5432;Database=taskflow_dev;Username=postgres;Password=postgres

# JWT Configuration
JwtSettings__SecretKey=[YOUR_GENERATED_SECRET_FROM_GITHUB]
JwtSettings__Issuer=TaskFlow
JwtSettings__Audience=TaskFlow
JwtSettings__ExpirationMinutes=1440

# CORS Configuration
CorsSettings__AllowedOrigins=http://localhost:4200

# Supabase Configuration (for future features)
Supabase__Url=[YOUR_PROJECT_URL]
Supabase__AnonKey=[YOUR_ANON_KEY]
Supabase__ServiceRoleKey=[YOUR_SERVICE_ROLE_KEY]
```

3. **NEVER commit `.env.local` to Git** - verify it's in `.gitignore`

**Deliverable:** `.env.local` file created with local development configuration

---

## Developer Responsibilities (Automated)

These tasks are handled by code/scripts and do NOT require manual account creation.

### 6. Local PostgreSQL via Docker Compose

**Handled by:** docker-compose.yml (created in repository)

**What it does:**
- Spins up PostgreSQL 15 container for local development
- Pre-configured with username/password matching `.env.local`
- Persistent volume for data retention across restarts
- Accessible at `localhost:5432`

**Usage:**
```bash
# Start local database
docker-compose up -d

# Stop local database
docker-compose down

# View logs
docker-compose logs -f postgres
```

**Deliverable:** Developer can run `docker-compose up -d` to start local database

---

## Acceptance Criteria

### Infrastructure Provisioning

- [ ] Supabase project created with PostgreSQL database in us-east-1 region
- [ ] Supabase connection strings (pooling and direct) saved securely
- [ ] Supabase API keys (anon public, service_role secret) saved securely
- [ ] Fly.io account created with payment method verified
- [ ] Fly.io CLI installed and authenticated (`fly auth whoami` succeeds)
- [ ] Vercel account created with GitHub integration authorized
- [ ] Vercel CLI installed and authenticated (optional but recommended)

### GitHub Configuration

- [ ] GitHub repository secrets configured with all 7 required secrets
- [ ] `JWT_SECRET_KEY` is 64+ character random string
- [ ] `FLY_API_TOKEN` obtained via `fly auth token` command
- [ ] Supabase connection strings use correct project reference
- [ ] All secrets tested (no typos or formatting errors)

### Local Development

- [ ] `.env.local` file created in project root (not committed to Git)
- [ ] `.env.local` contains database connection string pointing to localhost:5432
- [ ] `.env.local` contains same JWT secret as GitHub secrets (for consistency)
- [ ] `.gitignore` includes `.env.local` entry (verify not tracked by Git)
- [ ] Docker Desktop installed and running (for docker-compose)
- [ ] `docker-compose up -d` successfully starts PostgreSQL container
- [ ] Can connect to local database: `psql -h localhost -U postgres -d taskflow_dev`

### Documentation

- [ ] All credentials stored in secure password manager (1Password, LastPass, etc.)
- [ ] README.md updated with instructions referencing this story for setup
- [ ] Supabase project name, region, and free tier limits documented
- [ ] Fly.io free tier limits documented (3 VMs, 160GB transfer)
- [ ] Vercel free tier limits documented (100GB bandwidth)

### Validation

- [ ] Supabase SQL Editor accessible and can run `SELECT version();` query
- [ ] Fly.io dashboard shows account with no errors
- [ ] Vercel dashboard accessible with GitHub repos visible
- [ ] GitHub Actions can access all secrets (test with dummy workflow if needed)
- [ ] Local PostgreSQL responds to connection attempts

---

## Success Criteria

**This story is complete when:**
1. All three cloud services (Supabase, Fly.io, Vercel) have active accounts
2. All GitHub secrets are configured correctly
3. Local development environment (docker-compose + .env.local) is functional
4. Developer can run `docker-compose up -d` and connect to local PostgreSQL
5. All credentials are securely stored and documented
6. Team members know where to find credentials (shared password manager)

**Timeline:** 2-3 hours for one developer (includes account verification wait times)

**Blockers Resolved:** This story removes all 3 critical blockers identified in PO checklist validation

---

## Notes

- **Security:** Never commit `.env.local`, API keys, or connection strings to Git
- **Free Tier Monitoring:** Set up alerts in each platform for usage approaching limits
- **Credential Rotation:** Plan to rotate JWT secret and API keys quarterly for security
- **Team Access:** For team projects, grant other developers access to Supabase/Fly.io/Vercel via organization memberships
- **Cost Tracking:** Monitor usage in each platform dashboard to avoid unexpected charges beyond free tier

---

## Related Stories

- **Story 1.1:** Project Setup (depends on Story 0.1 completion)
- **Story 1.8:** Deployment Pipeline (uses credentials from Story 0.1)
- **Story 2.1:** Database migrations (uses Supabase connection)
