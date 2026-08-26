import { ReactNode } from "react";
import { Link } from "wouter";
import { Leaf } from "lucide-react";
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
        <div className="flex flex-col items-center text-center space-y-2">
          <Link href="/">
            <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20 cursor-pointer hover:scale-105 transition-transform">
              <Leaf className="w-6 h-6 text-primary-foreground" />
            </div>
          </Link>
          <div className="space-y-1">
            <h1 className="text-xl font-bold tracking-tight text-foreground">KilimoHub</h1>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">Enterprise Platform</p>
          </div>
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
