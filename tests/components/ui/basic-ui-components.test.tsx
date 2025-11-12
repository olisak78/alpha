import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { ReactNode } from 'react';

/**
 * UI Components Test Suite - Part 1
 * 
 * Tests for: accordion, alert, alert-dialog, aspect-ratio, avatar, badge, button, drawer, input, label
 */

// ============================================================================
// 1. ACCORDION COMPONENT TESTS
// ============================================================================

describe('Accordion Component', () => {
  let Accordion: any, AccordionItem: any, AccordionTrigger: any, AccordionContent: any;

  beforeEach(async () => {
    const module = await import('../../../src/components/ui/accordion');
    Accordion = module.Accordion;
    AccordionItem = module.AccordionItem;
    AccordionTrigger = module.AccordionTrigger;
    AccordionContent = module.AccordionContent;
  });

  it('should render accordion with items', () => {
    render(
      <Accordion type="single" collapsible>
        <AccordionItem value="item-1">
          <AccordionTrigger>Section 1</AccordionTrigger>
          <AccordionContent>Content 1</AccordionContent>
        </AccordionItem>
      </Accordion>
    );

    expect(screen.getByText('Section 1')).toBeInTheDocument();
  });

  it('should expand and collapse on trigger click', async () => {
    render(
      <Accordion type="single" collapsible>
        <AccordionItem value="item-1">
          <AccordionTrigger>Section 1</AccordionTrigger>
          <AccordionContent>Content 1</AccordionContent>
        </AccordionItem>
      </Accordion>
    );

    const trigger = screen.getByText('Section 1');
    fireEvent.click(trigger);

    // Content should be visible after clicking trigger
    await waitFor(() => {
      expect(screen.getByText('Content 1')).toBeInTheDocument();
    });
  });

  it('should render multiple accordion items', () => {
    render(
      <Accordion type="single" collapsible>
        <AccordionItem value="item-1">
          <AccordionTrigger>Section 1</AccordionTrigger>
          <AccordionContent>Content 1</AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-2">
          <AccordionTrigger>Section 2</AccordionTrigger>
          <AccordionContent>Content 2</AccordionContent>
        </AccordionItem>
      </Accordion>
    );

    expect(screen.getByText('Section 1')).toBeInTheDocument();
    expect(screen.getByText('Section 2')).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    const { container } = render(
      <Accordion type="single" collapsible className="custom-accordion">
        <AccordionItem value="item-1">
          <AccordionTrigger>Section 1</AccordionTrigger>
          <AccordionContent>Content 1</AccordionContent>
        </AccordionItem>
      </Accordion>
    );

    expect(container.firstChild).toHaveClass('custom-accordion');
  });
});

// ============================================================================
// 2. ALERT COMPONENT TESTS
// ============================================================================

describe('Alert Component', () => {
  let Alert: any, AlertDescription: any, AlertTitle: any;

  beforeEach(async () => {
    const module = await import('../../../src/components/ui/alert');
    Alert = module.Alert;
    AlertDescription = module.AlertDescription;
    AlertTitle = module.AlertTitle;
  });

  it('should render alert with title and description', () => {
    render(
      <Alert>
        <AlertTitle>Alert Title</AlertTitle>
        <AlertDescription>Alert Description</AlertDescription>
      </Alert>
    );

    expect(screen.getByText('Alert Title')).toBeInTheDocument();
    expect(screen.getByText('Alert Description')).toBeInTheDocument();
  });

  it('should apply default variant styles', () => {
    const { container } = render(
      <Alert>
        <AlertDescription>Default alert</AlertDescription>
      </Alert>
    );

    const alert = container.firstChild;
    expect(alert).toHaveClass('border');
  });

  it('should render alert with only description', () => {
    render(
      <Alert>
        <AlertDescription>Simple alert message</AlertDescription>
      </Alert>
    );

    expect(screen.getByText('Simple alert message')).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    const { container } = render(
      <Alert className="custom-alert">
        <AlertDescription>Custom styled alert</AlertDescription>
      </Alert>
    );

    expect(container.firstChild).toHaveClass('custom-alert');
  });
});

// ============================================================================
// 3. ALERT DIALOG COMPONENT TESTS
// ============================================================================

