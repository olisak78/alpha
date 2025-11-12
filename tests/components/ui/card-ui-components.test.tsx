import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { ReactNode } from 'react';

/**
 * UI Components Test Suite - Part 2
 * 
 * Tests for: card, checkbox, collapsible, command, context-menu, dialog
 */

// ============================================================================
// 8. CARD COMPONENT TESTS
// ============================================================================

describe('Card Components', () => {
  let Card: any, CardHeader: any, CardTitle: any, CardDescription: any, CardContent: any, CardFooter: any;

  beforeEach(async () => {
    const module = await import('../../../src/components/ui/card');
    Card = module.Card;
    CardHeader = module.CardHeader;
    CardTitle = module.CardTitle;
    CardDescription = module.CardDescription;
    CardContent = module.CardContent;
    CardFooter = module.CardFooter;
  });

  it('should render card with all parts', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Card Title</CardTitle>
          <CardDescription>Card Description</CardDescription>
        </CardHeader>
        <CardContent>Card Content</CardContent>
        <CardFooter>Card Footer</CardFooter>
      </Card>
    );

    expect(screen.getByText('Card Title')).toBeInTheDocument();
    expect(screen.getByText('Card Description')).toBeInTheDocument();
    expect(screen.getByText('Card Content')).toBeInTheDocument();
    expect(screen.getByText('Card Footer')).toBeInTheDocument();
  });

  it('should render card with only content', () => {
    render(
      <Card>
        <CardContent>Simple card content</CardContent>
      </Card>
    );

    expect(screen.getByText('Simple card content')).toBeInTheDocument();
  });

  it('should apply custom className to Card', () => {
    const { container } = render(<Card className="custom-card">Content</Card>);
    expect(container.firstChild).toHaveClass('custom-card');
  });

  it('should apply custom className to CardHeader', () => {
    const { container } = render(
      <Card>
        <CardHeader className="custom-header">
          <CardTitle>Title</CardTitle>
        </CardHeader>
      </Card>
    );

    const header = container.querySelector('.custom-header');
    expect(header).toBeInTheDocument();
  });

  it('should apply custom className to CardContent', () => {
    const { container } = render(
      <Card>
        <CardContent className="custom-content">Content</CardContent>
      </Card>
    );

    const content = container.querySelector('.custom-content');
    expect(content).toBeInTheDocument();
  });

  it('should apply custom className to CardFooter', () => {
    const { container } = render(
      <Card>
        <CardFooter className="custom-footer">Footer</CardFooter>
      </Card>
    );

    const footer = container.querySelector('.custom-footer');
    expect(footer).toBeInTheDocument();
  });

  it('should render nested elements in card content', () => {
    render(
      <Card>
        <CardContent>
          <p>Paragraph 1</p>
          <p>Paragraph 2</p>
        </CardContent>
      </Card>
    );

    expect(screen.getByText('Paragraph 1')).toBeInTheDocument();
    expect(screen.getByText('Paragraph 2')).toBeInTheDocument();
  });

  it('should render card without header', () => {
    render(
      <Card>
        <CardContent>Content without header</CardContent>
        <CardFooter>Footer</CardFooter>
      </Card>
    );

    expect(screen.getByText('Content without header')).toBeInTheDocument();
    expect(screen.getByText('Footer')).toBeInTheDocument();
  });

  it('should render card without footer', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Title</CardTitle>
        </CardHeader>
        <CardContent>Content without footer</CardContent>
      </Card>
    );

    expect(screen.getByText('Title')).toBeInTheDocument();
    expect(screen.getByText('Content without footer')).toBeInTheDocument();
  });
});

// ============================================================================
// 9. CHECKBOX COMPONENT TESTS
// ============================================================================

