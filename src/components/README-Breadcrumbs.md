# Breadcrumb System Documentation

## Overview

The breadcrumb system has been redesigned to be dynamic, scalable, and maintainable. Instead of hardcoded route mappings, it now automatically generates breadcrumbs based on URL segments and a simple route configuration.

## Key Improvements

### 1. **Dynamic Generation**
- Breadcrumbs are automatically generated from URL segments
- No need to manually add breadcrumb mappings for every new route
- Supports nested routes and dynamic parameters

### 2. **Scalable Configuration**
- Simple `routeConfigs` array that's easy to maintain
- Adding new routes requires only one line of configuration
- Automatic handling of dynamic route parameters (like `/cis/:entityName`)

### 3. **Smart Entity Name Formatting**
- Automatically formats entity names from URL segments
- Converts kebab-case to Title Case (e.g., `user-service` → `User Service`)

### 4. **Accessibility First**
- Full ARIA support with `aria-label="breadcrumb"` on navigation
- `aria-current="page"` for active breadcrumb items
- Descriptive `aria-label` attributes for screen readers
- Semantic HTML structure with `<nav>`, `<ol>`, and `<li>` elements
- Icons marked with `aria-hidden="true"` to avoid screen reader clutter

## How It Works

### Route Configuration
```typescript
const routeConfigs: RouteConfig[] = [
  { label: 'Home', path: '/' },
  { label: 'Me', path: '/me', parent: '/' },
  { label: 'CIS@2.0', path: '/cis', parent: '/' },
  // Add new routes here...
];
```

### Breadcrumb Generation Process
1. **Parse URL**: Split pathname into segments
2. **Build Path**: Incrementally build paths for each segment
3. **Check Configuration**: Look up configured routes first
4. **Handle Dynamic Routes**: Format entity names for unknown segments
5. **Generate Breadcrumbs**: Create breadcrumb items with proper labels and paths

## Adding New Routes

### Static Routes
To add a new static route, simply add it to the `routeConfigs` array:

```typescript
{ label: 'New Feature', path: '/new-feature', parent: '/' }
```

### Dynamic Routes
Dynamic routes (with parameters) are handled automatically. For example:
- Route: `/cis/:entityName`
- URL: `/cis/user-service`
- Generated: Home → CIS@2.0 → User Service

No additional configuration needed!

## Examples

### Current Route Handling

| URL | Generated Breadcrumbs |
|-----|----------------------|
| `/` | Home |
| `/me` | Home → Me |
| `/cis` | Home → CIS@2.0 |
| `/cis/user-service` | Home → CIS@2.0 → User Service |
| `/unified-services/billing-service` | Home → Unified Services → Billing Service |
| `/cloud-automation/payment-gateway` | Home → Cloud Automation → Payment Gateway |

### Benefits Over Previous System

**Before (Hardcoded):**
```typescript
const routeToBreadcrumbMap: Record<string, BreadcrumbItem[]> = {
  '/': [{ label: 'Home', path: '/', isActive: true }],
  '/me': [
    { label: 'Home', path: '/' },
    { label: 'Me', path: '/me', isActive: true }
  ],
  '/cis/user-service': [
    { label: 'Home', path: '/' },
    { label: 'CIS@2.0', path: '/cis' },
    { label: 'User Service', path: '/cis/user-service', isActive: true }
  ],
  // ... hundreds of hardcoded entries
};
```

**After (Dynamic):**
```typescript
const routeConfigs: RouteConfig[] = [
  { label: 'Home', path: '/' },
  { label: 'Me', path: '/me', parent: '/' },
  { label: 'CIS@2.0', path: '/cis', parent: '/' },
  // Only base routes need configuration
];
```

## Maintenance

### Adding a New Section
1. Add the base route to `routeConfigs`
2. Add the route to your router configuration
3. Dynamic sub-routes work automatically

### Customizing Entity Names
If you need custom formatting for specific entities, you can extend the `formatEntityName` function or add special cases to the route configuration.

### Future Enhancements
- **Route Metadata**: Could be extended to include icons, descriptions, etc.
- **Permissions**: Could integrate with user permissions to show/hide certain breadcrumbs
- **Internationalization**: Labels could be moved to translation files

## Usage

The breadcrumb component is automatically included in the `DeveloperPortalHeader` and works with any route structure. No changes needed in individual pages.

```tsx
import { BreadcrumbPage } from "@/components/BreadcrumbPage";

export default function MyPage() {
  return (
    <BreadcrumbPage>
      <main className="space-y-6 p-6">
        {/* Your page content */}
      </main>
    </BreadcrumbPage>
  );
}
```

The breadcrumbs will automatically appear in the header based on the current route.
