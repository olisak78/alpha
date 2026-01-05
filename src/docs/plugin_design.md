# BasePlugin Component for Developer Portal

BLI: [Link to JIRA](https://jira.tools.sap/browse/SAPBTPCFS-28431)

## Overview

The BasePlugin component provides a standardized wrapper for all contributed plugins in the developer portal. It ensures:
* Consistent styling and theming across plugins
* Error and loading state handling
* A unified API client for plugin-specific backend calls
* A safe and predictable environment for rendering dynamically fetched React components
  
This design allows developers to contribute plugins without worrying about portal-level concerns, while ensuring a seamless user experience.


## Architecture
  ### Component Structure

BasePlugin

 ├ PluginContainer (themed wrapper with portal borders/padding)
 
 ├ PluginHeader (title, metadata, actions)
 
 ├ PluginBody (content area with error/loading handling)
 
└ PluginApiClient (helper for /api/plugins/:name/* calls)
 
### Data Flow

1. Plugin metadata is retrieved from DB (via react-query).
2. Plugin React component is fetched from backend API 
3. BasePlugin wraps the fetched component inside PluginBody.
4. Errors (network, runtime) and loading states are handled gracefully.
5. The plugin component can use PluginApiClient for backend communication.


## Technical Details
### BasePlugin Props

* name (string) - Plugin identifier (used for API calls)
* title (string) - Display name for header
* description( string) - Optional plugin description
* component (React.ComponentType) - The fetched plugin component
* theme (Theme from context) - Portal theme object
* initialData (any) - Optional initial data plugin

### Possible implementations
#### Simple implementation - component as a prop

```tsx
function PluginViewer({ selectedPlugin }) {
  return (
    <BasePlugin
      name="team-dashboard"
      title="Team Dashboard"
      description="Visualize team metrics"
      component={selectedPlugin}
    />
  );
}
```

#### Complex implementation - wrapper and child inject
```tsx
export const BasePlugin: React.FC<BasePluginProps> = ({ metadata }) => {

  const RemoteComponent = useRemoteComponent(metadata.componentUrl);

  return (
    <PluginContainer theme={theme}>
      <PluginHeader title={metadata.name} />
      <PluginBody>
        <ErrorBoundary fallback={<PluginCrashScreen />}>
          <Suspense fallback={<PluginSkeleton />}>
            {RemoteComponent && (
              <RemoteComponent />
            )}
          </Suspense>
        </ErrorBoundary>
      </PluginBody>
    </PluginContainer>
  );
};
```


### PluginApiClient

A lightweight wrapper around react-query for plugin-specific endpoints:
```ts
class PluginApiClient {
  constructor(private pluginName: string) {}

  get<T>(path: string) {
    return fetch(`/api/plugins/${this.pluginName}/${path}`).then(
      res => res.json() as T
    );
  }

  post<T>(path: string, body: any) {
    return fetch(`/api/plugins/${this.pluginName}/${path}`, {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' }
    }).then(res => res.json() as T);
  }
}
```


### Decision Record: Functional Components vs. Abstract Classes

- **Hooks support**  
  Our application relies heavily on React Query and the Context API for state management and theming. These libraries are fundamentally designed around Hooks. Since Hooks cannot be used inside class components, a function-based approach is required for full compatibility.

- **Simpler composition**  
  Function components are easier to compose, test, and reuse, aligning with modern React best practices and reducing structural complexity.

- **Performance**  
  Function components with Hooks avoid unnecessary lifecycle boilerplate and benefit from React’s internal performance optimizations.

- **Future-proof architecture**  
  The modern React ecosystem—including React Query, Tailwind, and the Context API—is built around Hooks and function components, ensuring long-term compatibility and sustainability.

- **Developer experience (DX)**  
  Contributors can focus directly on plugin logic and UI without extending abstract classes or managing complex lifecycle methods, significantly lowering the barrier to entry.


## Error & Loading Handling

- **Loading state**  
  Displays a standardized spinner or skeleton UI inside the `PluginBody` while data is being fetched or processed.

- **Error state**  
  Renders a styled, user-friendly error message with an optional retry action to allow recovery without a full page reload.

- **Runtime safety**  
  Wraps the plugin component in an `ErrorBoundary` to prevent individual plugin failures from crashing or destabilizing the entire portal.


## Styling & Theming

* Tailwind classes applied consistently via PluginContainer and PluginHeader.
* Theme context (useTheme()) ensures plugins adapt to portal-wide dark/light modes.

## Risks and Mitigations

- **Security Risks**  
  **Risk:** Plugins may contain malicious code (e.g., accessing sensitive data or making unauthorized API calls).  
  **Mitigation:**
  - Validate plugin sources before allowing them to be stored in the database.
  - Sandbox plugin execution where feasible.
  - Restrict the API client to plugin-specific endpoints only.
  - Apply a strict Content Security Policy (CSP).

- **Performance Risks**  
  **Risk:** Heavy plugins (dashboards, graphs, AI tools) may degrade overall portal performance.  
  **Mitigation:**
  - Lazy-load plugin components.
  - Use React `Suspense` and code-splitting.
  - Monitor plugin render times and enforce performance budgets.

- **Styling Conflicts**  
  **Risk:** Plugin CSS may unintentionally override or break portal styles.  
  **Mitigation:**
  - Enforce Tailwind-scoped utility classes.
  - Wrap plugins in isolated layout containers.
  - Consider CSS-in-JS or Shadow DOM for stricter isolation if required.

- **API Reliability**  
  **Risk:** Plugin-specific backend endpoints may fail, return errors, or respond slowly.  
  **Mitigation:**
  - Use `react-query` caching, retries, and stale data strategies.
  - Provide fallback UI with clear error messaging.
  - Log and monitor failures for observability and alerting.

- **Versioning & Compatibility**  
  **Risk:** Plugins may rely on outdated or incompatible React or library versions.  
  **Mitigation:**
  - Define and enforce a supported plugin API contract.
  - Provide compatibility shims when required.
  - Document mandatory React and TypeScript versions.

- **Maintainability**  
  **Risk:** Contributors may not follow best practices, leading to inconsistent plugin quality and technical debt.  
  **Mitigation:**
  - Provide a formal plugin contribution guide.
  - Enforce linting and strict type-checking rules.
  - Run automated tests on all plugin submissions.
 
- **User Experience Risks**  
  **Risk:** Poorly designed plugins may confuse users or break portal flow.  
  **Mitigation:**
  - Enforce consistent headers and containers via BasePlugin.
  - Provide UX guidelines for contributors.
  - Allow admins to disable/remove problematic plugins.

## Further Questions

- **Plugin Lifecycle**
  - How are plugins approved before being added to the database?
  - Should there be a formal review and approval workflow for new plugins?
  - Who owns the long-term maintenance of contributed plugins?

- **Security & Permissions**
  - Should plugins be sandboxed or restricted in what APIs they can call?
  - Do plugins require role-based access control (e.g., team-only vs. personal-only)?

- **User Experience**
  - Should all plugins follow a consistent header, title, and description pattern, or can contributors fully customize these elements?
  - How should errors be displayed to users—generic platform error messages or plugin-specific ones?
  - Should plugins be allowed to define their own loading states, or always rely on BasePlugin’s built-in loading UI?

- **Performance & Monitoring**
  - Do we need metrics on plugin usage (e.g., load times, render duration, error rates)?
  - Should plugins be automatically disabled if they exceed defined performance thresholds?

- **Versioning & Updates**
  - How should breaking changes in plugin APIs be handled?
  - Should plugins be versioned in the database (e.g., v1, v2)?
  - What happens if a plugin’s source file in GitHub is deleted, moved, or renamed?

- **Extensibility**
  - Should plugins be able to register custom routes, menu items, or global actions in the portal?
  - Do we foresee plugins needing persistent storage beyond API-based access?
