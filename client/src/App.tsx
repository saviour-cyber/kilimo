import React from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { FarmProvider } from "./contexts/FarmContext";
import { KilimoLayout } from "./components/KilimoLayout";
import { AdminLayout } from "./components/AdminLayout";
import AdminLogin from "./pages/admin/Login";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminOrganizations from "./pages/admin/Organizations";
import AdminUsers from "./pages/admin/Users";
import AdminModules from "./pages/admin/Modules";
import AdminServices from "./pages/admin/Services";
import AdminAiManagement from "./pages/admin/AiManagement";
import AdminIotManagement from "./pages/admin/IotManagement";
import AdminReports from "./pages/admin/Reports";
import AdminMonitoring from "./pages/admin/Monitoring";
import AdminAuditLogs from "./pages/admin/AuditLogs";
import AdminAnnouncements from "./pages/admin/Announcements";
import AdminSubscriptions from "./pages/admin/Subscriptions";
import AdminSupport from "./pages/admin/Support";
import AdminBilling from "./pages/admin/Billing";
import AdminSettings from "./pages/admin/Settings";
// Auth
import Home from "./pages/Home";
import CreateFarm from "./pages/CreateFarm";
import AcceptInvite from "./pages/AcceptInvite";
import Register from "./pages/auth/Register";
import Login from "./pages/auth/Login";
import VerifyEmail from "./pages/auth/VerifyEmail";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";

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

function TenantAppRoutes() {
  return (
    <FarmProvider>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/create-farm" component={CreateFarm} />
        <Route path="/farms/new" component={CreateFarm} />
        <Route path="/accept-invite" component={AcceptInvite} />
        <Route path="/register" component={Register} />
        <Route path="/login" component={Login} />
        <Route path="/verify-email" component={VerifyEmail} />
        <Route path="/forgot-password" component={ForgotPassword} />
        <Route path="/reset-password" component={ResetPassword} />

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
        <Route path="/crops/fields"><KilimoLayout><Fields /></KilimoLayout></Route>
        <Route path="/crops/plantings"><KilimoLayout><Plantings /></KilimoLayout></Route>
        <Route path="/crops/harvests"><KilimoLayout><Harvests /></KilimoLayout></Route>
        <Route path="/crops/incidents"><KilimoLayout><Incidents /></KilimoLayout></Route>
        <Route path="/crops/calendar"><KilimoLayout><CropCalendar /></KilimoLayout></Route>
        <Route path="/crops/analytics"><KilimoLayout><CropAnalytics /></KilimoLayout></Route>

        {/* Livestock */}
        <Route path="/livestock/animals"><KilimoLayout><Animals /></KilimoLayout></Route>
        <Route path="/livestock/breeding"><KilimoLayout><Breeding /></KilimoLayout></Route>
        <Route path="/livestock/health"><KilimoLayout><HealthLogs /></KilimoLayout></Route>
        <Route path="/livestock/feed"><KilimoLayout><FeedRecords /></KilimoLayout></Route>
        <Route path="/livestock/production"><KilimoLayout><Production /></KilimoLayout></Route>
        <Route path="/livestock/mortality"><KilimoLayout><Mortality /></KilimoLayout></Route>

        {/* Inventory */}
        <Route path="/inventory/items"><KilimoLayout><InventoryItems /></KilimoLayout></Route>
        <Route path="/inventory/transactions"><KilimoLayout><StockTransactions /></KilimoLayout></Route>
        <Route path="/inventory/equipment"><KilimoLayout><Equipment /></KilimoLayout></Route>
        <Route path="/inventory/suppliers"><KilimoLayout><Suppliers /></KilimoLayout></Route>

        {/* Finance */}
        <Route path="/finance/transactions"><KilimoLayout><Transactions /></KilimoLayout></Route>
        <Route path="/finance/budgets"><KilimoLayout><Budgets /></KilimoLayout></Route>
        <Route path="/finance/report"><KilimoLayout><PLReport /></KilimoLayout></Route>
        <Route path="/finance/budget-vs-actual"><KilimoLayout><BudgetVsActual /></KilimoLayout></Route>

        {/* Disease Detection */}
        <Route path="/disease/scan"><KilimoLayout><NewScanPage /></KilimoLayout></Route>
        <Route path="/disease/history"><KilimoLayout><ScanHistoryPage /></KilimoLayout></Route>
        <Route path="/disease/reports"><KilimoLayout><DiseaseReportsPage /></KilimoLayout></Route>
        <Route path="/disease"><KilimoLayout><NewScanPage /></KilimoLayout></Route>

        {/* IoT Engine */}
        <Route path="/iot"><KilimoLayout><IoTPage /></KilimoLayout></Route>
        <Route path="/iot/*"><KilimoLayout><IoTPage /></KilimoLayout></Route>

        {/* Reports Hub */}
        <Route path="/reports"><KilimoLayout><ReportsPage /></KilimoLayout></Route>
        <Route path="/reports/*"><KilimoLayout><ReportsPage /></KilimoLayout></Route>

        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </FarmProvider>
  );
}

