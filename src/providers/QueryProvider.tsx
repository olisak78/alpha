import { ReactNode } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { queryClient } from '@/lib/queryClient';

/**
 * Query Provider Component
 * 
 * Wraps your application with React Query's QueryClientProvider
 * and optionally includes the DevTools for debugging.
 * 
 * This should wrap your entire app (or at least the part that uses queries).
 * 
 * Features:
 * - Provides QueryClient to all child components
 * - Includes DevTools in development mode
 * - Handles query client configuration
 * 
 * @example
 * // In your App.tsx or main.tsx:
 * import { QueryProvider } from './providers/QueryProvider';
 * 
 * function App() {
 *   return (
 *     <QueryProvider>
 *       <YourApp />
 *     </QueryProvider>
 *   );
 * }
 * 
 * @example
 * // With other providers:
 * function App() {
 *   return (
 *     <QueryProvider>
 *       <AuthProvider>
 *         <ThemeProvider>
 *           <YourApp />
 *         </ThemeProvider>
 *       </AuthProvider>
 *     </QueryProvider>
 *   );
 * }
 */

interface QueryProviderProps {
  children: ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      
      {/* React Query DevTools - only in development */}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools 
          initialIsOpen={false} 
          buttonPosition="bottom-right"  // Changed from 'position' to 'buttonPosition'
        />
      )}
    </QueryClientProvider>
  );
}