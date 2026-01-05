import React from 'react';

interface BreadcrumbPageProps {
  children: React.ReactNode;
  className?: string;
}

export const BreadcrumbPage: React.FC<BreadcrumbPageProps> = ({
  children,
  className = ""
}) => {
  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Page content - breadcrumbs are now in the header */}
      <div className={`flex-1 overflow-auto space-y-6 px-4 pt-4 ${className}`.trim()}>
        {children}
      </div>
    </div>
  );
};
