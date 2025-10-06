import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface FloatingActionButtonProps {
  onClick: () => void;
  icon: ReactNode;
  label?: string;
  variant?: 'primary' | 'secondary';
  className?: string;
}

export const FloatingActionButton = ({
  onClick,
  icon,
  label,
  variant = 'primary',
  className
}: FloatingActionButtonProps) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        'fixed bottom-6 right-6 z-40 shadow-2xl',
        'flex items-center gap-2 rounded-full',
        'transition-all duration-200',
        'active:scale-95 hover:scale-105',
        'focus:outline-none focus:ring-4 focus:ring-primary/30',
        variant === 'primary' && 'bg-gradient-to-r from-blue-600 to-purple-600 text-white',
        variant === 'secondary' && 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-2',
        label ? 'px-6 py-4' : 'w-14 h-14',
        className
      )}
      aria-label={label || 'Action button'}
    >
      <div className={cn('flex items-center justify-center', label ? 'w-6 h-6' : 'w-full h-full')}>
        {icon}
      </div>
      {label && <span className="font-semibold text-sm pr-1">{label}</span>}
    </button>
  );
};
