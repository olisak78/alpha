import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import * as LucideIcons from 'lucide-react';

interface BaseHeaderProps {
  title: string;
  description?: string;
  icon?: string;
  actions?: React.ReactNode;
}

export const BaseHeader: React.FC<BaseHeaderProps> = ({
  title,
  description,
  icon,
  actions,
}) => {
  const { actualTheme } = useTheme();

  // Dynamically get icon component from Lucide
  const IconComponent = icon
    ? (LucideIcons as any)[icon] as React.ComponentType<{ className?: string }>
    : null;

  return (
    <div
      className={`
        px-6 py-4 border-b
        ${actualTheme === 'dark'
          ? 'border-gray-700'
          : 'border-gray-200'
        }
      `}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          {IconComponent && (
            <div
              className={`
                mt-1
                ${actualTheme === 'dark'
                  ? 'text-gray-400'
                  : 'text-gray-600'
                }
              `}
            >
              <IconComponent className="w-5 h-5" />
            </div>
          )}

          <div>
            <h2
              className={`
                text-lg font-semibold
                ${actualTheme === 'dark'
                  ? 'text-gray-100'
                  : 'text-gray-900'
                }
              `}
            >
              {title}
            </h2>

            {description && (
              <p
                className={`
                  mt-1 text-sm
                  ${actualTheme === 'dark'
                    ? 'text-gray-400'
                    : 'text-gray-600'
                  }
                `}
              >
                {description}
              </p>
            )}
          </div>
        </div>

        {actions && (
          <div className="flex items-center space-x-2">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};

export const PluginHeader = BaseHeader;