import React from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { FarmProvider } from "./contexts/FarmContext";
import { KiliSenseLayout } from "./components/KiliSenseLayout";
import { SubscriptionGate } from "./components/SubscriptionGate";
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
import AdminEmailCenter from "./pages/admin/EmailCenter";
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

// Admin
import Subscriptions from "./pages/admin/Subscriptions";
import AdminMarketplace from "./pages/admin/Marketplace";

// Marketplace
import Browse from "./pages/marketplace/Browse";
import MyListings from "./pages/marketplace/MyListings";
import CreateListing from "./pages/marketplace/CreateListing";
import ListingDetail from "./pages/marketplace/ListingDetail";
import EditListing from "./pages/marketplace/EditListing";

// Crops
import Fields from "./pages/crops/Fields";
import Plantings from "./pages/crops/Plantings";
import Harvests from "./pages/crops/Harvests";
import Incidents from "./pages/crops/Incidents";
import CropCalendar from "./pages/crops/CropCalendar";
import CropAnalytics from "./pages/crops/CropAnalytics";
// Workers
import WorkersLayout from "./pages/workers/WorkersLayout";
import WorkersOverview from "./pages/workers/WorkersOverview";
import WorkersList from "./pages/workers/WorkersList";
import WorkersTeams from "./pages/workers/WorkersTeams";
import WorkersAttendance from "./pages/workers/WorkersAttendance";
import WorkersAssignments from "./pages/workers/WorkersAssignments";

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

        {/* Protected routes inside KiliSenseLayout */}
        <Route path="/dashboard">
          <KiliSenseLayout><Dashboard /></KiliSenseLayout>
        </Route>
        <Route path="/tasks">
          <KiliSenseLayout><Tasks /></KiliSenseLayout>
        </Route>
        <Route path="/settings">
          <KiliSenseLayout><SettingsLayout /></KiliSenseLayout>
        </Route>
        <Route path="/settings/*">
          <KiliSenseLayout><SettingsLayout /></KiliSenseLayout>
        </Route>

        {/* Dynamic Platform Services */}
        {SERVICE_REGISTRY.filter((s) => s.basePath && s.pageComponent).map((service) => {
          const Page = service.pageComponent!;
          return (
            <React.Fragment key={service.key}>
              <Route path={service.basePath}>
                <KiliSenseLayout>
                  <SubscriptionGate featureKey={service.key} featureName={(service as any).label || (service as any).name || service.key}>
                    <Page />
                  </SubscriptionGate>
                </KiliSenseLayout>
              </Route>
              <Route path={`${service.basePath}/*`}>
                <KiliSenseLayout>
                  <SubscriptionGate featureKey={service.key} featureName={(service as any).label || (service as any).name || service.key}>
                    <Page />
                  </SubscriptionGate>
                </KiliSenseLayout>
              </Route>
            </React.Fragment>
          );
        })}

        {/* Marketplace */}
        <Route path="/marketplace/browse"><KiliSenseLayout><SubscriptionGate featureKey="marketplace" featureName="Marketplace"><Browse /></SubscriptionGate></KiliSenseLayout></Route>
        <Route path="/marketplace/listings"><KiliSenseLayout><SubscriptionGate featureKey="marketplace" featureName="Marketplace"><MyListings /></SubscriptionGate></KiliSenseLayout></Route>
        <Route path="/marketplace/create"><KiliSenseLayout><SubscriptionGate featureKey="marketplace" featureName="Marketplace"><CreateListing /></SubscriptionGate></KiliSenseLayout></Route>
        <Route path="/marketplace/edit/:id"><KiliSenseLayout><SubscriptionGate featureKey="marketplace" featureName="Marketplace"><EditListing /></SubscriptionGate></KiliSenseLayout></Route>
        <Route path="/marketplace/listing/:id"><KiliSenseLayout><SubscriptionGate featureKey="marketplace" featureName="Marketplace"><ListingDetail /></SubscriptionGate></KiliSenseLayout></Route>

        {/* Crops */}
        <Route path="/crops/fields"><KiliSenseLayout><SubscriptionGate featureKey="crop" featureName="Crops"><Fields /></SubscriptionGate></KiliSenseLayout></Route>
        <Route path="/crops/plantings"><KiliSenseLayout><SubscriptionGate featureKey="crop" featureName="Crops"><Plantings /></SubscriptionGate></KiliSenseLayout></Route>
        <Route path="/crops/harvests"><KiliSenseLayout><SubscriptionGate featureKey="crop" featureName="Crops"><Harvests /></SubscriptionGate></KiliSenseLayout></Route>
        <Route path="/crops/incidents"><KiliSenseLayout><SubscriptionGate featureKey="crop" featureName="Crops"><Incidents /></SubscriptionGate></KiliSenseLayout></Route>
        <Route path="/crops/calendar"><KiliSenseLayout><SubscriptionGate featureKey="crop" featureName="Crops"><CropCalendar /></SubscriptionGate></KiliSenseLayout></Route>
        <Route path="/crops/analytics"><KiliSenseLayout><SubscriptionGate featureKey="crop" featureName="Crops"><CropAnalytics /></SubscriptionGate></KiliSenseLayout></Route>
        {/* Workers */}
        <Route path="/workers/overview"><KiliSenseLayout><SubscriptionGate featureKey="workers" featureName="Workers"><WorkersLayout><WorkersOverview /></WorkersLayout></SubscriptionGate></KiliSenseLayout></Route>
        <Route path="/workers/all"><KiliSenseLayout><SubscriptionGate featureKey="workers" featureName="Workers"><WorkersLayout><WorkersList /></WorkersLayout></SubscriptionGate></KiliSenseLayout></Route>
        <Route path="/workers/teams"><KiliSenseLayout><SubscriptionGate featureKey="workers" featureName="Workers"><WorkersLayout><WorkersTeams /></WorkersLayout></SubscriptionGate></KiliSenseLayout></Route>
        <Route path="/workers/attendance"><KiliSenseLayout><SubscriptionGate featureKey="workers" featureName="Workers"><WorkersLayout><WorkersAttendance /></WorkersLayout></SubscriptionGate></KiliSenseLayout></Route>
        <Route path="/workers/assignments"><KiliSenseLayout><SubscriptionGate featureKey="workers" featureName="Workers"><WorkersLayout><WorkersAssignments /></WorkersLayout></SubscriptionGate></KiliSenseLayout></Route>
        <Route path="/workers"><KiliSenseLayout><SubscriptionGate featureKey="workers" featureName="Workers"><WorkersLayout><WorkersOverview /></WorkersLayout></SubscriptionGate></KiliSenseLayout></Route>

        {/* Livestock */}
        <Route path="/livestock/animals"><KiliSenseLayout><SubscriptionGate featureKey="livestock" featureName="Livestock"><Animals /></SubscriptionGate></KiliSenseLayout></Route>
        <Route path="/livestock/breeding"><KiliSenseLayout><SubscriptionGate featureKey="livestock" featureName="Livestock"><Breeding /></SubscriptionGate></KiliSenseLayout></Route>
        <Route path="/livestock/health"><KiliSenseLayout><SubscriptionGate featureKey="livestock" featureName="Livestock"><HealthLogs /></SubscriptionGate></KiliSenseLayout></Route>
        <Route path="/livestock/feed"><KiliSenseLayout><SubscriptionGate featureKey="livestock" featureName="Livestock"><FeedRecords /></SubscriptionGate></KiliSenseLayout></Route>
        <Route path="/livestock/production"><KiliSenseLayout><SubscriptionGate featureKey="livestock" featureName="Livestock"><Production /></SubscriptionGate></KiliSenseLayout></Route>
        <Route path="/livestock/mortality"><KiliSenseLayout><SubscriptionGate featureKey="livestock" featureName="Livestock"><Mortality /></SubscriptionGate></KiliSenseLayout></Route>

        {/* Inventory */}
        <Route path="/inventory/items"><KiliSenseLayout><SubscriptionGate featureKey="inventory" featureName="Inventory"><InventoryItems /></SubscriptionGate></KiliSenseLayout></Route>
        <Route path="/inventory/transactions"><KiliSenseLayout><SubscriptionGate featureKey="inventory" featureName="Inventory"><StockTransactions /></SubscriptionGate></KiliSenseLayout></Route>
        <Route path="/inventory/equipment"><KiliSenseLayout><SubscriptionGate featureKey="inventory" featureName="Inventory"><Equipment /></SubscriptionGate></KiliSenseLayout></Route>
        <Route path="/inventory/suppliers"><KiliSenseLayout><SubscriptionGate featureKey="inventory" featureName="Inventory"><Suppliers /></SubscriptionGate></KiliSenseLayout></Route>

        {/* Finance */}
        <Route path="/finance/transactions"><KiliSenseLayout><SubscriptionGate featureKey="finance" featureName="Finance"><Transactions /></SubscriptionGate></KiliSenseLayout></Route>
        <Route path="/finance/budgets"><KiliSenseLayout><SubscriptionGate featureKey="finance" featureName="Finance"><Budgets /></SubscriptionGate></KiliSenseLayout></Route>
        <Route path="/finance/report"><KiliSenseLayout><SubscriptionGate featureKey="finance" featureName="Finance"><PLReport /></SubscriptionGate></KiliSenseLayout></Route>
        <Route path="/finance/budget-vs-actual"><KiliSenseLayout><SubscriptionGate featureKey="finance" featureName="Finance"><BudgetVsActual /></SubscriptionGate></KiliSenseLayout></Route>

        {/* Disease Detection */}
        <Route path="/disease/scan"><KiliSenseLayout><SubscriptionGate featureKey="disease" featureName="Disease Detection"><NewScanPage /></SubscriptionGate></KiliSenseLayout></Route>
        <Route path="/disease/history"><KiliSenseLayout><SubscriptionGate featureKey="disease" featureName="Disease Detection"><ScanHistoryPage /></SubscriptionGate></KiliSenseLayout></Route>
        <Route path="/disease/reports"><KiliSenseLayout><SubscriptionGate featureKey="disease" featureName="Disease Detection"><DiseaseReportsPage /></SubscriptionGate></KiliSenseLayout></Route>
        <Route path="/disease"><KiliSenseLayout><SubscriptionGate featureKey="disease" featureName="Disease Detection"><NewScanPage /></SubscriptionGate></KiliSenseLayout></Route>

        {/* IoT Engine */}
        <Route path="/iot"><KiliSenseLayout><SubscriptionGate featureKey="iot" featureName="IoT Monitoring"><IoTPage /></SubscriptionGate></KiliSenseLayout></Route>
        <Route path="/iot/*"><KiliSenseLayout><SubscriptionGate featureKey="iot" featureName="IoT Monitoring"><IoTPage /></SubscriptionGate></KiliSenseLayout></Route>

        {/* Reports Hub */}
        <Route path="/reports"><KiliSenseLayout><SubscriptionGate featureKey="reports" featureName="Reports Hub"><ReportsPage /></SubscriptionGate></KiliSenseLayout></Route>
        <Route path="/reports/*"><KiliSenseLayout><SubscriptionGate featureKey="reports" featureName="Reports Hub"><ReportsPage /></SubscriptionGate></KiliSenseLayout></Route>

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
      <Route path="/admin/email">
        <AdminLayout><AdminEmailCenter /></AdminLayout>
      </Route>
      <Route path="/admin/subscriptions"><AdminLayout><Subscriptions /></AdminLayout></Route>
      <Route path="/admin/marketplace"><AdminLayout><AdminMarketplace /></AdminLayout></Route>
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
            <h2 className="text-2xl font-bold text-foreground">Page not found</h2>
            <p className="text-muted-foreground mt-2">The requested administrative page does not exist or is under construction.</p>
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
