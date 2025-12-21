import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';

interface BaseBodyProps {
  children: React.ReactNode;
  isLoading?: boolean;
  error?: Error | string | null;
  loadingMessage?: string;
  onRetry?: () => void;
  minHeight?: string;
}

export const BaseBody: React.FC<BaseBodyProps> = ({
  children,
  isLoading = false,
  error = null,
  loadingMessage = 'Loading plugin...',
  onRetry,
  minHeight = '400px',
}) => {
  const { actualTheme } = useTheme();

  // Render loading state
  if (isLoading) {
    return (
      <div
        className="flex flex-col items-center justify-center p-12"
        style={{ minHeight }}
      >
        <Loader2
          className={`
            w-8 h-8 animate-spin
            ${actualTheme === 'dark'
              ? 'text-gray-400'
              : 'text-gray-600'
            }
          `}
        />
        <p
          className={`
            mt-4 text-sm
            ${actualTheme === 'dark'
              ? 'text-gray-400'
              : 'text-gray-600'
            }
          `}
        >
          {loadingMessage}
        </p>
      </div>
    );
  }

  // Render error state
  if (error) {
    const errorMessage = error instanceof Error ? error.message : error;

    return (
      <div
        className="flex flex-col items-center justify-center p-12"
        style={{ minHeight }}
      >
        <div
          className={`
            rounded-full p-3 mb-4
            ${actualTheme === 'dark'
              ? 'bg-red-900/20'
              : 'bg-red-50'
            }
          `}
        >
          <AlertCircle
            className={`
              w-8 h-8
              ${actualTheme === 'dark'
                ? 'text-red-400'
                : 'text-red-600'
              }
            `}
          />
        </div>

        <h3
          className={`
            text-lg font-semibold mb-2
            ${actualTheme === 'dark'
              ? 'text-gray-100'
              : 'text-gray-900'
            }
          `}
        >
          Plugin Error
        </h3>

        <p
          className={`
            text-sm text-center max-w-md mb-4
            ${actualTheme === 'dark'
              ? 'text-gray-400'
              : 'text-gray-600'
            }
          `}
        >
          {errorMessage}
        </p>

        {onRetry && (
          <button
            onClick={onRetry}
            className={`
              flex items-center space-x-2 px-4 py-2 rounded-md
              text-sm font-medium transition-colors
              ${actualTheme === 'dark'
                ? 'bg-gray-700 hover:bg-gray-600 text-gray-200'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
              }
            `}
          >
            <RefreshCw className="w-4 h-4" />
            <span>Retry</span>
          </button>
        )}
      </div>
    );
  }

  // Render content
  return (
    <div className="p-6" style={{ minHeight }}>
      {children}
    </div>
  );
};

export const PluginBody = BaseBody;