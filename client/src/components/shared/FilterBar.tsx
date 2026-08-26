import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface FilterOption {
  label: string;
  value: string;
}

interface FilterBarProps {
  options: FilterOption[];
  activeValue: string;
  onChange: (value: string) => void;
  children?: ReactNode;
  className?: string;
}

export function FilterBar({ options, activeValue, onChange, children, className }: FilterBarProps) {
  return (
    <div className={cn("flex flex-wrap items-center gap-3", className)}>
      {options.length > 0 && (
        <div className="flex flex-wrap gap-1.5 p-1 bg-muted/50 rounded-lg">
          {options.map((opt) => {
            const isActive = activeValue === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => onChange(opt.value)}
                className={cn(
                  "px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200",
                  isActive
                    ? "bg-background text-foreground shadow-sm ring-1 ring-border"
                    : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                )}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      )}
      {children && <div className="flex-1 min-w-[200px]">{children}</div>}
    </div>
  );
}
