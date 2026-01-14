# TaskFlow Deployment Guide

Complete guide for deploying TaskFlow to production (Vercel + Fly.io + Supabase).

## 📋 Prerequisites Checklist

Before deploying, ensure you've completed:

- ✅ [Story 0.1: External Service Provisioning](docs/prd/story-0.1-external-service-provisioning.md)
- ✅ All GitHub repository secrets configured
- ✅ Backend project created with Dockerfile
- ✅ Frontend production build tested locally

---

## 🚀 Quick Deployment (Automated)

**Automated via GitHub Actions on every push to `main` branch:**

```bash
git add .
git commit -m "feat: deploy to production"
git push origin main
```

GitHub Actions will automatically:
1. Run frontend tests
2. Run backend tests (if backend exists)
3. Deploy frontend to Vercel
4. Deploy backend to Fly.io

Monitor deployment: https://github.com/YOUR_ORG/YOUR_REPO/actions

---

## 🛠️ Manual Deployment

### Frontend to Vercel

```bash
# Install Vercel CLI (if not already installed)
npm install -g vercel

# Login to Vercel
vercel login

# Deploy to production
vercel --prod

# Or using npm script (if configured)
npm run deploy:frontend
```

**Expected output:**
```
✔ Production: https://taskflow.vercel.app [copied to clipboard]
```

### Backend to Fly.io

```bash
# Install Fly.io CLI (if not already installed)
# Windows PowerShell:
iwr https://fly.io/install.ps1 -useb | iex

# macOS/Linux:
curl -L https://fly.io/install.sh | sh

# Login to Fly.io
fly auth login

# Deploy (from project root where fly.toml is located)
fly deploy

# Check deployment status
fly status

# View logs
fly logs
```

**Expected output:**
```
==> Verifying app config
--> Verified app config
==> Building image
--> Building image done
==> Pushing image to fly
--> Pushing image done
==> Monitoring deployment
 1 desired, 1 placed, 1 healthy, 0 unhealthy
--> v1 deployed successfully
```

---

## 🔧 First-Time Setup (One-Time Only)

### 1. Supabase Database Setup

```bash
# Already completed in Story 0.1, but here's a reminder:
# 1. Create Supabase project: https://supabase.com
# 2. Note connection string from Settings > Database
# 3. Connection string format:
#    Host=db.[PROJECT-REF].supabase.co;Port=5432;Database=postgres;Username=postgres;Password=[PASSWORD];Pooling=true
```

### 2. Vercel Project Setup

```bash
# First-time project import
vercel

# Follow prompts:
# - Link to existing project? No
# - Project name: taskflow
# - Directory: ./
# - Override settings? No

# Note the generated URLs:
# - Production: https://taskflow.vercel.app
# - Development: https://taskflow-[username].vercel.app

# Configure environment variables in Vercel dashboard:
# Settings > Environment Variables
# Add: API_URL = https://taskflow-api.fly.dev
```

### 3. Fly.io Application Setup

```bash
# First-time app creation
fly launch --no-deploy

# Follow prompts:
# - App name: taskflow-api (or your preferred name)
# - Region: iad (US East - Ashburn)
# - PostgreSQL? No (using Supabase)
# - Redis? No

# Set secrets (DO NOT skip this!)
fly secrets set \
  ConnectionStrings__DefaultConnection="Host=db.[PROJECT-REF].supabase.co;Port=5432;Database=postgres;Username=postgres;Password=[PASSWORD];Pooling=true;Minimum Pool Size=0;Maximum Pool Size=10" \
  JwtSettings__SecretKey="[YOUR-64-CHAR-SECRET]" \
  JwtSettings__Issuer="TaskFlow" \
  JwtSettings__Audience="TaskFlow" \
  JwtSettings__ExpirationMinutes="1440" \
  CorsSettings__AllowedOrigins="https://taskflow.vercel.app"

# Verify secrets are set
fly secrets list

# Now deploy
fly deploy

# Run database migrations (after first deployment)
fly ssh console
# Inside container:
dotnet ef database update --project TaskFlow.Infrastructure --startup-project TaskFlow.Api
exit
```

---

## 🔍 Verification Checklist

After deployment, verify:

