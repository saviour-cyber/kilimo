import { ReactNode } from 'react';
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: React.ElementType;
  action?: ReactNode;
  children?: ReactNode;
  iconColor?: string;
  iconBg?: string;
}

export function PageHeader({ 
  title, 
  description, 
  icon: Icon, 
  action, 
  children,
  iconColor = "text-primary",
  iconBg = "bg-primary/10" 
}: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
      <div className="flex items-center gap-3">
        
        <div>
          <h1 className="text-2xl font-bold font-serif text-foreground tracking-tight">{title}</h1>
          {description && (
            <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
          )}
        </div>
      </div>
      {(action || children) && <div className="shrink-0">{action || children}</div>}
    </div>
  );
}
