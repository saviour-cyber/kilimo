import { Switch, Route, useLocation } from "wouter";
import ReportsDashboard from "./reports/ReportsDashboard";
import ReportWizard from "./reports/ReportWizard";
import ReportArchive from "./reports/ReportArchive";
import ScheduledReports from "./reports/ScheduledReports";

export default function ReportsPage() {
  const [location] = useLocation();

  // The base route is /reports
  // We'll map sub-routes internally

  return (
    <div className="flex flex-col h-full bg-muted overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        <Switch>
          <Route path="/reports" component={ReportsDashboard} />
          <Route path="/reports/wizard" component={ReportWizard} />
          <Route path="/reports/archive" component={ReportArchive} />
          <Route path="/reports/scheduled" component={ScheduledReports} />
          
          {/* Fallback to dashboard */}
          <Route path="/reports/:rest*">
            <ReportsDashboard />
          </Route>
        </Switch>
      </div>
    </div>
  );
}
