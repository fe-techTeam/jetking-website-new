'use client';

import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { forwardRef, type ButtonHTMLAttributes } from 'react';

import { cn } from '@/lib/utils';

const buttonVariants = cva(
  [
    'inline-flex items-center justify-center gap-2 whitespace-nowrap',
    'font-medium select-none',
    'transition-[background-color,color,border-color,opacity,transform] duration-150 ease-[var(--ease-out-soft)]',
    'active:scale-[0.98]',
    'disabled:pointer-events-none disabled:opacity-45',
    '[&_svg]:pointer-events-none [&_svg]:shrink-0',
  ],
  {
    variants: {
      variant: {
        primary: 'bg-brand text-brand-ink hover:bg-brand-hover',
        secondary: 'bg-surface-hover text-ink hover:bg-surface-active',
        outline: 'border border-line bg-transparent text-ink hover:bg-surface-hover',
        ghost: 'bg-transparent text-ink-muted hover:bg-surface-hover hover:text-ink',
        subtle: 'bg-transparent text-ink-subtle hover:bg-surface-hover hover:text-ink',
        danger: 'bg-danger-500 text-white hover:bg-danger-600',
      },
      size: {
        sm: 'h-8 rounded-lg px-2.5 text-[0.8125rem] [&_svg]:size-4',
        md: 'h-9 rounded-lg px-3.5 text-sm [&_svg]:size-4',
        lg: 'h-11 rounded-xl px-5 text-[0.9375rem] [&_svg]:size-[1.125rem]',
        icon: 'size-9 rounded-lg [&_svg]:size-[1.125rem]',
        'icon-sm': 'size-7 rounded-md [&_svg]:size-4',
        'icon-lg': 'size-10 rounded-xl [&_svg]:size-5',
      },
    },
    defaultVariants: {
      variant: 'secondary',
      size: 'md',
    },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  /** Render the child element instead of a `<button>`, forwarding all styles. */
  asChild?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant, size, asChild = false, type, ...props },
  ref,
) {
  const Comp = asChild ? Slot : 'button';

  return (
    <Comp
      ref={ref}
      // Buttons inside a form default to "submit"; that is almost never wanted.
      type={asChild ? undefined : (type ?? 'button')}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
});
