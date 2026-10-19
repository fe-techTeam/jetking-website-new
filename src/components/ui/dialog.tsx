'use client';

import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { forwardRef, type ComponentPropsWithoutRef, type ElementRef } from 'react';

import { cn } from '@/lib/utils';

export const Dialog = DialogPrimitive.Root;

export const DialogContent = forwardRef<
  ElementRef<typeof DialogPrimitive.Content>,
  ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & { showCloseButton?: boolean }
>(function DialogContent({ className, children, showCloseButton = true, ...props }, ref) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay
        className={cn(
          'bg-clay-950/40 fixed inset-0 z-50 backdrop-blur-[2px]',
          'data-[state=open]:animate-fade-in',
        )}
      />
      <DialogPrimitive.Content
        ref={ref}
        className={cn(
          // Phone: bottom sheet. sm+: centred modal.
          'sheet-up fixed inset-x-0 bottom-0 z-50 max-h-[92dvh] w-full overflow-y-auto overscroll-contain',
          'rounded-t-[24px] border border-b-0 border-line bg-surface-raised p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-pop',
          'sm:inset-x-auto sm:top-1/2 sm:bottom-auto sm:left-1/2 sm:w-[calc(100vw-2rem)] sm:max-w-lg sm:-translate-x-1/2 sm:-translate-y-1/2',
          'sm:rounded-2xl sm:border-b sm:pb-6 sm:data-[state=open]:animate-rise-in',
          className,
        )}
        {...props}
      >
        {children}
        {showCloseButton ? (
          <DialogPrimitive.Close
            aria-label="Close"
            className={cn(
              'absolute top-2.5 right-2.5 grid size-11 place-items-center rounded-lg text-ink-subtle',
              'transition-colors hover:bg-surface-hover hover:text-ink',
            )}
          >
            <X className="size-4" />
          </DialogPrimitive.Close>
        ) : null}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
});

export function DialogHeader({ className, ...props }: ComponentPropsWithoutRef<'div'>) {
  return <div className={cn('mb-4 flex flex-col gap-1.5 pr-8', className)} {...props} />;
}

export function DialogFooter({ className, ...props }: ComponentPropsWithoutRef<'div'>) {
  return (
    <div
      className={cn('mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end', className)}
      {...props}
    />
  );
}

export const DialogTitle = forwardRef<
  ElementRef<typeof DialogPrimitive.Title>,
  ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(function DialogTitle({ className, ...props }, ref) {
  return (
    <DialogPrimitive.Title
      ref={ref}
      className={cn('text-lg font-medium tracking-tight text-ink', className)}
      {...props}
    />
  );
});

export const DialogDescription = forwardRef<
  ElementRef<typeof DialogPrimitive.Description>,
  ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(function DialogDescription({ className, ...props }, ref) {
  return (
    <DialogPrimitive.Description
      ref={ref}
      className={cn('text-sm leading-relaxed text-ink-muted', className)}
      {...props}
    />
  );
});