describe('Checkbox Component', () => {
  let Checkbox: any;

  beforeEach(async () => {
    const module = await import('../../../src/components/ui/checkbox');
    Checkbox = module.Checkbox;
  });

  it('should render checkbox', () => {
    const { container } = render(<Checkbox />);
    const checkbox = container.querySelector('button[role="checkbox"]');
    expect(checkbox).toBeInTheDocument();
  });

  it('should handle checked state', () => {
    const { container } = render(<Checkbox checked={true} />);
    const checkbox = container.querySelector('button[role="checkbox"]');
    expect(checkbox).toHaveAttribute('data-state', 'checked');
  });

  it('should handle unchecked state', () => {
    const { container } = render(<Checkbox checked={false} />);
    const checkbox = container.querySelector('button[role="checkbox"]');
    expect(checkbox).toHaveAttribute('data-state', 'unchecked');
  });

  it('should call onCheckedChange when clicked', () => {
    const handleChange = vi.fn();
    const { container } = render(<Checkbox onCheckedChange={handleChange} />);
    
    const checkbox = container.querySelector('button[role="checkbox"]');
    fireEvent.click(checkbox!);
    
    expect(handleChange).toHaveBeenCalled();
  });

  it('should be disabled when disabled prop is true', () => {
    const { container } = render(<Checkbox disabled />);
    const checkbox = container.querySelector('button[role="checkbox"]');
    expect(checkbox).toBeDisabled();
  });

  it('should not call onCheckedChange when disabled', () => {
    const handleChange = vi.fn();
    const { container } = render(<Checkbox disabled onCheckedChange={handleChange} />);
    
    const checkbox = container.querySelector('button[role="checkbox"]');
    fireEvent.click(checkbox!);
    
    expect(handleChange).not.toHaveBeenCalled();
  });

  it('should apply custom className', () => {
    const { container } = render(<Checkbox className="custom-checkbox" />);
    const checkbox = container.querySelector('button[role="checkbox"]');
    expect(checkbox).toHaveClass('custom-checkbox');
  });

  it('should support indeterminate state', () => {
    const { container } = render(<Checkbox checked="indeterminate" />);
    const checkbox = container.querySelector('button[role="checkbox"]');
    expect(checkbox).toHaveAttribute('data-state', 'indeterminate');
  });

  it('should render with label', () => {
    render(
      <div>
        <Checkbox id="terms" />
        <label htmlFor="terms">Accept terms</label>
      </div>
    );

    expect(screen.getByText('Accept terms')).toBeInTheDocument();
  });
});

// ============================================================================
// 10. COLLAPSIBLE COMPONENT TESTS
// ============================================================================

describe('Collapsible Component', () => {
  let Collapsible: any, CollapsibleTrigger: any, CollapsibleContent: any;

  beforeEach(async () => {
    const module = await import('../../../src/components/ui/collapsible');
    Collapsible = module.Collapsible;
    CollapsibleTrigger = module.CollapsibleTrigger;
    CollapsibleContent = module.CollapsibleContent;
  });

  it('should render collapsible with trigger and content', () => {
    render(
      <Collapsible>
        <CollapsibleTrigger>Toggle</CollapsibleTrigger>
        <CollapsibleContent>Hidden content</CollapsibleContent>
      </Collapsible>
    );

    expect(screen.getByText('Toggle')).toBeInTheDocument();
  });

  it('should expand content when trigger is clicked', async () => {
    render(
      <Collapsible>
        <CollapsibleTrigger>Show More</CollapsibleTrigger>
        <CollapsibleContent>Collapsible content here</CollapsibleContent>
      </Collapsible>
    );

    const trigger = screen.getByText('Show More');
    fireEvent.click(trigger);

    await waitFor(() => {
      expect(screen.getByText('Collapsible content here')).toBeInTheDocument();
    });
  });

  it('should be open by default when defaultOpen is true', () => {
    render(
      <Collapsible defaultOpen>
        <CollapsibleTrigger>Toggle</CollapsibleTrigger>
        <CollapsibleContent>Visible content</CollapsibleContent>
      </Collapsible>
    );

    expect(screen.getByText('Visible content')).toBeInTheDocument();
  });

  it('should call onOpenChange when toggled', () => {
    const handleOpenChange = vi.fn();
    render(
      <Collapsible onOpenChange={handleOpenChange}>
        <CollapsibleTrigger>Toggle</CollapsibleTrigger>
        <CollapsibleContent>Content</CollapsibleContent>
      </Collapsible>
    );

    const trigger = screen.getByText('Toggle');
    fireEvent.click(trigger);

    expect(handleOpenChange).toHaveBeenCalledWith(true);
  });

  it('should apply custom className', () => {
    const { container } = render(
      <Collapsible className="custom-collapsible">
        <CollapsibleTrigger>Toggle</CollapsibleTrigger>
        <CollapsibleContent>Content</CollapsibleContent>
      </Collapsible>
    );

    expect(container.firstChild).toHaveClass('custom-collapsible');
  });
});

