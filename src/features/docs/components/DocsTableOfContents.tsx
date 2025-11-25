/**
 * Docs Table of Contents Component
 * Displays headings extracted from markdown with active state tracking
 */

import React from 'react';
import { TableOfContentsItem } from '../DocsPage';

interface DocsTableOfContentsProps {
  items: TableOfContentsItem[];
  activeId: string;
}

export const DocsTableOfContents: React.FC<DocsTableOfContentsProps> = ({ items, activeId }) => {

  const handleClick = (id: string) => {
    const element = document.getElementById(id);
    const scrollContainer = document.getElementById('docs-content-scroll-container');

    // Debug: List all headings with IDs in the scroll container
    if (!element) {
      console.error('TOC Click - Element with ID not found:', id);
    }

    if (element && scrollContainer) {
      // Get the element's position relative to the scroll container
      const containerRect = scrollContainer.getBoundingClientRect();
      const elementRect = element.getBoundingClientRect();

      // Calculate the scroll position
      const offset = 80; // Account for any sticky header or padding
      const scrollPosition = scrollContainer.scrollTop + (elementRect.top - containerRect.top) - offset;

      // Use direct scrollTop assignment with smooth scrolling
      const startPosition = scrollContainer.scrollTop;
      const distance = scrollPosition - startPosition;
      const duration = 500; // milliseconds
      let startTime: number | null = null;

      const smoothScroll = (currentTime: number) => {
        if (startTime === null) startTime = currentTime;
        const timeElapsed = currentTime - startTime;
        const progress = Math.min(timeElapsed / duration, 1);

        // Easing function (ease-in-out)
        const ease = progress < 0.5
          ? 2 * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 2) / 2;

        scrollContainer.scrollTop = startPosition + (distance * ease);

        if (timeElapsed < duration) {
          requestAnimationFrame(smoothScroll);
        } 
      };

      requestAnimationFrame(smoothScroll);
    } else {
      if (!scrollContainer) console.error('TOC Click - Scroll container not found');
    }
  };

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="sticky top-0 h-screen overflow-y-auto py-8 px-4">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 uppercase tracking-wide">
        On This Page
      </h3>
      <nav>
        <ul className="space-y-2">
          {items.map(item => {
            const isActive = activeId === item.id;
            const paddingLeft = `${(item.level - 1) * 12}px`;

            return (
              <li key={item.id} style={{ paddingLeft }}>
                <button
                  onClick={() => handleClick(item.id)}
                  className={`w-full text-left text-sm transition-colors hover:text-blue-600 dark:hover:text-blue-400 ${
                    isActive
                      ? 'text-blue-600 dark:text-blue-400 font-medium'
                      : 'text-gray-600 dark:text-gray-400'
                  }`}
                >
                  {item.text}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
};
