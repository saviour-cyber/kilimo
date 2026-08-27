import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Wallet } from "lucide-react";

export default function Billing() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Billing & Invoices</h1>
        <p className="text-muted-foreground mt-2">
          Manage platform revenue, tenant invoices, and payment gateways.
        </p>
      </div>
      
      <Card>
        <CardHeader>
          <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center mb-4">
            <Wallet className="w-5 h-5 text-green-600" />
          </div>
          <CardTitle>Billing Dashboard</CardTitle>
          <CardDescription>
            This module is under construction. It will provide an overview of recurring revenue, failed payments, and integration with Stripe/PayPal.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-8 text-center bg-muted border border-dashed rounded-lg text-muted-foreground">
            Billing interface coming soon.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
