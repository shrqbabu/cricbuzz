import { HTMLAttributes } from 'react';
import { cn } from '../../utils/cn';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'live' | 'upcoming' | 'completed' | 'abandoned' | 'default' | 'success' | 'warning' | 'error';
  pulse?: boolean;
}

export function Badge({ className, variant = 'default', pulse, children, ...props }: BadgeProps) {
  const variants = {
    live: 'bg-red-500/10 text-red-500 border border-red-500/20',
    upcoming: 'bg-blue-500/10 text-blue-500 border border-blue-500/20',
    completed: 'bg-green-500/10 text-green-500 border border-green-500/20',
    abandoned: 'bg-gray-500/10 text-gray-500 border border-gray-500/20',
    default: 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300',
    success: 'bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20',
    warning: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border border-yellow-500/20',
    error: 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold',
        variants[variant],
        className
      )}
      {...props}
    >
      {pulse && variant === 'live' && (
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
        </span>
      )}
      {children}
    </span>
  );
}
