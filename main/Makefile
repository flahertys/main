.PHONY: help build build-prod push test lint dev staging prod logs clean deploy-staging deploy-prod rollback

# Variables
IMAGE_NAME ?= tradehax
IMAGE_TAG ?= latest
REGISTRY ?= ghcr.io
FULL_IMAGE ?= $(REGISTRY)/$(IMAGE_NAME):$(IMAGE_TAG)

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  %-20s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

# Development
dev: ## Start development environment
	docker compose -f docker-compose.yml up

dev-down: ## Stop development environment
	docker compose -f docker-compose.yml down

dev-logs: ## Show development logs
	docker compose -f docker-compose.yml logs -f

dev-build: ## Rebuild development images
	docker compose -f docker-compose.yml build --no-cache

dev-shell: ## Open shell in app container
	docker compose -f docker-compose.yml exec app sh

# Testing & Linting
test: ## Run smoke tests
	docker compose -f docker-compose.yml exec app npm run test:smoke

lint: ## Run linting checks
	docker compose -f docker-compose.yml exec app npm run lint

verify: test lint ## Run all verifications

build: ## Build image locally
	docker build -t $(IMAGE_NAME):$(IMAGE_TAG) .

build-prod: ## Build production image with optimizations
	docker build -t $(IMAGE_NAME):prod \
		--target=runtime \
		--build-arg BUILDKIT_INLINE_CACHE=1 \
		.

# Container Registry
login: ## Login to container registry
	docker login $(REGISTRY)

push: build ## Build and push image to registry
	docker tag $(IMAGE_NAME):$(IMAGE_TAG) $(FULL_IMAGE)
	docker push $(FULL_IMAGE)

push-latest: build ## Push image as latest
	docker tag $(IMAGE_NAME):$(IMAGE_TAG) $(REGISTRY)/$(IMAGE_NAME):latest
	docker push $(REGISTRY)/$(IMAGE_NAME):latest

# Staging Deployment
staging: ## Deploy to staging
	@if [ ! -f .env.staging ]; then echo "Error: .env.staging not found"; exit 1; fi
	docker compose -f docker-compose.staging.yml --env-file .env.staging down --remove-orphans
	docker compose -f docker-compose.staging.yml --env-file .env.staging up -d
	@echo "Waiting for services..."
	@sleep 5
	docker compose -f docker-compose.staging.yml --env-file .env.staging ps

staging-logs: ## Show staging logs
	docker compose -f docker-compose.staging.yml --env-file .env.staging logs -f --tail=100

staging-migrate: ## Run migrations on staging
	docker compose -f docker-compose.staging.yml --env-file .env.staging exec -T app npm run migrate

# Production Deployment
prod: ## Deploy to production
	@if [ ! -f .env.production ]; then echo "Error: .env.production not found"; exit 1; fi
	@echo "⚠️  WARNING: This will deploy to PRODUCTION"
	@echo "Press Ctrl+C to cancel, Enter to continue..."
	@read dummy
	docker compose -f docker-compose.prod.yml --env-file .env.production down --remove-orphans
	docker compose -f docker-compose.prod.yml --env-file .env.production up -d
	@echo "Waiting for services..."
	@sleep 5
	docker compose -f docker-compose.prod.yml --env-file .env.production ps

prod-logs: ## Show production logs
	docker compose -f docker-compose.prod.yml --env-file .env.production logs -f --tail=100

prod-migrate: ## Run migrations on production
	docker compose -f docker-compose.prod.yml --env-file .env.production exec -T app npm run migrate

# Cleanup
clean: ## Remove images and containers
	docker compose -f docker-compose.yml down -v
	docker compose -f docker-compose.staging.yml down -v
	docker compose -f docker-compose.prod.yml down -v
	docker system prune -f

clean-all: ## Remove all Docker resources
	docker system prune -a -f
	docker volume prune -f

# Database
db-backup: ## Backup production database
	docker compose -f docker-compose.prod.yml exec postgres pg_dump -U tradehax tradehax > backup-$$(date +%Y%m%d-%H%M%S).sql

db-restore: ## Restore database from backup file (FILE=backup.sql make db-restore)
	@if [ -z "$(FILE)" ]; then echo "Error: FILE not specified"; exit 1; fi
	docker compose -f docker-compose.prod.yml exec -T postgres psql -U tradehax tradehax < $(FILE)

# Status & Info
status: ## Show deployment status
	@echo "=== Development ==="
	@docker compose -f docker-compose.yml ps 2>/dev/null || echo "Not running"
	@echo ""
	@echo "=== Staging ==="
	@docker compose -f docker-compose.staging.yml ps 2>/dev/null || echo "Not running"
	@echo ""
	@echo "=== Production ==="
	@docker compose -f docker-compose.prod.yml ps 2>/dev/null || echo "Not running"

image-info: ## Show image information
	@echo "Images:"
	@docker images | grep $(IMAGE_NAME)

version: ## Show build information
	@echo "Build info:"
	@echo "  Image: $(FULL_IMAGE)"
	@echo "  Tag: $(IMAGE_TAG)"
	@echo "  Registry: $(REGISTRY)"
