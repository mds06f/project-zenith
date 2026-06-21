/**
 * File: src/components/ui/button.tsx
 * Purpose: Single button primitive with variant + size via CVA. Keyboard focus
 *          ring is always visible (quality floor).
 */
import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-full font-medium transition-all ' +
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aurora/70 disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: 'bg-aurora/15 text-aurora border border-aurora/40 hover:bg-aurora/25 hover:shadow-glow',
        ghost: 'text-haze hover:text-frost hover:bg-frost/5',
        solid: 'bg-frost text-void hover:bg-frost/90',
      },
      size: {
        sm: 'h-8 px-3 text-xs',
        md: 'h-10 px-4 text-sm',
        lg: 'h-12 px-6 text-base',
      },
    },
    defaultVariants: { variant: 'ghost', size: 'md' },
  }
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />
  )
);
Button.displayName = 'Button';
