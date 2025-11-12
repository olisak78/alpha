# Authentication Refresh Service

## Overview

The Authentication Refresh Service handles authentication token refresh and error detection for React Query in the Developer Portal. This service ensures that user authentication remains valid when cached data exists and selectively triggers authentication dialogs only for legitimate session expiration scenarios.

## Key Features

- **Throttled Authentication Refresh**: Prevents multiple simultaneous refresh requests
- **Selective Error Handling**: Only triggers auth dialogs for refresh endpoint failures
- **Duplicate Prevention**: Prevents multiple auth error dialogs from appearing
- **React Query Integration**: Designed to work seamlessly with React Query's caching system

## Architecture

### Core Functions

#### `throttledAuthRefresh()`
- **Purpose**: Verifies user authentication is still valid when React Query mounts components with cached data
- **Throttling**: 5-second throttle to prevent excessive requests
- **Endpoint**: `${authBaseURL}/githubtools/refresh?env=development`
- **Triggers Auth Dialog**: Only when this specific endpoint fails (network error or non-200 status)

#### `triggerAuthError(error)` - DISABLED
- **Purpose**: Previously handled general auth errors, now intentionally disabled
- **Current Behavior**: No-op function that prevents other API failures from triggering auth dialogs
- **Rationale**: Ensures only refresh endpoint failures show the authentication dialog

#### `setGlobalAuthErrorTrigger(trigger)`
- **Purpose**: Sets the global auth error trigger from AuthErrorContext
- **Resets**: Auth error flags when context is established

#### `clearGlobalAuthErrorTrigger()`
- **Purpose**: Cleans up auth error trigger and resets flags

## Error Handling Strategy

### What Triggers Authentication Dialog

✅ **ONLY These Scenarios:**
- `/githubtools/refresh` endpoint returns non-200 HTTP status
- `/githubtools/refresh` endpoint throws network/fetch error

### What Does NOT Trigger Authentication Dialog

❌ **These Scenarios Are Ignored:**
- Other API endpoints returning 401/403 errors
- General network failures from non-refresh endpoints
- Message-based error detection (removed for reliability)

## Usage Examples

### Setting Up the Service

```typescript
import { setGlobalAuthErrorTrigger } from '@/lib/authRefreshService';

// In AuthErrorContext
const triggerAuthError = (message: string) => {
  setAuthErrorMessage(message);
  setShowAuthError(true);
};

setGlobalAuthErrorTrigger(triggerAuthError);
```

### Using with React Query

```typescript
import { throttledAuthRefresh } from '@/lib/authRefreshService';

// Call throttledAuthRefresh when components mount with cached data
const MyComponent = () => {
  useEffect(() => {
    // Verify auth is still valid when component mounts with cached data
    throttledAuthRefresh();
  }, []);

  // Your component logic here
};
        // Verify auth is still valid when using cached data
        throttledAuthRefresh();
      }
    }
  }
});
```

## Configuration

### Environment Variables
- `authBaseURL`: Currently set to `'http://localhost:7008/api/auth'`
### Environment Variables
- `authBaseURL`: Currently set to `'http://localhost:7008/api/auth'`

### Timeouts
- **Auth Error Reset**: 10 seconds after triggering to allow new auth errors
- **Refresh Throttle**: 5 seconds between refresh attempts (hardcoded)

### Timeouts
- **Auth Error Reset**: 10 seconds after triggering to allow new auth errors
- **Refresh Throttle**: 5 seconds between refresh attempts

## Integration Points

### Components
- **AuthErrorHandler**: Displays the authentication dialog when triggered
- **AuthErrorContext**: Provides the global trigger function

### Services
- **React Query**: Calls `throttledAuthRefresh()` when using cached data
- **API Clients**: Previously used `triggerAuthError()` (now disabled)

## Best Practices

### Do's ✅
- Use `throttledAuthRefresh()` when React Query mounts with cached data
- Let the service handle its own error detection for refresh failures
- Trust the throttling mechanism to prevent excessive requests

### Don'ts ❌
- Don't call `triggerAuthError()` from other API error handlers (it's disabled)
- Don't modify the throttling or duplicate prevention logic without careful consideration
- Don't rely on error message content for trigger decisions (removed for reliability)

## Troubleshooting

### Auth Dialog Not Appearing
- Verify `setGlobalAuthErrorTrigger()` was called with a valid trigger function
- Check if `authErrorTriggered` flag is stuck (resets after 10 seconds)
- Ensure the refresh endpoint is actually failing and not just returning cached success

### Too Many Auth Dialogs
- Check the 10-second reset timer in `triggerSessionExpiredError()`
- Verify throttling is working correctly in `throttledAuthRefresh()`

### Auth Dialog Appearing for Wrong Errors
- Confirm `triggerAuthError()` is not being called from other error handlers
- Verify only refresh endpoint failures are triggering the dialog

## Migration Notes

### Recent Changes (v2.0)
- **Disabled Message-Based Detection**: `triggerAuthError()` no longer triggers dialogs
- **Isolated Refresh Handling**: Only `/githubtools/refresh` failures show auth dialog
- **Improved Reliability**: No longer dependent on specific error message strings

### Breaking Changes
- `triggerAuthError()` is now a no-op - other error handlers must implement their own UI
- Error message content no longer affects authentication dialog triggering

## Security Considerations

- Service only handles authentication state, not authorization
- Refresh endpoint uses `credentials: 'include'` for cookie-based auth
- 10-second timeout prevents auth dialog spam but allows legitimate retries
- Throttling prevents potential DoS from excessive refresh requests
