/**
 * Custom hook for fetching Swagger UI HTML content
 */

import { useQuery } from '@tanstack/react-query';
import { fetchSwaggerHtml } from '@/services/SwaggerApi';

interface UseSwaggerHtmlOptions {
  swaggerUrl?: string | null;
  enabled?: boolean;
}

export function useSwaggerHtml({ swaggerUrl, enabled = true }: UseSwaggerHtmlOptions) {
  return useQuery({
    queryKey: ['swagger-html', swaggerUrl],
    queryFn: async ({ signal }) => {
      if (!swaggerUrl) {
        throw new Error('Swagger URL is required');
      }
      const result = await fetchSwaggerHtml(swaggerUrl, signal);
      if (result.status === 'error') {
        throw new Error(result.error || 'Failed to fetch Swagger HTML');
      }
      return result.html;
    },
    enabled: enabled && !!swaggerUrl,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
  });
}