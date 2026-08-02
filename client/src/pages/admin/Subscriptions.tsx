import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CreditCard } from "lucide-react";

export default function Subscriptions() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Subscriptions</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage tenant subscriptions, tiers, and usage limits across the platform.
          </p>
        </div>
      </div>
      
      <Card className="border-border shadow-sm bg-card rounded-xl">
        <CardHeader>
          <div className="w-10 h-10 rounded-lg bg-secondary border border-border flex items-center justify-center mb-4">
            <CreditCard className="w-5 h-5 text-muted-foreground" />
          </div>
          <CardTitle className="text-lg text-foreground">Subscription Plans</CardTitle>
          <CardDescription className="text-muted-foreground">
            This module is under construction. It will allow you to define and manage billing plans (Basic, Premium, Enterprise) and assign limits to organizations.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-8 text-center bg-secondary/30 border border-dashed border-border rounded-lg text-muted-foreground text-sm">
            Subscription Management UI coming soon.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
