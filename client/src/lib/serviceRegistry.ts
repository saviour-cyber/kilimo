import type React from "react";
import { type WidgetType, type DashboardWidgetDefinition } from "./moduleRegistry";

// â”€â”€â”€ Platform Service Widgets â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
import { WeatherWidget, WeatherAlertsWidget } from "@/components/widgets/WeatherWidget";
import { KiliAIDashboardWidget } from "@/components/widgets/intelligence/KiliAIDashboardWidget";
import { ActivityFeedWidget } from "@/components/widgets/platform/ActivityFeedWidget";
import { NotificationsSidebarWidget } from "@/components/widgets/platform/NotificationsSidebarWidget";
import IoTSummaryWidget from "@/components/widgets/iot/IoTSummaryWidget";

// Pages
import KiliAIPage from "@/pages/KiliAIPage";
import Notifications from "@/pages/Notifications";
import WeatherPage from "@/pages/WeatherPage";
import ReportsPage from "@/pages/ReportsPage";

// â”€â”€â”€ Platform Service Registry â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
//
// Platform Services are NOT farm modules. They are platform-wide capabilities
// (Weather, AI, Notifications, Activity Feed) that are always available
// regardless of which business modules are enabled for a farm.
//
// They must NEVER appear in Module Settings, and they should never contain
// farm-module-specific logic.

import type { LucideIcon } from "lucide-react";
import { Sparkles, CloudRain, Bell, FileText, Cpu } from "lucide-react";
import { KiliAI } from "@/components/intelligence/KiliAI";
import IoTPage from "@/pages/IoTPage";

export interface PlatformServiceDefinition {
  key: string;
  name: string;
  description: string;
  widgets?: DashboardWidgetDefinition[];
  /** Optional floating widgets injected into the root layout (e.g., FABs) */
  floatingWidgets?: React.FC[];
  
  // Navigation properties (if it should appear in the sidebar)
  showInSidebar?: boolean;
  icon?: LucideIcon;
  basePath?: string;
  defaultPath?: string;
  color?: string;
  
  // Full page component for dynamic routing
  pageComponent?: React.FC;
}

export const SERVICE_REGISTRY: PlatformServiceDefinition[] = [
  {
    key: "kili-ai",
    name: "Kili AI",
    description: "Context-aware AI insights based on current farm data.",
    showInSidebar: true,
    icon: Sparkles,
    basePath: "/kili-ai",
    color: "text-purple-500",
    widgets: [
      { id: "kili-dashboard", type: "intelligence", size: "large", priority: { level: "critical", order: 2 }, component: KiliAIDashboardWidget },
    ],
    floatingWidgets: [KiliAI],
    pageComponent: KiliAIPage,
  },

  {
    key: "weather",
    name: "Weather",
    description: "Platform-wide weather context and alerts for any farm location.",
    showInSidebar: true,
    icon: CloudRain,
    basePath: "/weather",
    color: "text-cyan-500",
    widgets: [
      { id: "weather-banner", type: "system", size: "small", priority: { level: "critical", order: 1 }, component: WeatherWidget as React.FC<{ farmId: number }> },
      { id: "weather-alerts", type: "system", size: "medium", priority: { level: "high", order: 1 }, component: WeatherAlertsWidget as React.FC<{ farmId: number }> },
    ],
    pageComponent: WeatherPage,
  },

  {
    key: "notifications",
    name: "Notifications",
    description: "Farm-wide notification feed.",
    showInSidebar: false,
    icon: Bell,
    basePath: "/notifications",
    color: "text-amber-600",
    widgets: [
      { id: "notifications-sidebar", type: "system", size: "medium", priority: { level: "high", order: 2 }, component: NotificationsSidebarWidget as React.FC<{ farmId: number }> },
    ],
    pageComponent: Notifications,
  },

  {
    key: "reports",
    name: "Reports",
    description: "Aggregate platform-wide reporting and data exports.",
    showInSidebar: true,
    icon: FileText,
    basePath: "/reports",
    color: "text-indigo-500",
    pageComponent: ReportsPage,
  },

  {
    key: "activity",
    name: "Activity",
    description: "Recent activity across the farm.",
    showInSidebar: false,
    basePath: "/activity",
    widgets: [
      { id: "recent-activity", type: "activity", size: "medium", priority: { level: "low", order: 0 }, component: ActivityFeedWidget as React.FC<{ farmId: number }> },
    ],
  },

  {
    key: "iot",
    name: "IoT",
    description: "Smart device management, live telemetry, and sensor data for the entire farm.",
    showInSidebar: true,
    icon: Cpu,
    basePath: "/iot",
    color: "text-sky-500",
    widgets: [
      { id: "iot-summary", type: "summary", size: "medium", priority: { level: "high", order: 0 }, component: IoTSummaryWidget as React.FC<{ farmId: number }> },
    ],
    pageComponent: IoTPage,
  },
];

// â”€â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export function getServiceWidgets(type: WidgetType): DashboardWidgetDefinition[] {
  return SERVICE_REGISTRY.flatMap((s) => s.widgets ?? []).filter((w) => w.type === type);
}

export function getAllServiceWidgets(): Record<WidgetType, DashboardWidgetDefinition[]> {
  const result: Record<WidgetType, DashboardWidgetDefinition[]> = {
    kpi: [],
    summary: [],
    intelligence: [],
    system: [],
    sidebar: [],
    activity: [],
    analytics: [],
    quickAction: [],
    utility: [],
  };

  for (const s of SERVICE_REGISTRY) {
    if (!s.widgets) continue;
    for (const w of s.widgets) {
      if (w.type in result) result[w.type as WidgetType].push(w);
    }
  }

  return result;
}

/**
 * Returns all platform services that should be displayed in the sidebar.
 */
export function getSidebarServices(): PlatformServiceDefinition[] {
  return SERVICE_REGISTRY.filter((s) => s.showInSidebar);
}

/**
 * Returns all floating widgets from the platform services.
 */
export function getFloatingWidgets(): React.FC[] {
  return SERVICE_REGISTRY.flatMap((s) => s.floatingWidgets ?? []);
}
