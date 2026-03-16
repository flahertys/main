# Deployment Environment Configuration

This directory contains environment-specific configurations for deploying the TradeHax application.

## Environment Files

### Development (.env.local)
Used for local development with docker-compose.yml

### Staging (.env.staging)
```bash
# Database
DB_USER=tradehax_staging
DB_PASSWORD=<secure-password>
DB_NAME=tradehax_staging

# Redis
REDIS_PASSWORD=<secure-password>

# Application
NODE_ENV=staging
LOG_LEVEL=debug
```

### Production (.env.production)
```bash
# Database
DB_USER=tradehax_prod
DB_PASSWORD=<very-secure-password>
DB_NAME=tradehax_prod

# Redis
REDIS_PASSWORD=<very-secure-password>

# Application
NODE_ENV=production
LOG_LEVEL=info
```

## Deployment Methods

### Method 1: Using Make (Recommended)

```bash
# Deploy to staging
make staging

# Deploy to production (with confirmation)
make prod

# View logs
make staging-logs
make prod-logs

# Run migrations
make staging-migrate
make prod-migrate
```

### Method 2: Using Shell Script (Linux/Mac)

```bash
# Make script executable
chmod +x scripts/deploy.sh

# Deploy to staging
./scripts/deploy.sh deploy-staging

# Deploy to production
./scripts/deploy.sh deploy-prod

# View status
./scripts/deploy.sh status

# View logs
./scripts/deploy.sh logs staging
```

### Method 3: Using Batch Script (Windows)

```cmd
# Deploy to staging
scripts\deploy.bat deploy-staging

# Deploy to production
scripts\deploy.bat deploy-prod

# View status
scripts\deploy.bat status

# View logs
scripts\deploy.bat logs staging
```

### Method 4: Manual Docker Compose

```bash
# Deploy staging
docker compose -f docker-compose.staging.yml --env-file .env.staging up -d

# Deploy production
docker compose -f docker-compose.prod.yml --env-file .env.production up -d
```

## GitHub Actions CI/CD Pipeline

The `.github/workflows/ci-cd.yml` workflow provides automated deployment:

### Triggers
- **Develop branch push** → Deploy to staging
- **Main branch tag (v*)** → Deploy to production
- **Manual trigger** → Dispatch workflow

### Pipeline Stages

1. **Lint & Test**
   - Run smoke tests
   - Verify build
   - Check code quality

2. **Build Image**
   - Build Docker image using BuildX
   - Push to GitHub Container Registry
   - Leverage build cache (GHA)

3. **Security Scan**
   - Trivy vulnerability scanning
   - Upload to GitHub Security alerts

4. **Deploy Staging**
   - Deploy to staging environment
   - Run database migrations
   - Health check verification

5. **Deploy Production**
   - Create GitHub deployment record
   - Deploy to production server
   - Verify endpoint health
   - Update deployment status

6. **Notifications**
   - Slack webhook notifications
   - GitHub deployment status updates

## Secrets Configuration

Configure these secrets in GitHub Repository Settings:

### Container Registry
- `GITHUB_TOKEN` - Auto-provided by GitHub Actions

### Staging Deployment
- `STAGING_DEPLOY_KEY` - SSH private key (ED25519)
- `STAGING_DEPLOY_HOST` - Staging server hostname
- `STAGING_DEPLOY_USER` - SSH username

### Production Deployment
- `PROD_DEPLOY_KEY` - SSH private key (ED25519)
- `PROD_DEPLOY_HOST` - Production server hostname
- `PROD_DEPLOY_USER` - SSH username

### Notifications
- `SLACK_WEBHOOK_URL` - Slack incoming webhook

## Pre-Deployment Checklist

- [ ] All tests passing locally
- [ ] Environment files configured with secrets
- [ ] SSH keys added to GitHub secrets
- [ ] Database backups available
- [ ] Rollback plan documented
- [ ] Slack/notification channels set up

## Rollback Procedures

### Automatic Rollback
On deployment failure, the pipeline does NOT automatically rollback. Manual intervention required:

### Manual Rollback

**Staging:**
```bash
make staging-logs  # Review logs first
git revert <commit-hash>
git push origin develop
# or manually:
docker compose -f docker-compose.staging.yml down
# Restore previous container: docker run --name app <previous-image>
```

**Production:**
```bash
# View current status
docker ps -a

# Restore from backup
docker compose -f docker-compose.prod.yml down
docker volume rm <volume-name>
docker compose -f docker-compose.prod.yml up -d
# or deploy previous tag:
docker pull $REGISTRY/$IMAGE:v1.0.0  # Previous version
```

## Database Migrations

Migrations run automatically after deployment:

```bash
# Manual migration
make prod-migrate

# Database backup before migration
make db-backup

# Restore from backup if needed
make db-restore FILE=backup-20240101-120000.sql
```

## Monitoring & Health Checks

All services include health checks:

```bash
# View health status
docker compose -f docker-compose.prod.yml ps

# Check specific endpoint
curl https://tradehax.net/health

# View container health details
docker inspect --format='{{.State.Health.Status}}' tradehax-app-prod
```

## Performance Tuning

### Build Cache
- Uses GitHub Actions cache
- Reduces build time significantly
- Automatic cleanup after 7 days

### Image Optimization
- Multi-stage Dockerfile
- Alpine Linux base image
- Minimal layers and size

### Deployment Strategy
- Zero-downtime: Services overlap during transition
- Health checks ensure service readiness
- Automatic rollout on health check failure

## Troubleshooting

### Deployment Hangs
```bash
# Check service logs
docker compose -f docker-compose.prod.yml logs app

# Check health endpoint
curl -v https://tradehax.net/health

# Manually restart
docker compose -f docker-compose.prod.yml restart app
```

### Database Connection Issues
```bash
# Test connection
docker compose -f docker-compose.prod.yml exec postgres psql -U $DB_USER -d $DB_NAME

# Check environment variables
docker compose -f docker-compose.prod.yml exec app env | grep DATABASE
```

### Memory/Resource Issues
```bash
# Monitor resource usage
docker stats

# Increase limits in docker-compose.prod.yml and restart
make prod
```

## Support

For deployment issues, check:
1. GitHub Actions logs: https://github.com/your-org/your-repo/actions
2. Server SSH logs: `journalctl -u docker -n 100`
3. Container logs: `docker compose logs -f <service>`
4. Health endpoint: `curl -v https://tradehax.net/health`
