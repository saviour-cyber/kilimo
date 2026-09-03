import { ReactNode } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface AuthCardProps {
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}

export function AuthCard({ title, description, children, footer, className }: AuthCardProps) {
  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4 selection:bg-primary selection:text-primary-foreground">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center text-center space-y-4">
          <Link href="/">
            <div className="flex flex-col items-center cursor-pointer hover:opacity-80 transition-opacity">
              <img src="/logo.png" alt="KiliSense Logo" className="h-12 w-auto object-contain" />
            </div>
          </Link>
        </div>

        <Card className={cn("border-border shadow-md", className)}>
          <CardHeader className="space-y-1 text-center pb-4">
            <CardTitle className="text-xl">{title}</CardTitle>
            <CardDescription className="text-xs">{description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {children}
          </CardContent>
        </Card>
        
        {footer && (
          <div className="text-center">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
