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
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Subscriptions</h1>
        <p className="text-slate-500 mt-2">
          Manage tenant subscriptions, tiers, and usage limits across the platform.
        </p>
      </div>
      
      <Card>
        <CardHeader>
          <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center mb-4">
            <CreditCard className="w-5 h-5 text-blue-600" />
          </div>
          <CardTitle>Subscription Plans</CardTitle>
          <CardDescription>
            This module is under construction. It will allow you to define and manage billing plans (Basic, Premium, Enterprise) and assign limits to organizations.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-8 text-center bg-slate-50 border border-dashed rounded-lg text-slate-500">
            Subscription Management UI coming soon.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