describe('AlertDialog Component', () => {
  let AlertDialog: any;
  let AlertDialogTrigger: any;
  let AlertDialogContent: any;
  let AlertDialogHeader: any;
  let AlertDialogTitle: any;
  let AlertDialogDescription: any;
  let AlertDialogFooter: any;
  let AlertDialogAction: any;
  let AlertDialogCancel: any;

  beforeEach(async () => {
    const module = await import('../../../src/components/ui/alert-dialog');
    AlertDialog = module.AlertDialog;
    AlertDialogTrigger = module.AlertDialogTrigger;
    AlertDialogContent = module.AlertDialogContent;
    AlertDialogHeader = module.AlertDialogHeader;
    AlertDialogTitle = module.AlertDialogTitle;
    AlertDialogDescription = module.AlertDialogDescription;
    AlertDialogFooter = module.AlertDialogFooter;
    AlertDialogAction = module.AlertDialogAction;
    AlertDialogCancel = module.AlertDialogCancel;
  });

  it('should render alert dialog trigger', () => {
    render(
      <AlertDialog>
        <AlertDialogTrigger>Open Dialog</AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Dialog Title</AlertDialogTitle>
          </AlertDialogHeader>
        </AlertDialogContent>
      </AlertDialog>
    );

    expect(screen.getByText('Open Dialog')).toBeInTheDocument();
  });

  it('should render dialog content when triggered', async () => {
    render(
      <AlertDialog>
        <AlertDialogTrigger>Open Dialog</AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Action</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction>Continue</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );

    const trigger = screen.getByText('Open Dialog');
    fireEvent.click(trigger);

    await waitFor(() => {
      expect(screen.getByText('Confirm Action')).toBeInTheDocument();
      expect(screen.getByText('Are you sure you want to continue?')).toBeInTheDocument();
    });
  });

});

// ============================================================================
// 4. ASPECT RATIO COMPONENT TESTS
// ============================================================================

describe('AspectRatio Component', () => {
  let AspectRatio: any;

  beforeEach(async () => {
    const module = await import('../../../src/components/ui/aspect-ratio');
    AspectRatio = module.AspectRatio;
  });

  it('should render aspect ratio container', () => {
    const { container } = render(
      <AspectRatio ratio={16 / 9}>
        <img src="/test.jpg" alt="test" />
      </AspectRatio>
    );

    expect(container.firstChild).toBeInTheDocument();
  });

  it('should render children inside aspect ratio container', () => {
    render(
      <AspectRatio ratio={16 / 9}>
        <div>Content</div>
      </AspectRatio>
    );

    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    const { container } = render(
      <AspectRatio ratio={1} className="custom-ratio">
        <div>Content</div>
      </AspectRatio>
    );

    const wrapper = container.querySelector('.custom-ratio');
    expect(wrapper).toBeInTheDocument();
  });
});

// ============================================================================
// 5. AVATAR COMPONENT TESTS
// ============================================================================

describe('Avatar Component', () => {
  let Avatar: any, AvatarImage: any, AvatarFallback: any;

  beforeEach(async () => {
    const module = await import('../../../src/components/ui/avatar');
    Avatar = module.Avatar;
    AvatarImage = module.AvatarImage;
    AvatarFallback = module.AvatarFallback;
  });

  it('should render fallback when image is not provided', () => {
    render(
      <Avatar>
        <AvatarFallback>JD</AvatarFallback>
      </Avatar>
    );

    expect(screen.getByText('JD')).toBeInTheDocument();
  });

  it('should apply custom className to avatar', () => {
    const { container } = render(
      <Avatar className="custom-avatar">
        <AvatarFallback>JD</AvatarFallback>
      </Avatar>
    );

    expect(container.firstChild).toHaveClass('custom-avatar');
  });
});

// ============================================================================
// 6. BADGE COMPONENT TESTS
// ============================================================================

describe('Badge Component', () => {
  let Badge: any;

  beforeEach(async () => {
    const module = await import('../../../src/components/ui/badge');
    Badge = module.Badge;
  });

  it('should render badge with text', () => {
    render(<Badge>New</Badge>);
    expect(screen.getByText('New')).toBeInTheDocument();
  });

  it('should apply default variant styles', () => {
    const { container } = render(<Badge>Default</Badge>);
    expect(container.firstChild).toHaveClass('bg-primary');
  });

  it('should apply secondary variant styles', () => {
    const { container } = render(<Badge variant="secondary">Secondary</Badge>);
    expect(container.firstChild).toHaveClass('bg-secondary');
  });

  it('should apply destructive variant styles', () => {
    const { container } = render(<Badge variant="destructive">Error</Badge>);
    expect(container.firstChild).toHaveClass('bg-destructive');
  });

  it('should apply outline variant styles', () => {
    const { container } = render(<Badge variant="outline">Outline</Badge>);
    expect(container.firstChild).toHaveClass('border');
  });

  it('should apply custom className', () => {
    const { container } = render(<Badge className="custom-badge">Custom</Badge>);
    expect(container.firstChild).toHaveClass('custom-badge');
  });

  it('should render badge with icon', () => {
    render(
      <Badge>
        <span>🔔</span> Notifications
      </Badge>
    );
    expect(screen.getByText('Notifications')).toBeInTheDocument();
  });
});

