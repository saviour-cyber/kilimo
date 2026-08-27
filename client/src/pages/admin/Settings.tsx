import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Settings as SettingsIcon } from "lucide-react";

export default function Settings() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Platform Settings</h1>
        <p className="text-muted-foreground mt-2">
          Configure global platform variables, branding, and core infrastructure.
        </p>
      </div>
      
      <Card>
        <CardHeader>
          <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center mb-4">
            <SettingsIcon className="w-5 h-5 text-muted-foreground" />
          </div>
          <CardTitle>Global Configuration</CardTitle>
          <CardDescription>
            This module is under construction. Manage system-wide settings, email templates, API rate limits, and maintenance modes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-8 text-center bg-muted border border-dashed rounded-lg text-muted-foreground">
            Settings interface coming soon.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
