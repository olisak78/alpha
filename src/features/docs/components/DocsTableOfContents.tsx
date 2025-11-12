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
  console.log('TOC - Available items:', items.map(item => ({ id: item.id, text: item.text })));

  const handleClick = (id: string) => {
    console.log('TOC Click - Heading ID:', id);

    const element = document.getElementById(id);
    const scrollContainer = document.getElementById('docs-content-scroll-container');

    console.log('TOC Click - Element found:', !!element);
    console.log('TOC Click - Scroll container found:', !!scrollContainer);

    // Debug scroll container properties
    if (scrollContainer) {
      console.log('TOC Click - Scroll container properties:', {
        scrollHeight: scrollContainer.scrollHeight,
        clientHeight: scrollContainer.clientHeight,
        scrollTop: scrollContainer.scrollTop,
        overflowY: window.getComputedStyle(scrollContainer).overflowY,
        isScrollable: scrollContainer.scrollHeight > scrollContainer.clientHeight
      });
    }

    // Debug: List all headings with IDs in the scroll container
    if (!element) {
      const allHeadings = document.querySelectorAll('#docs-content-scroll-container h1[id], #docs-content-scroll-container h2[id], #docs-content-scroll-container h3[id], #docs-content-scroll-container h4[id], #docs-content-scroll-container h5[id], #docs-content-scroll-container h6[id]');
      console.log('TOC Click - All headings in DOM:', Array.from(allHeadings).map((h: Element) => ({
        id: h.id,
        text: h.textContent,
        tagName: h.tagName
      })));
      console.error('TOC Click - Element with ID not found:', id);
      console.log('TOC Click - Trying querySelector with CSS escape...');
      const escapedId = CSS.escape(id);
      const elementByCss = document.querySelector(`#${escapedId}`);
      console.log('TOC Click - Element found by querySelector:', !!elementByCss);
    }

    if (element && scrollContainer) {
      // Get the element's position relative to the scroll container
      const containerRect = scrollContainer.getBoundingClientRect();
      const elementRect = element.getBoundingClientRect();

      console.log('TOC Click - Container rect:', containerRect);
      console.log('TOC Click - Element rect:', elementRect);
      console.log('TOC Click - Current scroll top:', scrollContainer.scrollTop);

      // Calculate the scroll position
      const offset = 80; // Account for any sticky header or padding
      const scrollPosition = scrollContainer.scrollTop + (elementRect.top - containerRect.top) - offset;

      console.log('TOC Click - Calculated scroll position:', scrollPosition);

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
        } else {
          console.log('TOC Click - Scroll complete. Final scrollTop:', scrollContainer.scrollTop);
        }
      };

      requestAnimationFrame(smoothScroll);
      console.log('TOC Click - Smooth scroll animation started');
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
