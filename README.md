# Developer Portal Frontend

A modern developer portal built with React, TypeScript, and Vite.

## Prerequisites

Before setting up the project, ensure you have the following installed:

- **Node.js** (v20 or higher)
- **Yarn** (v4.9.2 or higher)
- **Git**

## Setup Instructions

In a new terminal window, set up the frontend application:

```bash
# Clone the repository (if not already done)
git clone https://github.tools.sap/cfs-platform-engineering/developer-portal-frontend.git

# Install dependencies
yarn install

# Start Frontend
yarn dev
```

Frontend will run on http://localhost:3000 by default.

## Available Scripts

### Frontend Scripts

- `yarn dev` - Start the development server with hot reload
- `yarn build` - Build the application for production
- `yarn build:dev` - Build the application in development mode
- `yarn lint` - Run ESLint to check code quality
- `yarn preview` - Preview the production build locally
- `yarn test` - Run all tests
- `yarn test:watch` - Run tests in watch mode
- `yarn test:coverage` - Run tests with coverage report
- `yarn test:ui` - Run tests with UI interface

## Technology Stack

### Frontend
- **React 18** - UI library
- **TypeScript** - Type-safe JavaScript
- **Vite** - Fast build tool and development server
- **Tailwind CSS** - Utility-first CSS framework
- **TanStack Query** - Data fetching and caching

### Testing
- **Vitest** - Unit testing framework
- **React Testing Library** - React component testing utilities
- **jsdom** - DOM environment for testing

## Project Structure

```
developer-portal-v3/
├── public/                 # Static assets
├── src/
│   ├── components/        # React components
│   │   ├── ui/           # shadcn/ui components
│   │   ├── Team/         # Team-related components
│   │   ├── dialogs/      # Dialog components
│   │   ├── Homepage/     # Homepage components
│   │   ├── Sidebar/      # Sidebar components
│   │   ├── SelfService/  # Self-service components
│   │   ├── AILaunchpad/  # AI Launchpad components
│   │   ├── monitoring/   # Monitoring components
│   │   └── ...
│   ├── pages/            # Page components
│   ├── hooks/            # Custom React hooks
│   │   ├── api/          # API-related hooks
│   │   └── team/         # Team-related hooks
│   ├── contexts/         # React contexts
│   ├── services/         # API services
│   ├── types/            # TypeScript type definitions
│   ├── utils/            # Utility functions
│   ├── data/             # Mock data and configurations
│   ├── config/           # Configuration files
│   ├── lib/              # Library utilities
│   ├── features/         # Feature modules
│   └── providers/        # Context providers
├── tests/                # Test files
├── docker/               # Docker configuration
├── charts/               # Helm charts for deployment
├── package.json
└── README.md
```

## Development Workflow

1. **Start Development Server**: Run the frontend development server
2. **Development**: Make changes to the code - the dev server will hot reload
3. **Testing**: Run tests to ensure code quality
4. **Building**: Run build commands before deploying

## 🚀 Production Deployment

### Quick Deployment with Makefile

The project includes comprehensive Makefile targets for building, pushing, and deploying:

```bash
# Build Docker image
make docker-build TAG=1.0.5

# Push to registry
make docker-push TAG=1.0.5

# Or do both in one command
make docker-build-push TAG=1.0.5

# Deploy to dev environment
make deploy-dev TAG=1.0.5

# Deploy to prod environment
make deploy-prod TAG=1.0.5

# Full release workflow (build, push, update values.yaml, deploy to dev)
make release TAG=1.0.5

# Show current version from values.yaml
make version

# Show all available commands
make help
```

### Manual Deployment

```bash
# Build image
docker buildx build \
  -f ./docker/Dockerfile \
  --platform linux/amd64 \
  -t atom-cfs-docker.common.repositories.cloud.sap/dev/amit/developer-portal/frontend:1.0.5 \
  --load \
  .

# Push image
docker push atom-cfs-docker.common.repositories.cloud.sap/dev/amit/developer-portal/frontend:1.0.5

# Deploy
cd charts/developer-portal-frontend
./deploy.sh dev  # or ./deploy.sh prod
```

### Kubernetes Deployment

The deploy script supports dev and prod environments:

```bash
# Dev environment (ingress: dev.developer-portal.*)
./deploy.sh dev

# Prod environment (ingress: developer-portal.*)
./deploy.sh prod
```

The deploy script automatically:
- Configures environment-specific ingress hosts
- Sets the correct API endpoints
- Configures the ENV variable

### Common Issues

1. **Permission issues**: Ensure correct credentials are defined correctly before running the server
2. **Dependencies**: Run `yarn install` if you encounter module-related errors
4. **Build issues**: Ensure all TypeScript errors are resolved before building
