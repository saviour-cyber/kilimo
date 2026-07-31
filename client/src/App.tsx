import React from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { FarmProvider } from "./contexts/FarmContext";
import { KilimoLayout } from "./components/KilimoLayout";

// Auth
import Home from "./pages/Home";
import CreateFarm from "./pages/CreateFarm";
import AcceptInvite from "./pages/AcceptInvite";
import Register from "./pages/auth/Register";
import Login from "./pages/auth/Login";

// Core
import Dashboard from "./pages/Dashboard";
import Tasks from "./pages/Tasks";
import SettingsLayout from "./pages/settings/SettingsLayout";
import { SERVICE_REGISTRY } from "./lib/serviceRegistry";

// Crops
import Fields from "./pages/crops/Fields";
import Plantings from "./pages/crops/Plantings";
import Harvests from "./pages/crops/Harvests";
import Incidents from "./pages/crops/Incidents";
import CropCalendar from "./pages/crops/CropCalendar";
import CropAnalytics from "./pages/crops/CropAnalytics";

// Livestock
import Animals from "./pages/livestock/Animals";
import Breeding from "./pages/livestock/Breeding";
import HealthLogs from "./pages/livestock/HealthLogs";
import FeedRecords from "./pages/livestock/FeedRecords";
import Production from "./pages/livestock/Production";
import Mortality from "./pages/livestock/Mortality";

// Inventory
import InventoryItems from "./pages/inventory/InventoryItems";
import StockTransactions from "./pages/inventory/StockTransactions";
import Equipment from "./pages/inventory/Equipment";
import Suppliers from "./pages/inventory/Suppliers";

// Finance
import Transactions from "./pages/finance/Transactions";
import Budgets from "./pages/finance/Budgets";
import PLReport from "./pages/finance/PLReport";
import BudgetVsActual from "./pages/finance/BudgetVsActual";

// Disease Detection
import NewScanPage from "./pages/disease/NewScanPage";
import ScanHistoryPage from "./pages/disease/ScanHistoryPage";
import DiseaseReportsPage from "./pages/disease/DiseaseReportsPage";

// IoT Engine
import IoTPage from "./pages/IoTPage";

// Reports Hub
import ReportsPage from "./pages/ReportsPage";

function AppRoutes() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/create-farm" component={CreateFarm} />
      <Route path="/farms/new" component={CreateFarm} />
      <Route path="/accept-invite" component={AcceptInvite} />
      <Route path="/register" component={Register} />
      <Route path="/login" component={Login} />

      {/* Protected routes inside KilimoLayout */}
      <Route path="/dashboard">
        <KilimoLayout><Dashboard /></KilimoLayout>
      </Route>
      <Route path="/tasks">
        <KilimoLayout><Tasks /></KilimoLayout>
      </Route>
      <Route path="/settings">
        <KilimoLayout><SettingsLayout /></KilimoLayout>
      </Route>
      <Route path="/settings/*">
        <KilimoLayout><SettingsLayout /></KilimoLayout>
      </Route>

      {/* Dynamic Platform Services */}
      {SERVICE_REGISTRY.filter((s) => s.basePath && s.pageComponent).map((service) => {
        const Page = service.pageComponent!;
        return (
          <React.Fragment key={service.key}>
            <Route path={service.basePath}>
              <KilimoLayout><Page /></KilimoLayout>
            </Route>
            <Route path={`${service.basePath}/*`}>
              <KilimoLayout><Page /></KilimoLayout>
            </Route>
          </React.Fragment>
        );
      })}

      {/* Crops */}
      <Route path="/crops/fields">
        <KilimoLayout><Fields /></KilimoLayout>
      </Route>
      <Route path="/crops/plantings">
        <KilimoLayout><Plantings /></KilimoLayout>
      </Route>
      <Route path="/crops/harvests">
        <KilimoLayout><Harvests /></KilimoLayout>
      </Route>
      <Route path="/crops/incidents">
        <KilimoLayout><Incidents /></KilimoLayout>
      </Route>
      <Route path="/crops/calendar">
        <KilimoLayout><CropCalendar /></KilimoLayout>
      </Route>
      <Route path="/crops/analytics">
        <KilimoLayout><CropAnalytics /></KilimoLayout>
      </Route>

      {/* Livestock */}
      <Route path="/livestock/animals">
        <KilimoLayout><Animals /></KilimoLayout>
      </Route>
      <Route path="/livestock/breeding">
        <KilimoLayout><Breeding /></KilimoLayout>
      </Route>
      <Route path="/livestock/health">
        <KilimoLayout><HealthLogs /></KilimoLayout>
      </Route>
      <Route path="/livestock/feed">
        <KilimoLayout><FeedRecords /></KilimoLayout>
      </Route>
      <Route path="/livestock/production">
        <KilimoLayout><Production /></KilimoLayout>
      </Route>
      <Route path="/livestock/mortality">
        <KilimoLayout><Mortality /></KilimoLayout>
      </Route>

      {/* Inventory */}
      <Route path="/inventory/items">
        <KilimoLayout><InventoryItems /></KilimoLayout>
      </Route>
      <Route path="/inventory/transactions">
        <KilimoLayout><StockTransactions /></KilimoLayout>
      </Route>
      <Route path="/inventory/equipment">
        <KilimoLayout><Equipment /></KilimoLayout>
      </Route>
      <Route path="/inventory/suppliers">
        <KilimoLayout><Suppliers /></KilimoLayout>
      </Route>

      {/* Finance */}
      <Route path="/finance/transactions">
        <KilimoLayout><Transactions /></KilimoLayout>
      </Route>
      <Route path="/finance/budgets">
        <KilimoLayout><Budgets /></KilimoLayout>
      </Route>
      <Route path="/finance/report">
        <KilimoLayout><PLReport /></KilimoLayout>
      </Route>
      <Route path="/finance/budget-vs-actual">
        <KilimoLayout><BudgetVsActual /></KilimoLayout>
      </Route>

      {/* Disease Detection */}
      <Route path="/disease/scan">
        <KilimoLayout><NewScanPage /></KilimoLayout>
      </Route>
      <Route path="/disease/history">
        <KilimoLayout><ScanHistoryPage /></KilimoLayout>
      </Route>
      <Route path="/disease/reports">
        <KilimoLayout><DiseaseReportsPage /></KilimoLayout>
      </Route>
      <Route path="/disease">
        <KilimoLayout><NewScanPage /></KilimoLayout>
      </Route>

      {/* IoT Engine */}
      <Route path="/iot">
        <KilimoLayout><IoTPage /></KilimoLayout>
      </Route>
      <Route path="/iot/*">
        <KilimoLayout><IoTPage /></KilimoLayout>
      </Route>

      {/* Reports Hub */}
      <Route path="/reports">
        <KilimoLayout><ReportsPage /></KilimoLayout>
      </Route>
      <Route path="/reports/*">
        <KilimoLayout><ReportsPage /></KilimoLayout>
      </Route>

      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <FarmProvider>
            <Toaster richColors position="top-right" />
            <AppRoutes />
          </FarmProvider>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
