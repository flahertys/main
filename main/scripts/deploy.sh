#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() { echo -e "${GREEN}[INFO]${NC} $*"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $*"; }
log_error() { echo -e "${RED}[ERROR]${NC} $*"; exit 1; }

# Validate environment
validate_env() {
  local env_file="$1"
  
  if [ ! -f "$env_file" ]; then
    log_error "Environment file not found: $env_file"
  fi
  
  # Check required variables
  local required_vars=("DB_USER" "DB_PASSWORD" "DB_NAME" "REDIS_PASSWORD")
  for var in "${required_vars[@]}"; do
    if ! grep -q "^$var=" "$env_file"; then
      log_error "Missing required variable in $env_file: $var"
    fi
  done
}

# Deploy to environment
deploy() {
  local env="$1"
  local compose_file="$2"
  local env_file="$3"
  
  log_info "Deploying to $env..."
  
  validate_env "$env_file"
  
  cd "$PROJECT_ROOT"
  
  # Export environment variables
  set -a
  source "$env_file"
  set +a
  
  # Pull latest images
  log_info "Pulling latest images..."
  docker compose -f "$compose_file" pull || log_warn "Some images may already be up to date"
  
  # Stop old containers
  log_info "Stopping old services..."
  docker compose -f "$compose_file" down --remove-orphans || true
  
  # Start new containers
  log_info "Starting services..."
  docker compose -f "$compose_file" up -d
  
  # Wait for health checks
  log_info "Waiting for services to be healthy..."
  sleep 10
  
  # Run migrations if needed
  if [ -f "$PROJECT_ROOT/web/scripts/migrate.js" ]; then
    log_info "Running database migrations..."
    docker compose -f "$compose_file" exec -T app npm run migrate || log_warn "Migration script not found"
  fi
  
  # Health check
  log_info "Running health checks..."
  local max_attempts=30
  local attempt=1
  while [ $attempt -le $max_attempts ]; do
    if docker compose -f "$compose_file" exec -T app curl -f http://localhost:3000/health > /dev/null 2>&1; then
      log_info "✅ Deployment successful - Services are healthy"
      return 0
    fi
    echo -n "."
    sleep 2
    ((attempt++))
  done
  
  log_error "Health check failed after $max_attempts attempts"
}

# Rollback deployment
rollback() {
  local env="$1"
  local compose_file="$2"
  
  log_warn "Rolling back $env deployment..."
  
  cd "$PROJECT_ROOT"
  docker compose -f "$compose_file" down
  
  log_info "Rollback complete. Please restore from backup if needed."
}

# Show usage
usage() {
  cat << EOF
Usage: $(basename "$0") [COMMAND] [ENVIRONMENT]

Commands:
  deploy-staging    Deploy to staging environment
  deploy-prod       Deploy to production environment
  rollback-staging  Rollback staging deployment
  rollback-prod     Rollback production deployment
  status            Show deployment status
  logs              Show service logs

Environment variables:
  Set via .env.staging or .env.production files

Examples:
  $(basename "$0") deploy-staging
  $(basename "$0") deploy-prod
  $(basename "$0") logs
EOF
  exit 0
}

# Main
case "${1:-help}" in
  deploy-staging)
    deploy "staging" "docker-compose.staging.yml" ".env.staging"
    ;;
  deploy-prod)
    deploy "production" "docker-compose.prod.yml" ".env.production"
    ;;
  rollback-staging)
    rollback "staging" "docker-compose.staging.yml"
    ;;
  rollback-prod)
    rollback "production" "docker-compose.prod.yml"
    ;;
  status)
    cd "$PROJECT_ROOT"
    log_info "Staging services:"
    docker compose -f docker-compose.staging.yml ps 2>/dev/null || echo "Not deployed"
    log_info "Production services:"
    docker compose -f docker-compose.prod.yml ps 2>/dev/null || echo "Not deployed"
    ;;
  logs)
    cd "$PROJECT_ROOT"
    docker compose -f "docker-compose.${2:-staging}.yml" logs -f --tail=100
    ;;
  *)
    usage
    ;;
esac
