# Deployment Pipeline - Quick Start Guide

## Overview

The deployment pipeline provides automated CI/CD from development through production with:

- ✅ Automated testing & linting on every push
- ✅ Multi-stage Docker image building with BuildX cache
- ✅ Security scanning with Trivy
- ✅ Staging environment auto-deployment (develop branch)
- ✅ Production deployment on version tags
- ✅ Health checks & automatic rollback on failure
- ✅ Database migrations
- ✅ Slack notifications

## Quick Setup

### 1. Create Environment Files

```bash
# Copy templates
cp .env.staging.template .env.staging
cp .env.production.template .env.production

# Edit with secure credentials
# DO NOT commit these files
```

### 2. Configure GitHub Secrets

In GitHub repo settings → Secrets and variables → Actions:

```
STAGING_DEPLOY_KEY       # SSH private key (paste full key)
STAGING_DEPLOY_HOST      # e.g., staging.example.com
STAGING_DEPLOY_USER      # e.g., deploy

PROD_DEPLOY_KEY          # SSH private key (paste full key)
PROD_DEPLOY_HOST         # e.g., prod.example.com
PROD_DEPLOY_USER         # e.g., deploy

SLACK_WEBHOOK_URL        # https://hooks.slack.com/services/...
```

### 3. SSH Key Setup

Generate ED25519 key (Linux/Mac):
```bash
ssh-keygen -t ed25519 -f deploy_key -N ""
cat deploy_key        # Copy to STAGING_DEPLOY_KEY secret
cat deploy_key.pub    # Add to server ~/.ssh/authorized_keys
```

Windows (use PuTTY Gen or Git Bash):
```bash
ssh-keygen -t ed25519 -f deploy_key -N ""
```

## Deployment Workflow

### Development Flow

```mermaid
Local Changes → Git Push → GitHub Actions Tests
                             ↓
                        All Pass? → Build Docker Image
                             ↓
                        Push to Registry → Deploy to Staging
                                             ↓
                                        Health Check Pass? → Ready
```

### Production Flow

```mermaid
Git Tag (v1.0.0) → All Tests Pass → Security Scan
                        ↓
                    Build Image → Manual Approval in Actions
                        ↓
                    Push to Registry → Deploy to Production
                        ↓
                    Health Checks → Success!
```

## Deployment Methods

### Method 1: Local Deployment (Make)

**Staging:**
```bash
make staging           # Deploy staging environment
make staging-logs      # View logs
make staging-migrate   # Run migrations
```

**Production:**
```bash
make prod              # Deploy (interactive confirmation)
make prod-logs         # View logs
make prod-migrate      # Run migrations
```

### Method 2: Manual Docker Compose

```bash
# Staging
docker compose -f docker-compose.staging.yml --env-file .env.staging up -d

# Production  
docker compose -f docker-compose.prod.yml --env-file .env.production up -d
```

### Method 3: GitHub Actions (Automated)

**Staging:** Push to `develop` branch
```bash
git checkout develop
git push origin develop
# → Automatically deploys to staging after tests pass
```

**Production:** Create version tag
```bash
git tag v1.0.0
git push origin v1.0.0
# → Deploys to production after tests and approval
```

## File Structure

```
.
├── .github/workflows/
│   └── ci-cd.yml                 # Main CI/CD pipeline
├── docker-compose.yml            # Local development
├── docker-compose.staging.yml    # Staging environment
├── docker-compose.prod.yml       # Production environment
├── nginx.conf                    # Reverse proxy config
├── Makefile                      # Local deployment commands
├── scripts/
│   ├── deploy.sh                 # Linux/Mac deployment script
│   └── deploy.bat                # Windows deployment script
├── .env.staging.template         # Staging config template
├── .env.production.template      # Production config template
└── DEPLOYMENT.md                 # Full documentation
```

## Configuration

### Environment Variables

**Database:**
- `DB_USER` - PostgreSQL username
- `DB_PASSWORD` - PostgreSQL password  
- `DB_NAME` - Database name

**Cache:**
- `REDIS_PASSWORD` - Redis authentication

**Application:**
- `NODE_ENV` - Environment (development/staging/production)
- `LOG_LEVEL` - Logging verbosity (debug/info/warn/error)

### Docker Services

**Production compose includes:**
- `app` - Main Next.js application
- `postgres` - PostgreSQL 16 database
- `redis` - Redis 7 cache
- `nginx` - SSL/TLS reverse proxy (optional)

**Staging compose includes:**
- Same as production
- Build from source (not pre-built image)
- Source code volume mounts for quick updates
- Watch mode for automatic rebuilds

## Monitoring & Debugging

### Check Deployment Status

```bash
# GitHub Actions
gh run list --workflow=ci-cd.yml

# Docker containers
docker compose -f docker-compose.prod.yml ps

# Service health
curl https://tradehax.net/health
```

### View Logs

