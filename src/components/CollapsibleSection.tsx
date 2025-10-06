import { ChevronDown, ChevronUp } from 'lucide-react';
import { useState, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface CollapsibleSectionProps {
  title: string;
  icon?: ReactNode;
  badge?: string | number;
  defaultOpen?: boolean;
  children: ReactNode;
  className?: string;
}

export const CollapsibleSection = ({
  title,
  icon,
  badge,
  defaultOpen = false,
  children,
  className
}: CollapsibleSectionProps) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={cn('border rounded-lg overflow-hidden', className)}>
      {/* Header tocável */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 bg-card hover:bg-accent transition-colors active:scale-[0.99]"
      >
        <div className="flex items-center gap-3">
          {icon && <div className="text-primary">{icon}</div>}
          <h3 className="font-semibold text-base">{title}</h3>
          {badge !== undefined && (
            <span className="px-2 py-1 text-xs font-medium bg-primary/10 text-primary rounded-full">
              {badge}
            </span>
          )}
        </div>
        <div className="text-muted-foreground">
          {isOpen ? (
            <ChevronUp className="h-5 w-5" />
          ) : (
            <ChevronDown className="h-5 w-5" />
          )}
        </div>
      </button>

      {/* Conteúdo expandível */}
      <div
        className={cn(
          'transition-all duration-300 ease-in-out',
          isOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'
        )}
      >
        <div className="p-4 border-t bg-card/50">
          {children}
        </div>
      </div>
    </div>
  );
};
