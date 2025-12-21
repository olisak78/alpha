import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';

interface BaseContainerProps {
  children: React.ReactNode;
  className?: string;
}

export const BaseContainer: React.FC<BaseContainerProps> = ({
  children,
  className = '',
}) => {
  const { actualTheme } = useTheme();

  return (
    <div
      className={`
        rounded-lg border
        ${actualTheme === 'dark'
          ? 'bg-gray-800 border-gray-700'
          : 'bg-white border-gray-200'
        }
        shadow-sm
        ${className}
      `}
    >
      {children}
    </div>
  );
};

// Backwards compatibility with earlier naming while aligning to Base* convention
export const PluginContainer = BaseContainer;