// ============================================================================
// 11. COMMAND COMPONENT TESTS
// ============================================================================

describe('Command Component', () => {
  let Command: any;
  let CommandInput: any;
  let CommandList: any;
  let CommandEmpty: any;
  let CommandGroup: any;
  let CommandItem: any;
  let CommandSeparator: any;

  beforeEach(async () => {
    const module = await import('../../../src/components/ui/command');
    Command = module.Command;
    CommandInput = module.CommandInput;
    CommandList = module.CommandList;
    CommandEmpty = module.CommandEmpty;
    CommandGroup = module.CommandGroup;
    CommandItem = module.CommandItem;
    CommandSeparator = module.CommandSeparator;
  });

  it('should render command with input', () => {
    render(
      <Command>
        <CommandInput placeholder="Search..." />
      </Command>
    );

    expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    const { container } = render(
      <Command className="custom-command">
        <CommandInput />
      </Command>
    );

    expect(container.firstChild).toHaveClass('custom-command');
  });
});

// ============================================================================
// 12. CONTEXT MENU COMPONENT TESTS
// ============================================================================

describe('ContextMenu Component', () => {
  let ContextMenu: any;
  let ContextMenuTrigger: any;
  let ContextMenuContent: any;
  let ContextMenuItem: any;
  let ContextMenuSeparator: any;
  let ContextMenuLabel: any;

  beforeEach(async () => {
    const module = await import('../../../src/components/ui/context-menu');
    ContextMenu = module.ContextMenu;
    ContextMenuTrigger = module.ContextMenuTrigger;
    ContextMenuContent = module.ContextMenuContent;
    ContextMenuItem = module.ContextMenuItem;
    ContextMenuSeparator = module.ContextMenuSeparator;
    ContextMenuLabel = module.ContextMenuLabel;
  });

  it('should render context menu trigger', () => {
    render(
      <ContextMenu>
        <ContextMenuTrigger>Right click me</ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem>Item 1</ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    );

    expect(screen.getByText('Right click me')).toBeInTheDocument();
  });

  it('should show menu on right click', async () => {
    render(
      <ContextMenu>
        <ContextMenuTrigger>Right click me</ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem>Menu Item</ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    );

    const trigger = screen.getByText('Right click me');
    fireEvent.contextMenu(trigger);

    await waitFor(() => {
      expect(screen.getByText('Menu Item')).toBeInTheDocument();
    });
  });

  it('should render multiple menu items', async () => {
    render(
      <ContextMenu>
        <ContextMenuTrigger>Right click</ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem>Copy</ContextMenuItem>
          <ContextMenuItem>Paste</ContextMenuItem>
          <ContextMenuItem>Delete</ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    );

    const trigger = screen.getByText('Right click');
    fireEvent.contextMenu(trigger);

    await waitFor(() => {
      expect(screen.getByText('Copy')).toBeInTheDocument();
      expect(screen.getByText('Paste')).toBeInTheDocument();
      expect(screen.getByText('Delete')).toBeInTheDocument();
    });
  });

  it('should handle menu item click', async () => {
    const handleClick = vi.fn();
    render(
      <ContextMenu>
        <ContextMenuTrigger>Right click</ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem onClick={handleClick}>Action</ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    );

    const trigger = screen.getByText('Right click');
    fireEvent.contextMenu(trigger);

    await waitFor(() => {
      const menuItem = screen.getByText('Action');
      fireEvent.click(menuItem);
    });

    expect(handleClick).toHaveBeenCalled();
  });


  it('should render label', async () => {
    render(
      <ContextMenu>
        <ContextMenuTrigger>Right click</ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuLabel>Actions</ContextMenuLabel>
          <ContextMenuItem>Item 1</ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    );

    const trigger = screen.getByText('Right click');
    fireEvent.contextMenu(trigger);

    await waitFor(() => {
      expect(screen.getByText('Actions')).toBeInTheDocument();
    });
  });
});

