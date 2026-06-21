/**
 * File: src/components/ui/card.tsx
 * Purpose: Glass panel primitive used by every dashboard card. shadcn-style
 *          composable parts, themed via the design tokens in tailwind.config.ts.
 */
import { forwardRef, type HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export const Panel = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'relative rounded-panel border border-hairline/60 bg-nebula/40 p-5',
        'backdrop-blur-xl shadow-panel',
        'before:pointer-events-none before:absolute before:inset-0 before:rounded-panel before:bg-glass-sheen',
        className
      )}
      {...props}
    />
  )
);
Panel.displayName = 'Panel';

/** Eyebrow — the small uppercase label that titles each card. */
export function Eyebrow({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={cn('font-mono text-[10px] uppercase tracking-eyebrow text-haze', className)}>
      {children}
    </p>
  );
}
