import React from 'react';

interface OperationConsoleIconProps {
  className?: string;
}

export const OperationConsoleIcon: React.FC<OperationConsoleIconProps> = ({ className = "h-4 w-4" }) => {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ minWidth: '1.5rem', minHeight: '1.5rem' }}
    >
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <line x1="8" y1="21" x2="16" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  );
};