function AdminAppRoutes() {
  // Admin routes are COMPLETELY outside FarmProvider.
  // No farm queries will ever fire for Platform Admins.
  return (
    <Switch>
      <Route path="/admin/login" component={AdminLogin} />
      <Route path="/admin">
        <AdminLayout><AdminDashboard /></AdminLayout>
      </Route>
      <Route path="/admin/dashboard">
        <AdminLayout><AdminDashboard /></AdminLayout>
      </Route>
      <Route path="/admin/organizations">
        <AdminLayout><AdminOrganizations /></AdminLayout>
      </Route>
      <Route path="/admin/users">
        <AdminLayout><AdminUsers /></AdminLayout>
      </Route>
      <Route path="/admin/modules">
        <AdminLayout><AdminModules /></AdminLayout>
      </Route>
      <Route path="/admin/services">
        <AdminLayout><AdminServices /></AdminLayout>
      </Route>
      <Route path="/admin/ai">
        <AdminLayout><AdminAiManagement /></AdminLayout>
      </Route>
      <Route path="/admin/monitoring">
        <AdminLayout><AdminMonitoring /></AdminLayout>
      </Route>
      <Route path="/admin/audit">
        <AdminLayout><AdminAuditLogs /></AdminLayout>
      </Route>
      <Route path="/admin/iot">
        <AdminLayout><AdminIotManagement /></AdminLayout>
      </Route>
      <Route path="/admin/reports">
        <AdminLayout><AdminReports /></AdminLayout>
      </Route>
      <Route path="/admin/announcements">
        <AdminLayout><AdminAnnouncements /></AdminLayout>
      </Route>
      <Route path="/admin/subscriptions">
        <AdminLayout><AdminSubscriptions /></AdminLayout>
      </Route>
      <Route path="/admin/support">
        <AdminLayout><AdminSupport /></AdminLayout>
      </Route>
      <Route path="/admin/billing">
        <AdminLayout><AdminBilling /></AdminLayout>
      </Route>
      <Route path="/admin/settings">
        <AdminLayout><AdminSettings /></AdminLayout>
      </Route>
      <Route>
        <AdminLayout>
          <div className="p-8">
            <h2 className="text-2xl font-bold text-slate-800">Page not found</h2>
            <p className="text-slate-500 mt-2">The requested administrative page does not exist or is under construction.</p>
          </div>
        </AdminLayout>
      </Route>
    </Switch>
  );
}

function AppRoutes() {
  const [location] = useLocation();
  // Route to the correct context based on the URL prefix.
  // Admin routes must never share a provider tree with tenant routes.
  if (location.startsWith("/admin")) {
    return <AdminAppRoutes />;
  }
  return <TenantAppRoutes />;
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster richColors position="top-right" />
          <AppRoutes />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
