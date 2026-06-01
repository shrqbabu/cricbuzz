import { cn } from '../../utils/cn';
import { getInitials } from '../../utils';
import { User } from 'lucide-react';

interface AvatarProps {
  src?: string;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showFallback?: boolean;
}

export function Avatar({ src, name, size = 'md', className, showFallback = true }: AvatarProps) {
  const sizes = {
    xs: 'h-6 w-6 text-xs',
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-12 w-12 text-base',
    xl: 'h-16 w-16 text-xl',
  };

  const commonClass = cn('rounded-full overflow-hidden flex items-center justify-center flex-shrink-0', sizes[size], className);

  if (src) {
    return (
      <div className={commonClass}>
        <img
          src={src}
          alt={name || 'Avatar'}
          className="w-full h-full object-cover"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
          }}
        />
      </div>
    );
  }

  if (showFallback && name) {
    const colors = [
      'bg-emerald-500', 'bg-blue-500', 'bg-purple-500',
      'bg-orange-500', 'bg-pink-500', 'bg-indigo-500',
    ];
    const colorIndex = name.charCodeAt(0) % colors.length;
    return (
      <div className={cn(commonClass, colors[colorIndex], 'text-white font-bold')}>
        {getInitials(name)}
      </div>
    );
  }

  return (
    <div className={cn(commonClass, 'bg-slate-200 dark:bg-slate-700 text-slate-400')}>
      <User size={parseInt(sizes[size].split('h-')[1]) * 4 / 2} />
    </div>
  );
}
