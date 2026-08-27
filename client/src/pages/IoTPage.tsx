import { Switch, Route } from "wouter";
import IoTDashboard from "./iot/IoTDashboard";
import IoTDeviceManager from "./iot/IoTDeviceManager";
import IoTAlertRules from "./iot/IoTAlertRules";

export default function IoTPage() {
  return (
    <div className="flex flex-col h-full bg-muted overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        <Switch>
          <Route path="/iot" component={IoTDashboard} />
          <Route path="/iot/devices" component={IoTDeviceManager} />
          <Route path="/iot/rules" component={IoTAlertRules} />
          <Route path="/iot/:rest*">
            <IoTDashboard />
          </Route>
        </Switch>
      </div>
    </div>
  );
}
