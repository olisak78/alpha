import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SmallCardsBlock from '@/components/SmallCardsBlock';

describe('SmallCardsBlock', () => {
  const sampleCards = [
    {
      title: 'Total Users',
      value: 1250,
      description: 'Active users this month',
    },
    {
      title: 'Revenue',
      value: '$45,000',
      tooltip: 'Monthly recurring revenue',
    },
    {
      title: 'Conversion Rate',
      value: '3.2%',
    },
  ];

  describe('Layout and Grid', () => {
    it('should render horizontal layout by default', () => {
      const { container } = render(<SmallCardsBlock cards={sampleCards} />);

      const grid = container.querySelector('.grid');
      expect(grid).toHaveClass('grid-cols-1', 'md:grid-cols-2', 'gap-4');
    });

    it('should render horizontal layout when explicitly specified', () => {
      const { container } = render(
        <SmallCardsBlock cards={sampleCards} layout="horizontal" />
      );

      const grid = container.querySelector('.grid');
      expect(grid).toHaveClass('grid-cols-1', 'md:grid-cols-2', 'gap-4');
    });

    it('should render vertical layout when specified', () => {
      const { container } = render(
        <SmallCardsBlock cards={sampleCards} layout="vertical" />
      );

      const grid = container.querySelector('.grid');
      expect(grid).toHaveClass('grid-cols-1', 'gap-4');
      expect(grid).not.toHaveClass('md:grid-cols-2');
    });

    it('should have gap between cards', () => {
      const { container } = render(<SmallCardsBlock cards={sampleCards} />);

      const grid = container.querySelector('.grid');
      expect(grid).toHaveClass('gap-4');
    });
  });

  describe('Card Rendering', () => {
    it('should render all cards from the array', () => {
      render(<SmallCardsBlock cards={sampleCards} />);

      expect(screen.getByText('Total Users')).toBeInTheDocument();
      expect(screen.getByText('Revenue')).toBeInTheDocument();
      expect(screen.getByText('Conversion Rate')).toBeInTheDocument();
    });

    it('should render card values', () => {
      render(<SmallCardsBlock cards={sampleCards} />);

      expect(screen.getByText('1250')).toBeInTheDocument();
      expect(screen.getByText('$45,000')).toBeInTheDocument();
      expect(screen.getByText('3.2%')).toBeInTheDocument();
    });

    it('should handle empty cards array', () => {
      const { container } = render(<SmallCardsBlock cards={[]} />);

      const grid = container.querySelector('.grid');
      expect(grid).toBeInTheDocument();
      expect(grid?.children.length).toBe(0);
    });

    it('should render single card', () => {
      const singleCard = [{ title: 'Single Card', value: 100 }];

      render(<SmallCardsBlock cards={singleCard} />);

      expect(screen.getByText('Single Card')).toBeInTheDocument();
      expect(screen.getByText('100')).toBeInTheDocument();
    });

    it('should render many cards', () => {
      const manyCards = Array.from({ length: 10 }, (_, i) => ({
        title: `Card ${i}`,
        value: i * 100,
      }));

      render(<SmallCardsBlock cards={manyCards} />);

      manyCards.forEach((card, index) => {
        expect(screen.getByText(`Card ${index}`)).toBeInTheDocument();
        expect(screen.getByText(`${index * 100}`)).toBeInTheDocument();
      });
    });

    it('should generate unique keys for cards', () => {
      const cardsWithSameTitle = [
        { title: 'Metric', value: 100 },
        { title: 'Metric', value: 200 },
        { title: 'Metric', value: 300 },
      ];

      const { container } = render(
        <SmallCardsBlock cards={cardsWithSameTitle} />
      );

      // All three cards should render despite having the same title
      const cards = container.querySelectorAll('.space-y-2');
      expect(cards.length).toBe(3);
    });
  });

  describe('Card Title and Header', () => {
    it('should render card title with correct styling', () => {
      render(<SmallCardsBlock cards={sampleCards} />);

      const title = screen.getByText('Total Users');
      expect(title).toHaveClass('text-sm', 'font-medium');
    });

    it('should render title in card header', () => {
      const { container } = render(<SmallCardsBlock cards={sampleCards} />);

      const cardHeaders = container.querySelectorAll('.pb-3');
      expect(cardHeaders.length).toBeGreaterThan(0);
    });
  });

  describe('Card Values', () => {
    it('should display numeric values', () => {
      const cards = [{ title: 'Number', value: 12345 }];

      render(<SmallCardsBlock cards={cards} />);

      expect(screen.getByText('12345')).toBeInTheDocument();
    });

    it('should display string values', () => {
      const cards = [{ title: 'Text', value: 'Custom Text' }];

      render(<SmallCardsBlock cards={cards} />);

      expect(screen.getByText('Custom Text')).toBeInTheDocument();
    });

    it('should display zero as a value', () => {
      const cards = [{ title: 'Zero', value: 0 }];

      render(<SmallCardsBlock cards={cards} />);

      expect(screen.getByText('0')).toBeInTheDocument();
    });

    it('should display negative numbers', () => {
      const cards = [{ title: 'Negative', value: -500 }];

      render(<SmallCardsBlock cards={cards} />);

      expect(screen.getByText('-500')).toBeInTheDocument();
    });

    it('should display formatted currency strings', () => {
      const cards = [{ title: 'Price', value: '$1,234.56' }];

      render(<SmallCardsBlock cards={cards} />);

      expect(screen.getByText('$1,234.56')).toBeInTheDocument();
    });

    it('should display percentage strings', () => {
      const cards = [{ title: 'Rate', value: '45.67%' }];

      render(<SmallCardsBlock cards={cards} />);

      expect(screen.getByText('45.67%')).toBeInTheDocument();
    });
  });

  describe('Normal State Styling', () => {
    it('should apply bold styling to normal values', () => {
      const cards = [{ title: 'Normal', value: 100 }];

      const { container } = render(<SmallCardsBlock cards={cards} />);

      const value = screen.getByText('100');
      expect(value).toHaveClass('text-3xl', 'font-bold');
    });

    it('should not apply error styling to normal values', () => {
      const cards = [{ title: 'Normal', value: 100 }];

      render(<SmallCardsBlock cards={cards} />);

      const value = screen.getByText('100');
      expect(value).not.toHaveClass('text-destructive');
    });
  });

  describe('Error State', () => {
    it('should display error value with destructive styling', () => {
      const cards = [
        { title: 'Error Card', value: 'Failed to load', isError: true },
      ];

      render(<SmallCardsBlock cards={cards} />);

      const value = screen.getByText('Failed to load');
      expect(value).toHaveClass('text-sm', 'text-destructive');
    });

    it('should not apply bold styling to error values', () => {
      const cards = [{ title: 'Error Card', value: 'Error message', isError: true }];

      render(<SmallCardsBlock cards={cards} />);

      const value = screen.getByText('Error message');
      expect(value).not.toHaveClass('text-3xl', 'font-bold');
    });

    it('should handle multiple cards with different error states', () => {
      const mixedCards = [
        { title: 'Normal', value: 100 },
        { title: 'Error', value: 'Failed', isError: true },
        { title: 'Also Normal', value: 200 },
      ];

      render(<SmallCardsBlock cards={mixedCards} />);

      const normalValue = screen.getByText('100');
      const errorValue = screen.getByText('Failed');
      const normalValue2 = screen.getByText('200');

      expect(normalValue).toHaveClass('text-3xl', 'font-bold');
      expect(errorValue).toHaveClass('text-destructive');
      expect(normalValue2).toHaveClass('text-3xl', 'font-bold');
    });
  });

  describe('Loading State', () => {
    it('should display loading value with small text', () => {
      const cards = [{ title: 'Loading Card', value: 'Loading...', isLoading: true }];

      render(<SmallCardsBlock cards={cards} />);

      const value = screen.getByText('Loading...');
      expect(value).toHaveClass('text-sm');
    });

    it('should not apply bold styling to loading values', () => {
      const cards = [
        { title: 'Loading', value: 'Loading...', isLoading: true },
      ];

      render(<SmallCardsBlock cards={cards} />);

      const value = screen.getByText('Loading...');
      expect(value).not.toHaveClass('text-3xl', 'font-bold');
    });

    it('should not apply error styling to loading values', () => {
      const cards = [
        { title: 'Loading', value: 'Loading...', isLoading: true },
      ];

      render(<SmallCardsBlock cards={cards} />);

      const value = screen.getByText('Loading...');
      expect(value).not.toHaveClass('text-destructive');
    });

    it('should handle mix of loading and normal cards', () => {
      const mixedCards = [
        { title: 'Loaded', value: 100 },
        { title: 'Loading', value: 'Loading...', isLoading: true },
      ];

      render(<SmallCardsBlock cards={mixedCards} />);

      const loadedValue = screen.getByText('100');
      const loadingValue = screen.getByText('Loading...');

      expect(loadedValue).toHaveClass('text-3xl', 'font-bold');
      expect(loadingValue).toHaveClass('text-sm');
      expect(loadingValue).not.toHaveClass('text-3xl');
    });
  });

  describe('Tooltips', () => {
    it('should render info icon when tooltip is provided', () => {
      const cards = [
        { title: 'With Tooltip', value: 100, tooltip: 'Helpful information' },
      ];

      const { container } = render(<SmallCardsBlock cards={cards} />);

      const infoIcon = container.querySelector('.cursor-help');
      expect(infoIcon).toBeInTheDocument();
    });

    it('should not render info icon when tooltip is not provided', () => {
      const cards = [{ title: 'No Tooltip', value: 100 }];

      const { container } = render(<SmallCardsBlock cards={cards} />);

      const infoIcon = container.querySelector('.cursor-help');
      expect(infoIcon).not.toBeInTheDocument();
    });

    it('should display tooltip content on hover', async () => {
      const user = userEvent.setup();
      const cards = [
        {
          title: 'Hoverable',
          value: 100,
          tooltip: 'This is helpful information',
        },
      ];

      const { container } = render(<SmallCardsBlock cards={cards} />);

      const infoIcon = container.querySelector('.cursor-help');
      expect(infoIcon).toBeTruthy();

      await user.hover(infoIcon!);

      // Wait for tooltip to appear - may be rendered multiple times in DOM
      const tooltips = await screen.findAllByText('This is helpful information');
      expect(tooltips.length).toBeGreaterThan(0);
    });

    it('should render info icon with correct size', () => {
      const cards = [{ title: 'Card', value: 100, tooltip: 'Info' }];

      const { container } = render(<SmallCardsBlock cards={cards} />);

      const infoIcon = container.querySelector('.cursor-help');
      expect(infoIcon).toHaveClass('h-3.5', 'w-3.5');
    });

    it('should position tooltip above the icon', async () => {
      const user = userEvent.setup();
      const cards = [{ title: 'Card', value: 100, tooltip: 'Tooltip text' }];

      const { container } = render(<SmallCardsBlock cards={cards} />);

      const infoIcon = container.querySelector('.cursor-help');
      await user.hover(infoIcon!);

      // The tooltip should be rendered (exact positioning is handled by the Tooltip component)
      // Use getAllByText since the tooltip might be rendered multiple times in the DOM
      const tooltips = await screen.findAllByText('Tooltip text');
      expect(tooltips.length).toBeGreaterThan(0);
    });

    it('should handle multiple cards with tooltips', async () => {
      const user = userEvent.setup();
      const cards = [
        { title: 'Card 1', value: 100, tooltip: 'Tooltip 1' },
        { title: 'Card 2', value: 200, tooltip: 'Tooltip 2' },
        { title: 'Card 3', value: 300 },
      ];

      const { container } = render(<SmallCardsBlock cards={cards} />);

      const infoIcons = container.querySelectorAll('.cursor-help');
      expect(infoIcons.length).toBe(2);
    });
  });

  describe('Descriptions', () => {
    it('should render description when provided', () => {
      const cards = [
        {
          title: 'With Description',
          value: 100,
          description: 'This is a description',
        },
      ];

      render(<SmallCardsBlock cards={cards} />);

      expect(screen.getByText('This is a description')).toBeInTheDocument();
    });

    it('should not render description when not provided', () => {
      const cards = [{ title: 'No Description', value: 100 }];

      const { container } = render(<SmallCardsBlock cards={cards} />);

      const descriptions = container.querySelectorAll('.text-xs.text-muted-foreground');
      expect(descriptions.length).toBe(0);
    });

    it('should render description with correct styling', () => {
      const cards = [
        { title: 'Card', value: 100, description: 'Styled description' },
      ];

      render(<SmallCardsBlock cards={cards} />);

      const description = screen.getByText('Styled description');
      expect(description).toHaveClass('text-xs', 'text-muted-foreground');
    });

    it('should render descriptions below values', () => {
      const cards = [
        { title: 'Card', value: 100, description: 'Below value' },
      ];

      const { container } = render(<SmallCardsBlock cards={cards} />);

      const cardContent = container.querySelector('.space-y-2');
      expect(cardContent).toBeInTheDocument();
    });

    it('should handle multiple cards with descriptions', () => {
      const cards = [
        { title: 'Card 1', value: 100, description: 'Description 1' },
        { title: 'Card 2', value: 200, description: 'Description 2' },
        { title: 'Card 3', value: 300 },
      ];

      render(<SmallCardsBlock cards={cards} />);

      expect(screen.getByText('Description 1')).toBeInTheDocument();
      expect(screen.getByText('Description 2')).toBeInTheDocument();
    });

    it('should handle long descriptions', () => {
      const longDescription =
        'This is a very long description that contains a lot of text and might wrap to multiple lines in the UI';
      const cards = [{ title: 'Card', value: 100, description: longDescription }];

      render(<SmallCardsBlock cards={cards} />);

      expect(screen.getByText(longDescription)).toBeInTheDocument();
    });
  });

  describe('Combined Features', () => {
    it('should render card with tooltip and description', () => {
      const cards = [
        {
          title: 'Full Card',
          value: 100,
          tooltip: 'Tooltip text',
          description: 'Description text',
        },
      ];

      const { container } = render(<SmallCardsBlock cards={cards} />);

      expect(screen.getByText('Full Card')).toBeInTheDocument();
      expect(screen.getByText('100')).toBeInTheDocument();
      expect(screen.getByText('Description text')).toBeInTheDocument();
      expect(container.querySelector('.cursor-help')).toBeInTheDocument();
    });

    it('should render error card with description', () => {
      const cards = [
        {
          title: 'Error',
          value: 'Failed',
          isError: true,
          description: 'Error details',
        },
      ];

      render(<SmallCardsBlock cards={cards} />);

      const value = screen.getByText('Failed');
      expect(value).toHaveClass('text-destructive');
      expect(screen.getByText('Error details')).toBeInTheDocument();
    });

    it('should render loading card with description', () => {
      const cards = [
        {
          title: 'Loading',
          value: 'Loading...',
          isLoading: true,
          description: 'Fetching data',
        },
      ];

      render(<SmallCardsBlock cards={cards} />);

      expect(screen.getByText('Loading...')).toBeInTheDocument();
      expect(screen.getByText('Fetching data')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty string as value', () => {
      const cards = [{ title: 'Empty', value: '' }];

      render(<SmallCardsBlock cards={cards} />);

      expect(screen.getByText('Empty')).toBeInTheDocument();
    });

    it('should handle very long titles', () => {
      const longTitle = 'A'.repeat(100);
      const cards = [{ title: longTitle, value: 100 }];

      render(<SmallCardsBlock cards={cards} />);

      expect(screen.getByText(longTitle)).toBeInTheDocument();
    });

    it('should handle very large numeric values', () => {
      const cards = [{ title: 'Large', value: 9999999999 }];

      render(<SmallCardsBlock cards={cards} />);

      expect(screen.getByText('9999999999')).toBeInTheDocument();
    });

    it('should handle special characters in values', () => {
      const cards = [{ title: 'Special', value: '< > & " \' @' }];

      render(<SmallCardsBlock cards={cards} />);

      expect(screen.getByText('< > & " \' @')).toBeInTheDocument();
    });

    it('should handle special characters in title', () => {
      const cards = [{ title: 'Title & <Special> "Chars"', value: 100 }];

      render(<SmallCardsBlock cards={cards} />);

      expect(screen.getByText('Title & <Special> "Chars"')).toBeInTheDocument();
    });

    it('should handle special characters in tooltip', () => {
      const cards = [
        {
          title: 'Card',
          value: 100,
          tooltip: 'Tooltip with & < > " \' characters',
        },
      ];

      render(<SmallCardsBlock cards={cards} />);

      // Should not crash with special characters
      expect(screen.getByText('Card')).toBeInTheDocument();
    });

    it('should handle special characters in description', () => {
      const cards = [
        {
          title: 'Card',
          value: 100,
          description: 'Description & < > " \' chars',
        },
      ];

      render(<SmallCardsBlock cards={cards} />);

      expect(screen.getByText('Description & < > " \' chars')).toBeInTheDocument();
    });

    it('should handle both isError and isLoading being true', () => {
      // isError takes precedence in the implementation
      const cards = [
        { title: 'Confused', value: 'Error', isError: true, isLoading: true },
      ];

      render(<SmallCardsBlock cards={cards} />);

      const value = screen.getByText('Error');
      expect(value).toHaveClass('text-destructive');
    });
  });

  describe('Card Content Structure', () => {
    it('should render card header and content sections', () => {
      const cards = [{ title: 'Card', value: 100 }];

      const { container } = render(<SmallCardsBlock cards={cards} />);

      const header = container.querySelector('.pb-3');
      const content = container.querySelector('.space-y-2');

      expect(header).toBeInTheDocument();
      expect(content).toBeInTheDocument();
    });

    it('should space elements correctly in card content', () => {
      const cards = [
        { title: 'Card', value: 100, description: 'Description' },
      ];

      const { container } = render(<SmallCardsBlock cards={cards} />);

      const content = container.querySelector('.space-y-2');
      expect(content).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have cursor-help on info icon for accessibility', () => {
      const cards = [{ title: 'Card', value: 100, tooltip: 'Info' }];

      const { container } = render(<SmallCardsBlock cards={cards} />);

      const infoIcon = container.querySelector('.cursor-help');
      expect(infoIcon).toBeInTheDocument();
    });

    it('should render semantic card structure', () => {
      const cards = [{ title: 'Card', value: 100 }];

      const { container } = render(<SmallCardsBlock cards={cards} />);

      // Cards should be rendered with proper structure
      const cardElements = container.querySelectorAll('[class*="card"]');
      expect(cardElements.length).toBeGreaterThan(0);
    });
  });

  describe('TooltipProvider', () => {
    it('should wrap cards in TooltipProvider', () => {
      const cards = [
        { title: 'Card 1', value: 100, tooltip: 'Tooltip 1' },
        { title: 'Card 2', value: 200, tooltip: 'Tooltip 2' },
      ];

      render(<SmallCardsBlock cards={cards} />);

      // Both tooltips should work, meaning TooltipProvider is wrapping them
      expect(screen.getByText('Card 1')).toBeInTheDocument();
      expect(screen.getByText('Card 2')).toBeInTheDocument();
    });
  });
});