// ============================================================================
// 13. DIALOG COMPONENT TESTS
// ============================================================================

describe('Dialog Component', () => {
  let Dialog: any;
  let DialogTrigger: any;
  let DialogContent: any;
  let DialogHeader: any;
  let DialogTitle: any;
  let DialogDescription: any;
  let DialogFooter: any;
  let DialogClose: any;

  beforeEach(async () => {
    const module = await import('../../../src/components/ui/dialog');
    Dialog = module.Dialog;
    DialogTrigger = module.DialogTrigger;
    DialogContent = module.DialogContent;
    DialogHeader = module.DialogHeader;
    DialogTitle = module.DialogTitle;
    DialogDescription = module.DialogDescription;
    DialogFooter = module.DialogFooter;
    DialogClose = module.DialogClose;
  });

  it('should render dialog trigger', () => {
    render(
      <Dialog>
        <DialogTrigger>Open Dialog</DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dialog Title</DialogTitle>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );

    expect(screen.getByText('Open Dialog')).toBeInTheDocument();
  });

  it('should open dialog when trigger is clicked', async () => {
    render(
      <Dialog>
        <DialogTrigger>Open</DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dialog Title</DialogTitle>
            <DialogDescription>Dialog Description</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );

    const trigger = screen.getByText('Open');
    fireEvent.click(trigger);

    await waitFor(() => {
      expect(screen.getByText('Dialog Title')).toBeInTheDocument();
      expect(screen.getByText('Dialog Description')).toBeInTheDocument();
    });
  });

  it('should render dialog with footer', async () => {
    render(
      <Dialog defaultOpen>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Title</DialogTitle>
          </DialogHeader>
          <DialogFooter>
            <button>Cancel</button>
            <button>Save</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );

    expect(screen.getByText('Cancel')).toBeInTheDocument();
    expect(screen.getByText('Save')).toBeInTheDocument();
  });

  it('should handle controlled open state', () => {
    const { rerender } = render(
      <Dialog open={false}>
        <DialogContent>
          <DialogTitle>Title</DialogTitle>
        </DialogContent>
      </Dialog>
    );

    expect(screen.queryByText('Title')).not.toBeInTheDocument();

    rerender(
      <Dialog open={true}>
        <DialogContent>
          <DialogTitle>Title</DialogTitle>
        </DialogContent>
      </Dialog>
    );

    expect(screen.getByText('Title')).toBeInTheDocument();
  });

  it('should call onOpenChange when dialog state changes', async () => {
    const handleOpenChange = vi.fn();
    render(
      <Dialog onOpenChange={handleOpenChange}>
        <DialogTrigger>Open</DialogTrigger>
        <DialogContent>
          <DialogTitle>Title</DialogTitle>
        </DialogContent>
      </Dialog>
    );

    const trigger = screen.getByText('Open');
    fireEvent.click(trigger);

    await waitFor(() => {
      expect(handleOpenChange).toHaveBeenCalledWith(true);
    });
  });

  it('should render dialog without description', async () => {
    render(
      <Dialog defaultOpen>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Just a Title</DialogTitle>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );

    expect(screen.getByText('Just a Title')).toBeInTheDocument();
  });

});