```bash
# All services
docker compose -f docker-compose.prod.yml logs -f

# Specific service
docker compose -f docker-compose.prod.yml logs -f app

# Last 100 lines
docker compose -f docker-compose.prod.yml logs --tail=100
```

### Troubleshooting

**Deployment stuck on health check:**
```bash
# Check app logs
docker compose -f docker-compose.prod.yml logs app

# Manually test health endpoint
docker exec tradehax-app-prod curl http://localhost:3000/health

# Restart service
docker compose -f docker-compose.prod.yml restart app
```

**Database connection issues:**
```bash
# Verify database is running
docker compose -f docker-compose.prod.yml ps postgres

# Test connection
docker compose -f docker-compose.prod.yml exec postgres psql -U $DB_USER -d $DB_NAME -c "SELECT 1"
```

**Out of memory:**
```bash
# Check resource usage
docker stats

# View current limits
docker inspect tradehax-app-prod | grep -A 5 Memory

# Increase in docker-compose.prod.yml and redeploy
make prod
```

## Database Management

### Backup

```bash
make db-backup
# Creates: backup-YYYYMMDD-HHMMSS.sql
```

### Restore

```bash
make db-restore FILE=backup-20240101-120000.sql
```

### Migrations

```bash
# Automatic (runs after deployment)
# Manual:
make prod-migrate
```

## Rollback Procedures

### Automatic (via GitHub)

On deployment failure:
1. Check GitHub Actions logs
2. Fix issues in code
3. Push new commit
4. Pipeline redeploys automatically

### Manual Rollback

**To Previous Version:**
```bash
# Find previous image
docker images tradehax

# Deploy previous version
docker pull ghcr.io/your-org/tradehax:v1.0.0
docker compose -f docker-compose.prod.yml down
# Edit docker-compose.prod.yml to use old tag
docker compose -f docker-compose.prod.yml up -d
```

**From Database Backup:**
```bash
# Stop services
docker compose -f docker-compose.prod.yml down

# Remove data volume
docker volume rm tradehax_postgres_data

# Restore from backup
make db-restore FILE=backup-20240101-120000.sql

# Start services
docker compose -f docker-compose.prod.yml up -d
```

## Performance Optimization

### Build Cache

Pipeline uses GitHub Actions cache (gha):
- Reduces build time by 50-80%
- Caches all Docker layers
- Auto-cleans after 7 days

### Image Size

Current optimizations:
- Multi-stage build (builder → runtime)
- Alpine Linux base (5MB vs 100MB+)
- Non-root user for security
- Minimal production layers

### Deployment Strategy

- Zero-downtime: old and new services run simultaneously
- Health checks ensure readiness before switching
- Automatic rollback on health check failure
- Database migrations via separate step

## Security

### Best Practices

✅ SSH key-based authentication
✅ Non-root container user (nextjs:1001)
✅ Read-only file system where possible
✅ Security headers (HSTS, X-Frame-Options, etc.)
✅ SSL/TLS encryption (nginx)
✅ Rate limiting on API endpoints
✅ Vulnerability scanning (Trivy)
✅ Environment secrets in GitHub Secrets (never in code)

### SSL/TLS Setup

For production nginx:
```bash
# Generate self-signed cert (for testing)
openssl req -x509 -newkey rsa:4096 -keyout ssl/key.pem -out ssl/cert.pem -days 365 -nodes

# Or use Let's Encrypt:
# https://certbot.eff.org/
```

## Integration Examples

### GitHub Deployment Status

Pipeline updates GitHub Deployment status:
```bash
# View in GitHub
Settings → Environments → Production
```

### Slack Notifications

Receives updates on:
- Deployment start/completion
- Success/failure status
- Deployment ID and timestamp

## Troubleshooting Common Issues

| Issue | Solution |
|-------|----------|
| Build takes too long | Pipeline uses cache; subsequent builds faster |
| SSH auth fails | Verify key format (ED25519), permissions (600), known_hosts |
| Health check fails | Check app logs, verify port 3000 accessible, check network |
| Out of memory | Increase Docker memory limit, check for memory leaks in app |
| Database won't start | Check volume permissions, verify password in env file |
| YAML validation error | Run: `docker compose config -f docker-compose.prod.yml` |

## Next Steps

1. **Create SSH keys** for deployment servers
2. **Add GitHub Secrets** with keys and hostnames
3. **Configure environment files** (.env.staging, .env.production)
4. **Test staging deployment**: Push to `develop` branch
5. **Tag version**: `git tag v1.0.0 && git push --tags`
6. **Monitor deployment**: Check GitHub Actions and Slack

## Support & Documentation

- **Pipeline details**: See DEPLOYMENT.md
- **Docker docs**: https://docs.docker.com/
- **GitHub Actions**: https://docs.github.com/en/actions
- **Next.js**: https://nextjs.org/docs

Sources:
- https://docs.docker.com/build/ci/github-actions/
- https://docs.docker.com/compose/
- https://docs.docker.com/build/concepts/overview/
