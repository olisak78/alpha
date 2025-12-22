import React from 'react';

interface OperationConsoleIconProps {
  className?: string;
}

export const OperationConsoleIcon: React.FC<OperationConsoleIconProps> = ({ className = "h-4 w-4" }) => {
  return (
    <svg
      className={className}
      viewBox="0 0 240 240"
      xmlns="http://www.w3.org/2000/svg"
      style={{ minWidth: '2rem', minHeight: '2rem' }}
    >
      <g>
        <rect fill="currentColor" x="59.1" y="53.9" width="153.3" height="2.5"/>
        <circle fill="currentColor" cx="122" cy="161.3" r="3.9"/>
        <path fill="currentColor" d="M35.5,60.3c-2.9,0-5.2-2.3-5.2-5.2s2.3-5.2,5.2-5.2,5.2,2.3,5.2,5.2-2.3,5.2-5.2,5.2ZM35.5,52.5c-1.5,0-2.7,1.2-2.7,2.7s1.2,2.7,2.7,2.7,2.7-1.2,2.7-2.7-1.2-2.7-2.7-2.7Z"/>
        <path fill="currentColor" d="M47.3,60.3c-2.9,0-5.2-2.3-5.2-5.2s2.3-5.2,5.2-5.2,5.2,2.3,5.2,5.2-2.3,5.2-5.2,5.2ZM47.3,52.5c-1.5,0-2.7,1.2-2.7,2.7s1.2,2.7,2.7,2.7,2.7-1.2,2.7-2.7-1.2-2.7-2.7-2.7Z"/>
        <path fill="currentColor" d="M221.5,170.4V42.1H22.5v128.3h81.6l-10.3,17.2h-8.4v10.4h73.2v-10.4h-8.4l-10.3-17.2h81.6ZM219,44.6v107.6H25V44.6h194ZM25,167.9v-13.2h194v13.2H25ZM156.1,190v5.4h-68.2v-5.4h68.2ZM96.7,187.5l5.6-9.3h39.5l5.6,9.3h-50.6Z"/>
        <path fill="currentColor" d="M205.8,99.6h-26.1v-26.1h26.1v26.1ZM182.2,97.1h21.1v-21.1h-21.1v21.1Z"/>
        <g>
          <rect fill="#0070f2" x="180.9" y="110.2" width="23.6" height="23.6"/>
          <path fill="currentColor" d="M205.8,135h-26.1v-26.1h26.1v26.1ZM182.2,132.5h21.1v-21.1h-21.1v21.1Z"/>
        </g>
        <path fill="currentColor" d="M135,135H38.2v-61.5h96.8v61.5ZM40.7,132.5h91.8v-56.5H40.7v56.5Z"/>
        <g>
          <rect fill="#89d1ff" x="145.5" y="74.8" width="23.6" height="23.6"/>
          <path fill="currentColor" d="M170.4,99.6h-26.1v-26.1h26.1v26.1ZM146.8,97.1h21.1v-21.1h-21.1v21.1Z"/>
        </g>
        <path fill="currentColor" d="M170.4,135h-26.1v-26.1h26.1v26.1ZM146.8,132.5h21.1v-21.1h-21.1v21.1Z"/>
      </g>
    </svg>
  );
};