### Frontend (Vercel)
- [ ] Frontend loads: https://taskflow.vercel.app
- [ ] No console errors in browser DevTools
- [ ] Routing works (refresh on any page doesn't 404)
- [ ] Assets load correctly (images, styles)
- [ ] Security headers present (check Network tab)

### Backend (Fly.io)
- [ ] Health check responds: https://taskflow-api.fly.dev/api/health
- [ ] Returns JSON: `{"status":"healthy","timestamp":"..."}`
- [ ] Swagger docs accessible: https://taskflow-api.fly.dev/swagger
- [ ] SSL certificate valid (no browser warnings)

### End-to-End
- [ ] Register new user account
- [ ] Login with registered user
- [ ] Create new task
- [ ] Edit task
- [ ] Delete task
- [ ] Logout and login again
- [ ] No CORS errors in browser console

### Performance
- [ ] Initial page load <3 seconds (NFR1)
- [ ] Task list loads <500ms (NFR2)
- [ ] Lighthouse score >90 (Performance, Accessibility, Best Practices)

---

## 📊 Monitoring & Logs

### Vercel Monitoring

```bash
# View recent deployments
vercel ls

# View deployment logs
vercel logs [deployment-url]

# Access Vercel Dashboard
# https://vercel.com/dashboard
```

**Metrics to monitor:**
- Bandwidth usage (100GB/month free tier limit)
- Build minutes
- Deployment success rate

### Fly.io Monitoring

```bash
# View application status
fly status

# View live logs (tail)
fly logs

# View historical logs
fly logs --past 1h

# View metrics
fly dashboard
# Opens browser to: https://fly.io/apps/taskflow-api

# SSH into running instance
fly ssh console

# Scale instances (if needed)
fly scale count 1 --region iad
```

**Metrics to monitor:**
- CPU/memory usage
- Request rate and response times
- Error rate
- Outbound bandwidth (160GB/month free tier limit)

### Supabase Monitoring

**Access Supabase Dashboard:**
- https://supabase.com/dashboard/project/[PROJECT-REF]

**Database Monitoring:**
- Database size (500MB free tier limit)
- Active connections
- Query performance
- Database health

---

## 🔄 Rollback Procedures

### Rollback Frontend (Vercel)

```bash
# List recent deployments
vercel ls

# Promote previous deployment to production
vercel promote [DEPLOYMENT-URL]

# Example:
vercel promote https://taskflow-abc123.vercel.app
```

**Via Vercel Dashboard:**
1. Go to https://vercel.com/dashboard
2. Select project "taskflow"
3. Go to "Deployments" tab
4. Find previous successful deployment
5. Click "..." menu → "Promote to Production"

### Rollback Backend (Fly.io)

```bash
# List recent releases
fly releases

# Rollback to previous version
fly releases rollback

# Rollback to specific version
fly releases rollback v2

# Verify rollback
fly status
```

---

## ⚠️ Troubleshooting

### Issue: CORS errors in browser

**Symptoms:** Browser console shows CORS policy errors

**Solution:**
1. Verify backend CORS secret is set correctly:
   ```bash
   fly secrets list
   # Should show CorsSettings__AllowedOrigins
   ```

2. Update CORS origin to match exact Vercel URL:
   ```bash
   fly secrets set CorsSettings__AllowedOrigins="https://taskflow.vercel.app"
   ```

3. Restart backend:
   ```bash
   fly apps restart taskflow-api
   ```

### Issue: Backend deployment fails

**Symptoms:** `fly deploy` exits with error

**Common causes:**
- Dockerfile not found → Ensure Dockerfile is in project root
- Build fails → Check Dockerfile paths match actual project structure
- Memory limit exceeded → Scale to larger instance: `fly scale vm shared-cpu-1x --memory 512`

**Debugging:**
```bash
# View full build logs
fly deploy --verbose

# Check app configuration
fly info

# Validate fly.toml
fly config validate
```

### Issue: Database connection fails

**Symptoms:** Backend logs show "Could not connect to database"

**Solution:**
1. Verify Supabase connection string:
   - Go to Supabase dashboard > Settings > Database
   - Copy "Connection pooling" string (not "Direct connection")

2. Update secret with correct connection string:
   ```bash
   fly secrets set ConnectionStrings__DefaultConnection="[CORRECT-STRING]"
   ```

3. Test connection from Fly.io instance:
   ```bash
   fly ssh console
   apt-get update && apt-get install -y postgresql-client
   psql "Host=db.[PROJECT-REF].supabase.co;Port=5432;Database=postgres;Username=postgres;Password=[PASSWORD]"
   ```

### Issue: GitHub Actions deployment fails

**Symptoms:** Workflow fails on deployment step

**Solution:**
1. Verify all GitHub secrets are set:
   - VERCEL_TOKEN
   - VERCEL_ORG_ID
   - VERCEL_PROJECT_ID
   - FLY_API_TOKEN

2. Check workflow logs: https://github.com/YOUR_ORG/YOUR_REPO/actions

3. Re-run failed workflow after fixing secrets

### Issue: Vercel build fails

**Symptoms:** Build step fails with "Module not found" or compilation error

**Solution:**
1. Test build locally:
   ```bash
   npm run build
   ```

2. If local build succeeds, clear Vercel cache:
   ```bash
   vercel --prod --force
   ```

3. Check Node.js version matches:
   - Vercel uses Node.js 20 by default
   - Ensure package.json has no version conflicts

---

## 💰 Cost Monitoring (Free Tier Limits)

### Vercel Free Tier
- ✅ 100GB bandwidth/month
- ✅ Unlimited deployments
- ✅ Automatic HTTPS

**Warning threshold:** 80GB bandwidth (~25 days into month)

### Fly.io Free Tier
- ✅ Up to 3 shared-cpu-1x VMs (256MB RAM each)
- ✅ 160GB outbound bandwidth/month
- ✅ 3GB persistent storage total

**Warning threshold:** 
- 128GB bandwidth (~24 days into month)
- 80% memory usage

### Supabase Free Tier
- ✅ 500MB database
- ✅ 2GB bandwidth/month
- ✅ 50K rows read/day, 20K rows write/day

**Warning threshold:**
- 400MB database (~80% full)
- 40K rows read/day

**Set up alerts:**
- Supabase: Project Settings > Usage > Set up alerts
- Fly.io: Dashboard > Metrics > Configure alerts
- Vercel: Project Settings > Usage > Email notifications

---

## 📚 Related Documentation

- [Story 0.1: External Service Provisioning](docs/prd/story-0.1-external-service-provisioning.md)
- [Story 1.8: Deployment Pipeline](docs/prd/epic-1-foundation-basic-task-management.md#story-18-deployment-pipeline-and-production-environment)
- [Architecture Document](docs/architecture.md)
- [README.md](README.md)

---

## 🆘 Emergency Contacts

**Service Status Pages:**
- Vercel: https://www.vercel-status.com/
- Fly.io: https://status.fly.io/
- Supabase: https://status.supabase.com/

**Support Channels:**
- Vercel: https://vercel.com/support
- Fly.io: https://community.fly.io/
- Supabase: https://supabase.com/dashboard/support
