# Health Dashboard

Real-time component health monitoring dashboard for CIS 2.0 Project.

## Overview

The Health Dashboard displays the health status of all components across landscapes by calling their public `/health` endpoints. It provides:

- ✅ Real-time health status monitoring (UP/DOWN/ERROR)
- 🔄 Automatic health checks on landscape switch
- 📊 Summary statistics (Total, Healthy, Down, Errors)
- 🔍 Search and filter components
- 📖 Expandable detailed health information
- 🔗 Direct links to component health endpoints

## Usage

The Health Dashboard is integrated into the CIS Page as a new tab and uses the same landscape management as the Components tab:

```tsx
// In CisPage.tsx
<HealthDashboard
  projectId="cis20"
  components={cisApiComponents}
  landscapeGroups={landscapeGroups}
  selectedLandscape={selectedLandscape}
  onLandscapeChange={setSelectedLandscape}
  onShowLandscapeDetails={() => setShowLandscapeDetails(true)}
  isLoadingComponents={cisComponentsLoading}
/>
```

**Key Features:**
- Uses the same `LandscapeFilter` component as Components tab
- Shares landscape state with the parent page
- Environment grouping (Canary, Live, etc.)
- Consistent UX across all tabs

## Architecture

### Components

1. **HealthDashboard** - Main container component
   - Manages landscape selection
   - Orchestrates health checks
   - Displays summary and table

2. **HealthOverview** - Summary statistics cards
   - Total components
   - Healthy count with percentage
   - Down count with percentage
   - Error count with percentage

3. **HealthTable** - Table displaying all components
   - Search functionality
   - Sortable columns
   - Expandable rows for details

4. **HealthRow** - Individual component row
   - Status badge
   - Response time
   - Last checked timestamp
   - Expand/collapse toggle
   - External link to health endpoint

5. **HealthDetails** - Nested health information
   - Circuit breakers status
   - Database connections
   - Kafka status
   - Redis status
   - And more...

6. **StatusBadge** - Visual status indicator
   - UP: Green
   - DOWN: Red
   - UNKNOWN: Yellow
   - LOADING: Blue (animated)
   - ERROR: Red with alert icon

### API Service

**healthApi.ts** provides utilities for:

- `buildHealthEndpoint()` - Constructs health URLs from component + landscape
- `fetchHealthStatus()` - Fetches individual health status (NO CACHE)
- `fetchAllHealthStatuses()` - Parallel health checks for all components

### Custom Hook

**useHealth.ts** manages health check state:

- Fetches health statuses when landscape changes
- Tracks progress during batch fetching
- Calculates summary statistics
- Provides manual refresh function
- Aborts ongoing requests when landscape changes

## Health Endpoint Format

Components must expose a `/health` endpoint with this format:

```json
{
  "status": "UP",
  "components": {
    "db": {
      "status": "UP",
      "details": { "hello": 1 }
    },
    "kafka": {
      "status": "UP",
      "details": {
        "central": { "clusterId": "..." }
      }
    },
    "circuitBreakers": {
      "status": "UP",
      "components": {
        "xsuaa": {
          "status": "UP",
          "details": {
            "failureRate": "0.0%",
            "state": "CLOSED"
          }
        }
      }
    }
  }
}
```

## URL Construction

Health endpoints are constructed dynamically:

```
Component: accounts-service
Landscape: eu10-canary (route: cfapps.sap.hana.ondemand.com)
Health URL: https://accounts-service.cfapps.sap.hana.ondemand.com/health
```

## Features

### No Caching
- Uses `cache: 'no-store'` in fetch requests
- Clears state completely on landscape switch
- Aborts ongoing requests before starting new ones
- Always shows fresh, real-time data

### Error Handling
- Individual component failures don't block dashboard
- Shows ERROR status for failed health checks
- Displays error message in status badge tooltip
- Allows manual refresh for retry

### Performance
- Parallel requests using `Promise.allSettled()`
- Progress indicator during batch fetching
- Abort controller for canceling requests
- Expandable details only loaded when expanded

### Accessibility
- Keyboard navigation support
- ARIA labels for screen readers
- Focus management for expandable rows
- High contrast colors for status indicators

## Type Definitions

See `src/types/health.ts` for all TypeScript interfaces:

- `HealthStatus` - UP | DOWN | UNKNOWN | OUT_OF_SERVICE | ERROR
- `HealthResponse` - Response from /health endpoint
- `ComponentHealth` - Individual component health
- `ComponentHealthCheck` - Health check result
- `HealthDashboardState` - Dashboard state
- `HealthSummary` - Summary statistics
- `LandscapeConfig` - Landscape configuration

## Testing

Run tests:

```bash
yarn test src/components/Health
```

Build check:

```bash
yarn build:dev
```

Type check:

```bash
yarn tsc --noEmit
```

## Future Enhancements

- [ ] Auto-refresh with configurable interval
- [ ] Historical health data (last 24 hours)
- [ ] Health trends chart
- [ ] Alert notifications for status changes
- [ ] Export health report (CSV/JSON)
- [ ] WebSocket for real-time updates
- [ ] Health score calculation
- [ ] Dependency visualization