// ============================================================================
// 7. BUTTON COMPONENT TESTS
// ============================================================================

describe('Button Component', () => {
  let Button: any;

  beforeEach(async () => {
    const module = await import('../../../src/components/ui/button');
    Button = module.Button;
  });

  it('should render button with text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
  });

  it('should handle click events', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should be disabled when disabled prop is true', () => {
    render(<Button disabled>Disabled Button</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('should not call onClick when disabled', () => {
    const handleClick = vi.fn();
    render(<Button disabled onClick={handleClick}>Disabled</Button>);
    
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('should apply default variant styles', () => {
    const { container } = render(<Button>Default</Button>);
    expect(container.firstChild).toHaveClass('bg-primary');
  });

  it('should apply destructive variant styles', () => {
    const { container } = render(<Button variant="destructive">Delete</Button>);
    expect(container.firstChild).toHaveClass('bg-destructive');
  });

  it('should apply outline variant styles', () => {
    const { container } = render(<Button variant="outline">Outline</Button>);
    expect(container.firstChild).toHaveClass('border');
  });

  it('should apply secondary variant styles', () => {
    const { container } = render(<Button variant="secondary">Secondary</Button>);
    expect(container.firstChild).toHaveClass('bg-secondary');
  });

  it('should apply ghost variant styles', () => {
    const { container } = render(<Button variant="ghost">Ghost</Button>);
    expect(container.firstChild).toHaveClass('hover:bg-accent');
  });

  it('should apply link variant styles', () => {
    const { container } = render(<Button variant="link">Link</Button>);
    expect(container.firstChild).toHaveClass('underline-offset-4');
  });

  it('should apply small size styles', () => {
    const { container } = render(<Button size="sm">Small</Button>);
    expect(container.firstChild).toHaveClass('h-9');
  });

  it('should apply large size styles', () => {
    const { container } = render(<Button size="lg">Large</Button>);
    expect(container.firstChild).toHaveClass('h-11');
  });

  it('should apply icon size styles', () => {
    const { container } = render(<Button size="icon">🔍</Button>);
    expect(container.firstChild).toHaveClass('h-10', 'w-10');
  });

  it('should apply custom className', () => {
    const { container } = render(<Button className="custom-btn">Custom</Button>);
    expect(container.firstChild).toHaveClass('custom-btn');
  });

  it('should render as child component when asChild is true', () => {
    const { container } = render(
      <Button asChild>
        <a href="/test">Link Button</a>
      </Button>
    );
    
    const link = container.querySelector('a');
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/test');
  });
});

// ============================================================================
// 14. DRAWER COMPONENT TESTS
// ============================================================================

describe('Drawer Component', () => {
  let Drawer: any;
  let DrawerTrigger: any;
  let DrawerContent: any;
  let DrawerHeader: any;
  let DrawerTitle: any;
  let DrawerDescription: any;
  let DrawerFooter: any;
  let DrawerClose: any;

  beforeEach(async () => {
    const module = await import('../../../src/components/ui/drawer');
    Drawer = module.Drawer;
    DrawerTrigger = module.DrawerTrigger;
    DrawerContent = module.DrawerContent;
    DrawerHeader = module.DrawerHeader;
    DrawerTitle = module.DrawerTitle;
    DrawerDescription = module.DrawerDescription;
    DrawerFooter = module.DrawerFooter;
    DrawerClose = module.DrawerClose;
  });

  it('should render drawer trigger', () => {
    render(
      <Drawer>
        <DrawerTrigger>Open Drawer</DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Drawer Title</DrawerTitle>
          </DrawerHeader>
        </DrawerContent>
      </Drawer>
    );

    expect(screen.getByText('Open Drawer')).toBeInTheDocument();
  });

  it('should render drawer content with header', () => {
    render(
      <Drawer open>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Settings</DrawerTitle>
            <DrawerDescription>Manage your preferences</DrawerDescription>
          </DrawerHeader>
        </DrawerContent>
      </Drawer>
    );

    expect(screen.getByText('Settings')).toBeInTheDocument();
    expect(screen.getByText('Manage your preferences')).toBeInTheDocument();
  });

  it('should render drawer with footer', () => {
    render(
      <Drawer open>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Title</DrawerTitle>
          </DrawerHeader>
          <DrawerFooter>
            <button>Save</button>
            <DrawerClose>Cancel</DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );

    expect(screen.getByText('Save')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });
});

// ============================================================================
// 17. INPUT COMPONENT TESTS
// ============================================================================

describe('Input Component', () => {
  let Input: any;

  beforeEach(async () => {
    const module = await import('../../../src/components/ui/input');
    Input = module.Input;
  });

  it('should render input field', () => {
    render(<Input placeholder="Enter text" />);
    expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument();
  });

  it('should handle onChange events', () => {
    const handleChange = vi.fn();
    render(<Input onChange={handleChange} />);
    
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'test value' } });
    
    expect(handleChange).toHaveBeenCalled();
  });

  it('should update value on user input', () => {
    render(<Input defaultValue="" />);
    
    const input = screen.getByRole('textbox') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'new text' } });
    
    expect(input.value).toBe('new text');
  });

  it('should accept different input types', () => {
    const { container } = render(<Input type="password" />);
    const input = container.querySelector('input');
    expect(input).toHaveAttribute('type', 'password');
  });

  it('should handle email type', () => {
    const { container } = render(<Input type="email" placeholder="email@example.com" />);
    const input = container.querySelector('input');
    expect(input).toHaveAttribute('type', 'email');
  });

  it('should handle number type', () => {
    const { container } = render(<Input type="number" />);
    const input = container.querySelector('input');
    expect(input).toHaveAttribute('type', 'number');
  });

  it('should be disabled when disabled prop is true', () => {
    render(<Input disabled />);
    expect(screen.getByRole('textbox')).toBeDisabled();
  });

  it('should display default value', () => {
    render(<Input defaultValue="initial value" />);
    const input = screen.getByRole('textbox') as HTMLInputElement;
    expect(input.value).toBe('initial value');
  });

  it('should apply custom className', () => {
    const { container } = render(<Input className="custom-input" />);
    expect(container.firstChild).toHaveClass('custom-input');
  });

  it('should handle onBlur events', () => {
    const handleBlur = vi.fn();
    render(<Input onBlur={handleBlur} />);
    
    const input = screen.getByRole('textbox');
    fireEvent.blur(input);
    
    expect(handleBlur).toHaveBeenCalledTimes(1);
  });

  it('should handle onFocus events', () => {
    const handleFocus = vi.fn();
    render(<Input onFocus={handleFocus} />);
    
    const input = screen.getByRole('textbox');
    fireEvent.focus(input);
    
    expect(handleFocus).toHaveBeenCalledTimes(1);
  });

  it('should support readonly attribute', () => {
    render(<Input readOnly value="readonly text" />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('readonly');
  });

  it('should support maxLength attribute', () => {
    const { container } = render(<Input maxLength={10} />);
    const input = container.querySelector('input');
    expect(input).toHaveAttribute('maxLength', '10');
  });
});

