import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatusDot } from '../../../src/components/ComponentView/StatusDot';
import '@testing-library/jest-dom/vitest';

describe('StatusDot', () => {
  it('should render gray dot for undefined status', () => {
    const { container } = render(<StatusDot status={undefined} />);
    
    const dot = container.querySelector('.bg-gray-400');
    expect(dot).toBeInTheDocument();
    
    // Should not have animation
    const animatedDot = container.querySelector('.animate-ping');
    expect(animatedDot).not.toBeInTheDocument();
  });

  it('should render gray dot for null status', () => {
    const { container } = render(<StatusDot status={null as any} />);
    
    const dot = container.querySelector('.bg-gray-400');
    expect(dot).toBeInTheDocument();
    
    // Should not have animation
    const animatedDot = container.querySelector('.animate-ping');
    expect(animatedDot).not.toBeInTheDocument();
  });

  it('should render green animated dot for boolean true', () => {
    const { container } = render(<StatusDot status={true} />);
    
    const dot = container.querySelector('.bg-green-500');
    expect(dot).toBeInTheDocument();
    
    // Should have animation
    const animatedDot = container.querySelector('.animate-ping');
    expect(animatedDot).toBeInTheDocument();
  });

  it('should render red animated dot for boolean false', () => {
    const { container } = render(<StatusDot status={false} />);
    
    const dot = container.querySelector('.bg-red-500');
    expect(dot).toBeInTheDocument();
    
    // Should have animation
    const animatedDot = container.querySelector('.animate-ping');
    expect(animatedDot).toBeInTheDocument();
  });

  it('should render green animated dot for "UP" status', () => {
    const { container } = render(<StatusDot status="UP" />);
    
    const dot = container.querySelector('.bg-green-500');
    expect(dot).toBeInTheDocument();
    
    // Should have animation
    const animatedDot = container.querySelector('.animate-ping');
    expect(animatedDot).toBeInTheDocument();
  });

  it('should render green animated dot for "up" status (case insensitive)', () => {
    const { container } = render(<StatusDot status="up" />);
    
    const dot = container.querySelector('.bg-green-500');
    expect(dot).toBeInTheDocument();
    
    // Should have animation
    const animatedDot = container.querySelector('.animate-ping');
    expect(animatedDot).toBeInTheDocument();
  });

  it('should render red animated dot for "DOWN" status', () => {
    const { container } = render(<StatusDot status="DOWN" />);
    
    const dot = container.querySelector('.bg-red-500');
    expect(dot).toBeInTheDocument();
    
    // Should have animation
    const animatedDot = container.querySelector('.animate-ping');
    expect(animatedDot).toBeInTheDocument();
  });

  it('should render red animated dot for "down" status (case insensitive)', () => {
    const { container } = render(<StatusDot status="down" />);
    
    const dot = container.querySelector('.bg-red-500');
    expect(dot).toBeInTheDocument();
    
    // Should have animation
    const animatedDot = container.querySelector('.animate-ping');
    expect(animatedDot).toBeInTheDocument();
  });

  it('should render yellow non-animated dot for unknown string status', () => {
    const { container } = render(<StatusDot status="UNKNOWN" />);
    
    const dot = container.querySelector('.bg-yellow-500');
    expect(dot).toBeInTheDocument();
    
    // Should not have animation
    const animatedDot = container.querySelector('.animate-ping');
    expect(animatedDot).not.toBeInTheDocument();
  });

  it('should render yellow non-animated dot for "PENDING" status', () => {
    const { container } = render(<StatusDot status="PENDING" />);
    
    const dot = container.querySelector('.bg-yellow-500');
    expect(dot).toBeInTheDocument();
    
    // Should not have animation
    const animatedDot = container.querySelector('.animate-ping');
    expect(animatedDot).not.toBeInTheDocument();
  });

  it('should have correct structure with relative positioning', () => {
    const { container } = render(<StatusDot status="UP" />);
    
    const outerSpan = container.querySelector('.relative.flex.h-2.w-2');
    expect(outerSpan).toBeInTheDocument();
    
    const innerSpan = container.querySelector('.relative.inline-flex.rounded-full.h-2.w-2');
    expect(innerSpan).toBeInTheDocument();
  });
});
