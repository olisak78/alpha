import { Pin, PinOff } from 'lucide-react';
import { usePinComponent } from '@/hooks/usePinComponent';
import type { Component } from '@/types/api';

interface PinButtonProps {
  component: Component;
  className?: string;
  size?: number;
  showOnHover?: boolean;
}

export function PinButton({ 
  component, 
  className = "", 
  size = 16, 
  showOnHover = false 
}: PinButtonProps) {
  const { togglePin } = usePinComponent();

  const handlePinClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    togglePin(component);
  };

  if (component.isPinned) {
    return (
      <Pin 
        size={size} 
        className={`text-blue-500 fill-current cursor-pointer hover:text-blue-600 ${className}`}
        onClick={handlePinClick}
      />
    );
  }

  return (
    <PinOff 
      size={size} 
      className={`text-gray-400 cursor-pointer hover:text-blue-500 ${
        showOnHover ? 'opacity-0 group-hover:opacity-100 transition-opacity duration-200' : ''
      } ${className}`}
      onClick={handlePinClick}
    />
  );
}
