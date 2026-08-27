import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Headset } from "lucide-react";

export default function Support() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Support Center</h1>
        <p className="text-muted-foreground mt-2">
          Handle tenant support tickets, inquiries, and platform feedback.
        </p>
      </div>
      
      <Card>
        <CardHeader>
          <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center mb-4">
            <Headset className="w-5 h-5 text-amber-600" />
          </div>
          <CardTitle>Active Tickets</CardTitle>
          <CardDescription>
            This module is under construction. It will integrate with your support desk (e.g., Zendesk, Intercom) or provide a native ticketing system for tenant queries.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-8 text-center bg-muted border border-dashed rounded-lg text-muted-foreground">
            Support Center interface coming soon.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
