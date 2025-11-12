# Developer Portal Frontend - Makefile
# Simplifies Docker and Kubernetes operations

# Configuration
DOCKER_REGISTRY := atom-cfs-docker.common.repositories.cloud.sap
IMAGE_NAME := dev/amit/developer-portal/frontend
DOCKERFILE := docker/Dockerfile
PLATFORM := linux/amd64
CHART_DIR := charts/developer-portal-frontend
VALUES_FILE := $(CHART_DIR)/values.yaml

# Get current version from values.yaml
CURRENT_VERSION := $(shell grep 'tag:' $(VALUES_FILE) | head -1 | awk '{print $$2}' | tr -d '"')

# Default target if no tag is provided
TAG ?= $(CURRENT_VERSION)

# Full image name
IMAGE := $(DOCKER_REGISTRY)/$(IMAGE_NAME):$(TAG)

# Colors for output
RED := \033[0;31m
GREEN := \033[0;32m
YELLOW := \033[1;33m
BLUE := \033[0;34m
NC := \033[0m # No Color

.PHONY: help
help: ## Show this help message
	@echo "$(BLUE)Developer Portal Frontend - Build & Deploy$(NC)"
	@echo ""
	@echo "$(GREEN)Usage:$(NC)"
	@echo "  make <target> [TAG=version]"
	@echo ""
	@echo "$(GREEN)Available targets:$(NC)"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(BLUE)%-20s$(NC) %s\n", $$1, $$2}'
	@echo ""
	@echo "$(GREEN)Examples:$(NC)"
	@echo "  make docker-build TAG=1.0.5          # Build with specific tag"
	@echo "  make docker-build-push TAG=1.0.5     # Build and push"
	@echo "  make deploy-dev TAG=1.0.5            # Deploy to dev with specific tag"
	@echo "  make deploy-prod                     # Deploy to prod with current values.yaml tag"
	@echo ""
	@echo "$(YELLOW)Current version in values.yaml: $(CURRENT_VERSION)$(NC)"

.PHONY: version
version: ## Show current version from values.yaml
	@echo "$(GREEN)Current version:$(NC) $(CURRENT_VERSION)"

.PHONY: docker-build
docker-build: ## Build Docker image (use TAG=version to override)
	@echo "$(BLUE)Building Docker image...$(NC)"
	@echo "  Image: $(IMAGE)"
	@echo "  Platform: $(PLATFORM)"
	@docker buildx build \
	  -f $(DOCKERFILE) \
	  --platform $(PLATFORM) \
	  -t $(IMAGE) \
	  --load \
	  .
	@echo "$(GREEN)✅ Build complete: $(IMAGE)$(NC)"

.PHONY: docker-push
docker-push: ## Push Docker image to registry (use TAG=version to override)
	@echo "$(BLUE)Pushing Docker image...$(NC)"
	@echo "  Image: $(IMAGE)"
	@docker push $(IMAGE)
	@echo "$(GREEN)✅ Push complete: $(IMAGE)$(NC)"

.PHONY: docker-build-push
docker-build-push: docker-build docker-push ## Build and push Docker image

.PHONY: verify-tag
verify-tag: ## Verify TAG matches values.yaml version
	@if [ "$(TAG)" != "$(CURRENT_VERSION)" ]; then \
		echo "$(YELLOW)⚠️  Warning: TAG ($(TAG)) differs from values.yaml version ($(CURRENT_VERSION))$(NC)"; \
		echo "$(YELLOW)   Update values.yaml or use TAG=$(CURRENT_VERSION)$(NC)"; \
		read -p "Continue anyway? [y/N] " -n 1 -r; \
		echo; \
		if [[ ! $$REPLY =~ ^[Yy]$$ ]]; then \
			echo "$(RED)❌ Deployment cancelled$(NC)"; \
			exit 1; \
		fi; \
	else \
		echo "$(GREEN)✅ TAG matches values.yaml version: $(TAG)$(NC)"; \
	fi

.PHONY: update-values
update-values: ## Update image tag in values.yaml (requires TAG=version)
	@if [ "$(TAG)" = "$(CURRENT_VERSION)" ]; then \
		echo "$(YELLOW)Tag $(TAG) is already set in values.yaml$(NC)"; \
	else \
		echo "$(BLUE)Updating values.yaml...$(NC)"; \
		echo "  Old version: $(CURRENT_VERSION)"; \
		echo "  New version: $(TAG)"; \
		sed -i.bak 's|tag: "$(CURRENT_VERSION)"|tag: "$(TAG)"|' $(VALUES_FILE) && rm $(VALUES_FILE).bak; \
		echo "$(GREEN)✅ Updated values.yaml$(NC)"; \
	fi

.PHONY: deploy-dev
deploy-dev: verify-tag ## Deploy to dev environment
	@echo "$(BLUE)Deploying to dev environment...$(NC)"
	@echo "  Tag: $(TAG)"
	@cd $(CHART_DIR) && ./deploy.sh dev --set image.tag=$(TAG)
	@echo "$(GREEN)✅ Deployment to dev complete$(NC)"

.PHONY: deploy-prod
deploy-prod: verify-tag ## Deploy to prod environment
	@echo "$(BLUE)Deploying to prod environment...$(NC)"
	@echo "  Tag: $(TAG)"
	@cd $(CHART_DIR) && ./deploy.sh prod --set image.tag=$(TAG)
	@echo "$(GREEN)✅ Deployment to prod complete$(NC)"

.PHONY: deploy
deploy: deploy-dev ## Alias for deploy-dev

.PHONY: release
release: ## Full release workflow: build, push, update values, deploy to dev
	@echo "$(BLUE)========================================$(NC)"
	@echo "$(BLUE)  Full Release Workflow$(NC)"
	@echo "$(BLUE)========================================$(NC)"
	@if [ "$(TAG)" = "$(CURRENT_VERSION)" ]; then \
		echo "$(RED)❌ Error: TAG must be different from current version$(NC)"; \
		echo "$(YELLOW)   Current: $(CURRENT_VERSION)$(NC)"; \
		echo "$(YELLOW)   Usage: make release TAG=1.0.5$(NC)"; \
		exit 1; \
	fi
	@echo ""
	@echo "$(YELLOW)Release version: $(TAG)$(NC)"
	@echo "$(YELLOW)Current version: $(CURRENT_VERSION)$(NC)"
	@echo ""
	@read -p "Continue with release? [y/N] " -n 1 -r; \
	echo; \
	if [[ ! $$REPLY =~ ^[Yy]$$ ]]; then \
		echo "$(RED)❌ Release cancelled$(NC)"; \
		exit 1; \
	fi
	@$(MAKE) docker-build-push TAG=$(TAG)
	@$(MAKE) update-values TAG=$(TAG)
	@$(MAKE) deploy-dev TAG=$(TAG)
	@echo ""
	@echo "$(GREEN)🎉 Release $(TAG) complete!$(NC)"
	@echo ""
	@echo "$(YELLOW)Next steps:$(NC)"
	@echo "  1. Test the deployment in dev"
	@echo "  2. Run: make deploy-prod TAG=$(TAG)"
	@echo "  3. Commit the updated values.yaml"

.PHONY: clean
clean: ## Clean up local Docker images
	@echo "$(BLUE)Cleaning up Docker images...$(NC)"
	@docker rmi $(IMAGE) 2>/dev/null || true
	@echo "$(GREEN)✅ Cleanup complete$(NC)"

.DEFAULT_GOAL := help


