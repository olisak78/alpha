#!/bin/bash

###############################################################################
# Developer Portal Frontend - Kubernetes Deployment Script
###############################################################################
# This script automates the deployment of the frontend to Kubernetes using Helm
# 
# Prerequisites:
#   - kubectl configured with cluster access
#   - helm 3.x installed
#   - docker installed (for building images)
#
# Usage:
#   ./deploy.sh <dev|prod> [options]
#
# Parameters:
#   <dev|prod>          Environment (required) - controls ingress host prefix
#
# Options:
#   --set key=value     Override Helm values (can be used multiple times)
#   --dry-run           Run helm in dry-run mode
#   --help              Show this help message
###############################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
CHART_DIR="${SCRIPT_DIR}"

# Check for --help flag first (before validating environment)
if [[ "$1" == "--help" || "$1" == "-h" ]]; then
    # Define show_help inline here since it comes later in the script
    cat << 'EOF'
Developer Portal Frontend - Deployment Script

Usage: ./deploy.sh <dev|prod> [options]

Parameters:
    <dev|prod>              Environment (required)
                            - dev:  Ingress host with 'dev.' prefix
                            - prod: Ingress host without prefix

Options:
    --set key=value         Override Helm values (can be used multiple times)
    --dry-run               Run helm in dry-run mode (don't actually deploy)
    --help                  Show this help message

Examples:
    # Deploy to dev environment
    ./deploy.sh dev

    # Deploy to production environment
    ./deploy.sh prod

    # Override specific values
    ./deploy.sh dev --set image.tag=v1.2.3

    # Test deployment without applying
    ./deploy.sh dev --dry-run

    # Combine options
    ./deploy.sh prod --set image.tag=v1.0.0 --set replicaCount=3

Environment Configuration:
    dev:  
      - Ingress: dev.developer-portal.cfs.c.eu-de-2.cloud.sap
      - Backend: https://dev.backend.developer-portal.cfs.c.eu-de-2.cloud.sap
    
    prod:
      - Ingress: developer-portal.cfs.c.eu-de-2.cloud.sap
      - Backend: https://backend.developer-portal.cfs.c.eu-de-2.cloud.sap

Prerequisites:
    - kubectl configured with cluster access
    - helm 3.x installed
    - Docker image already built and pushed to registry
EOF
    exit 0
fi

# Environment parameter (dev or prod) - REQUIRED
ENVIRONMENT=$1

# Validate environment parameter before anything else
if [[ -z "$ENVIRONMENT" ]]; then
    echo -e "${RED}❌ ERROR: Environment parameter is required${NC}"
    echo "Usage: ./deploy.sh <dev|prod> [options]"
    echo "Example: ./deploy.sh dev"
    echo "Example: ./deploy.sh prod"
    echo ""
    echo "Use --help for more information"
    exit 1
fi

if [[ "$ENVIRONMENT" != "dev" && "$ENVIRONMENT" != "prod" ]]; then
    echo -e "${RED}❌ ERROR: Environment parameter must be 'dev' or 'prod'${NC}"
    echo "Usage: ./deploy.sh <dev|prod> [options]"
    echo "Example: ./deploy.sh dev"
    echo "Example: ./deploy.sh prod"
    echo ""
    echo "Use --help for more information"
    exit 1
fi

# Shift to process remaining arguments
shift

# Default values
NAMESPACE="developer-portal"
RELEASE_NAME="developer-portal-frontend"
DRY_RUN=false
HELM_SETS=()

# Set ingress host and backend URL based on environment
BASE_FRONTEND_HOST="developer-portal.cfs.c.eu-de-2.cloud.sap"
BASE_BACKEND_HOST="backend.developer-portal.cfs.c.eu-de-2.cloud.sap"

if [ "$ENVIRONMENT" == "dev" ]; then
    INGRESS_HOST="dev.$BASE_FRONTEND_HOST"
    BACKEND_URL="https://dev.$BASE_BACKEND_HOST"
else
    INGRESS_HOST="$BASE_FRONTEND_HOST"
    BACKEND_URL="https://$BASE_BACKEND_HOST"
fi

# Add ingress host and backend URL to Helm sets
HELM_SETS+=("ingress.host=$INGRESS_HOST")
HELM_SETS+=("env.BACKEND_URL=$BACKEND_URL")
HELM_SETS+=("env.ENV=$ENVIRONMENT")

###############################################################################
# Helper Functions
###############################################################################

print_header() {
    echo -e "${BLUE}=================================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}=================================================${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

###############################################################################
# Check Requirements
###############################################################################

check_requirements() {
    print_header "Checking Requirements"
    
    local missing_tools=()
    
    # Check kubectl
    if ! command -v kubectl &> /dev/null; then
        missing_tools+=("kubectl")
    else
        print_success "kubectl is installed"
    fi
    
    # Check helm
    if ! command -v helm &> /dev/null; then
        missing_tools+=("helm")
    else
        print_success "helm is installed"
    fi
    
    if [ ${#missing_tools[@]} -ne 0 ]; then
        print_error "Missing required tools: ${missing_tools[*]}"
        print_info "Please install missing tools and try again"
        exit 1
    fi
    
    # Check cluster connectivity
    if ! kubectl cluster-info &> /dev/null; then
        print_error "Unable to connect to Kubernetes cluster"
        print_info "Please configure kubectl and try again"
        exit 1
    fi
    
    print_success "Connected to Kubernetes cluster"
    echo ""
}

###############################################################################
# Deploy with Helm
###############################################################################

deploy_helm_chart() {
    print_header "Deploying with Helm"
    
    local helm_args=(
        "upgrade"
        "${RELEASE_NAME}"
        "${CHART_DIR}"
        "--install"
        "--namespace" "${NAMESPACE}"
        "--create-namespace"
        "--wait"
        "--timeout" "5m"
    )
    
    # Add custom --set overrides
    for set_value in "${HELM_SETS[@]}"; do
        helm_args+=("--set" "${set_value}")
    done
    
    if [ "$DRY_RUN" = true ]; then
        helm_args+=("--dry-run")
        print_warning "Running in dry-run mode"
    fi
    
    print_info "Environment: ${ENVIRONMENT}"
    print_info "Release: ${RELEASE_NAME}"
    print_info "Namespace: ${NAMESPACE}"
    print_info "Chart: ${CHART_DIR}"
    print_info "Ingress Host: ${INGRESS_HOST}"
    print_info "Backend URL: ${BACKEND_URL}"
    
    if [ ${#HELM_SETS[@]} -gt 0 ]; then
        print_info "Value overrides:"
        for set_value in "${HELM_SETS[@]}"; do
            echo "  - ${set_value}"
        done
    fi
    
    echo ""
    helm "${helm_args[@]}"
    
    print_success "Helm deployment completed"
    echo ""
}

###############################################################################
# Verify Deployment
###############################################################################

verify_deployment() {
    print_header "Verifying Deployment"
    
    if [ "$DRY_RUN" = true ]; then
        print_warning "Skipping verification (dry-run mode)"
        return
    fi
    
    print_info "Checking pods in namespace: ${NAMESPACE}"
    kubectl get pods -n "${NAMESPACE}" -l app.kubernetes.io/name=developer-portal-frontend
    echo ""
    
    print_info "Checking service"
    kubectl get svc -n "${NAMESPACE}" -l app.kubernetes.io/name=developer-portal-frontend
    echo ""
    
    print_info "Checking ingress"
    kubectl get ingress -n "${NAMESPACE}"
    echo ""
    
    # Get ingress host
    local ingress_host=$(kubectl get ingress -n "${NAMESPACE}" -l app.kubernetes.io/name=developer-portal-frontend -o jsonpath='{.items[0].spec.rules[0].host}' 2>/dev/null || echo "")
    
    print_success "Deployment verification completed"
    if [ -n "${ingress_host}" ]; then
        print_info "Frontend URL: https://${ingress_host}"
    fi
    echo ""
}

###############################################################################
# Show Help
###############################################################################

show_help() {
    cat << EOF
Developer Portal Frontend - Deployment Script

Usage: ./deploy.sh <dev|prod> [options]

Parameters:
    <dev|prod>              Environment (required)
                            - dev:  Ingress host with 'dev.' prefix
                            - prod: Ingress host without prefix

Options:
    --set key=value         Override Helm values (can be used multiple times)
    --dry-run               Run helm in dry-run mode (don't actually deploy)
    --help                  Show this help message

Examples:
    # Deploy to dev environment
    ./deploy.sh dev

    # Deploy to production environment
    ./deploy.sh prod

    # Override specific values
    ./deploy.sh dev --set image.tag=v1.2.3

    # Test deployment without applying
    ./deploy.sh dev --dry-run

    # Combine options
    ./deploy.sh prod --set image.tag=v1.0.0 --set replicaCount=3

Environment Configuration:
    dev:  
      - Ingress: dev.developer-portal.cfs.c.eu-de-2.cloud.sap
      - Backend: https://dev.backend.developer-portal.cfs.c.eu-de-2.cloud.sap
    
    prod:
      - Ingress: developer-portal.cfs.c.eu-de-2.cloud.sap
      - Backend: https://backend.developer-portal.cfs.c.eu-de-2.cloud.sap

Prerequisites:
    - kubectl configured with cluster access
    - helm 3.x installed
    - Docker image already built and pushed to registry
    - values.yaml configured with your settings

Configuration:
    Edit values.yaml to configure:
    - Docker image repository and tag
    - Resource limits and requests
    - Number of replicas
    - Other Helm chart values

Build Docker Image First:
    cd ${PROJECT_ROOT}
    docker build -f docker/Dockerfile -t <your-registry>/<image>:<tag> .
    docker push <your-registry>/<image>:<tag>

EOF
}

###############################################################################
# Parse Arguments
###############################################################################

parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --namespace)
                NAMESPACE="$2"
                shift 2
                ;;
            --set)
                HELM_SETS+=("$2")
                shift 2
                ;;
            --dry-run)
                DRY_RUN=true
                shift
                ;;
            --help)
                show_help
                exit 0
                ;;
            *)
                print_error "Unknown option: $1"
                show_help
                exit 1
                ;;
        esac
    done
}

###############################################################################
# Main
###############################################################################

main() {
    parse_args "$@"
    
    print_header "Developer Portal Frontend - Deployment"
    echo ""
    
    check_requirements
    deploy_helm_chart
    verify_deployment
    
    print_header "Deployment Complete! 🎉"
    print_success "Frontend is now deployed"
    
    if [ "$DRY_RUN" = false ]; then
        local ingress_host=$(kubectl get ingress -n "${NAMESPACE}" -l app.kubernetes.io/name=developer-portal-frontend -o jsonpath='{.items[0].spec.rules[0].host}' 2>/dev/null || echo "")
        if [ -n "${ingress_host}" ]; then
            print_info "Access your application at: https://${ingress_host}"
        fi
    fi
    echo ""
}

# Run main function
main "$@"