// ============================================================================
// 18. LABEL COMPONENT TESTS
// ============================================================================

describe('Label Component', () => {
  let Label: any;

  beforeEach(async () => {
    const module = await import('../../../src/components/ui/label');
    Label = module.Label;
  });

  it('should render label with text', () => {
    render(<Label htmlFor="test-input">Test Label</Label>);
    expect(screen.getByText('Test Label')).toBeInTheDocument();
  });

  it('should be associated with input via htmlFor', () => {
    render(
      <div>
        <Label htmlFor="test-input">Username</Label>
        <input id="test-input" type="text" />
      </div>
    );
    
    const label = screen.getByText('Username');
    expect(label).toHaveAttribute('for', 'test-input');
  });

  it('should apply custom className', () => {
    const { container } = render(<Label className="custom-label">Label</Label>);
    expect(container.firstChild).toHaveClass('custom-label');
  });

  it('should render children correctly', () => {
    render(
      <Label>
        <span>Required</span> *
      </Label>
    );
    
    expect(screen.getByText('Required')).toBeInTheDocument();
  });

  it('should support asChild prop for rendering as different element', () => {
    const { container } = render(
      <Label asChild>
        <span>Custom Element Label</span>
      </Label>
    );
    
    const span = container.querySelector('span');
    expect(span).toBeInTheDocument();
    expect(span).toHaveTextContent('Custom Element Label');
  });
});