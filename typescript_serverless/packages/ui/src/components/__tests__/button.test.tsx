import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import { Button, buttonVariants } from '../button';

describe('Button Component', () => {
  it('should render with children', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button')).toHaveTextContent('Click me');
  });

  it('should apply default variant and size classes', () => {
    render(<Button>Default Button</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-primary');
    expect(button).toHaveClass('text-primary-foreground');
    expect(button).toHaveClass('h-10');
    expect(button).toHaveClass('px-4');
  });

  it('should apply custom variant classes', () => {
    render(<Button variant="destructive">Delete</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-destructive');
    expect(button).toHaveClass('text-destructive-foreground');
  });

  it('should apply custom size classes', () => {
    render(<Button size="sm">Small Button</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('h-9');
    expect(button).toHaveClass('px-3');
  });

  it('should handle disabled state', () => {
    render(<Button disabled>Disabled Button</Button>);
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(button).toHaveClass('disabled:opacity-50');
  });

  it('should forward ref', () => {
    const ref = { current: null };
    render(<Button ref={ref}>Button with ref</Button>);
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });

  it('should render as child when asChild is true', () => {
    render(
      <Button asChild>
        <a href="/link">Link Button</a>
      </Button>
    );
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/link');
    const defaultClasses: string = buttonVariants();
    defaultClasses.split(' ').forEach((className: string) => {
      if (className) expect(link).toHaveClass(className);
    });
  });

  it('should merge custom className', () => {
    render(<Button className="custom-class">Custom Class Button</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('custom-class');
    const defaultClasses: string = buttonVariants();
    defaultClasses.split(' ').forEach((className: string) => {
      if (className) expect(button).toHaveClass(className);
    });
  });
});

describe('buttonVariants', () => {
  it('should return correct classes for default variant', () => {
    const classes: string = buttonVariants();
    expect(classes).toMatch(/bg-primary/);
    expect(classes).toMatch(/text-primary-foreground/);
    expect(classes).toMatch(/h-10/);
  });

  it('should return correct classes for secondary variant', () => {
    const classes: string = buttonVariants({ variant: 'secondary' });
    expect(classes).toMatch(/bg-secondary/);
    expect(classes).toMatch(/text-secondary-foreground/);
  });

  it('should return correct classes for large size', () => {
    const classes: string = buttonVariants({ size: 'lg' });
    expect(classes).toMatch(/h-11/);
    expect(classes).toMatch(/px-8/);
  });

  it('should return correct classes for icon size', () => {
    const classes: string = buttonVariants({ size: 'icon' });
    expect(classes).toMatch(/h-10/);
    expect(classes).toMatch(/w-10/);
  });
});