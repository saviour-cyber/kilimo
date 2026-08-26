import { ReactNode } from 'react';

interface SectionHeadingProps {
  title: string;
  action?: ReactNode;
}

export function SectionHeading({ title, action }: SectionHeadingProps) {
  return (
    <div className="flex items-center justify-between gap-4 mb-4 pb-2 border-b border-border">
      <h2 className="text-sm font-semibold text-foreground">{title}</h2>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
