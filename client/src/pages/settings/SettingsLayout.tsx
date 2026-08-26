import { useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { SettingsSidebar } from "./SettingsSidebar";
import { Settings } from "lucide-react";

import UserProfile from "./UserProfile";
import UserSecurity from "./UserSecurity";
import UserNotifications from "./UserNotifications";
import OrgProfile from "./OrgProfile";
import OrgFarms from "./OrgFarms";
import OrgTeam from "./OrgTeam";
import OrgBilling from "./OrgBilling";
import FarmProfile from "./FarmProfile";
import FarmModules from "./FarmModules";
import PlatformAbout from "./PlatformAbout";

// Specialized Placeholders for sections under construction
const FeaturePlaceholder = ({ title, description, icon: Icon }: { title: string, description: string, icon: any }) => (
  <div className="max-w-4xl space-y-6">
    <div>
      <h3 className="text-2xl font-medium text-slate-900 tracking-tight">{title}</h3>
      <p className="text-slate-500 mt-1">{description}</p>
    </div>
    
    <div className="h-[400px] flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50/50">
      <div className="w-16 h-16 rounded-2xl bg-white shadow-sm border border-slate-100 flex items-center justify-center mb-6">
        <Icon className="w-8 h-8 text-slate-400" />
      </div>
      <h4 className="text-base font-medium text-slate-900 mb-2">Coming Soon</h4>
      <p className="text-sm text-slate-500 max-w-sm text-center mb-6 leading-relaxed">
        We're actively building this feature to give you more control over your {title.toLowerCase()}.
      </p>
      <button disabled className="px-4 py-2 bg-slate-100 text-slate-400 font-medium rounded-lg text-sm cursor-not-allowed">
        Join Waitlist
      </button>
    </div>
  </div>
);

export default function SettingsLayout() {
  const [location, setLocation] = useLocation();

  // Redirect root /settings to /settings/user/profile
  useEffect(() => {
    // Depending on wouter version and route definition, location could be "/" or "/settings"
    if (location === "/" || location === "" || location === "/settings" || location === "/settings/") {
      setLocation("/settings/user/profile"); // absolute redirect
    }
  }, [location, setLocation]);

  // Determine which page to render based on route.
  // In wouter v3 nested routes, the base path (/settings) might be stripped, 
  // so we check both the absolute and relative paths.
  const [isUserProfile] = useRoute("/settings/user/profile");
  const [isUserSecurity] = useRoute("/settings/user/security");
  const [isUserNotifications] = useRoute("/settings/user/notifications");
  const [isOrgProfile] = useRoute("/settings/organization/profile");
  const [isOrgFarms] = useRoute("/settings/organization/farms");
  const [isOrgTeam] = useRoute("/settings/organization/team");
  const [isOrgBilling] = useRoute("/settings/organization/billing");
  const [isFarmProfile] = useRoute("/settings/farm/profile");
  const [isFarmModules] = useRoute("/settings/farm/modules");
  const [isFarmIot] = useRoute("/settings/farm/iot");
  const [isPlatformAbout] = useRoute("/settings/platform/about");

  // Fallback to relative paths in case the tilde operator isn't resolving as expected
  const [isUserProfileRel] = useRoute("/user/profile");
  const [isUserSecurityRel] = useRoute("/user/security");
  const [isUserNotificationsRel] = useRoute("/user/notifications");
  const [isOrgProfileRel] = useRoute("/organization/profile");
  const [isOrgFarmsRel] = useRoute("/organization/farms");
  const [isOrgTeamRel] = useRoute("/organization/team");
  const [isOrgBillingRel] = useRoute("/organization/billing");
  const [isFarmProfileRel] = useRoute("/farm/profile");
  const [isFarmModulesRel] = useRoute("/farm/modules");
  const [isFarmIotRel] = useRoute("/farm/iot");
  const [isPlatformAboutRel] = useRoute("/platform/about");

  let content = <FeaturePlaceholder title="Page Not Found" description="The page you're looking for doesn't exist." icon={Settings} />;
  if (isUserProfile || isUserProfileRel) content = <UserProfile />;
  if (isUserSecurity || isUserSecurityRel) content = <UserSecurity />;
  if (isUserNotifications || isUserNotificationsRel) content = <UserNotifications />;
  if (isOrgProfile || isOrgProfileRel) content = <OrgProfile />;
  if (isOrgFarms || isOrgFarmsRel) content = <OrgFarms />;
  if (isOrgTeam || isOrgTeamRel) content = <OrgTeam />;
  if (isOrgBilling || isOrgBillingRel) content = <OrgBilling />;
  if (isFarmProfile || isFarmProfileRel) content = <FarmProfile />;
  if (isFarmModules || isFarmModulesRel) content = <FarmModules />;
  if (isFarmIot || isFarmIotRel) content = <FeaturePlaceholder title="IoT Configuration" description="Connect and manage your sensors, gateways, and automated irrigation pumps." icon={Settings} />;
  if (isPlatformAbout || isPlatformAboutRel) content = <PlatformAbout />;

  return (
    <div className="min-h-full flex flex-col">
      <div className="border-b bg-card px-4 sm:px-8 py-5 shrink-0 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-3 max-w-[1400px] mx-auto">
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Settings className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground tracking-tight">Platform Settings</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Manage your profile, organization, and active farm</p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col md:flex-row max-w-[1400px] w-full mx-auto px-4 sm:px-8 py-8 gap-8 md:gap-12">
        <div className="hidden md:block">
          <SettingsSidebar />
        </div>
        <main className="flex-1 min-w-0">
          {content}
        </main>
      </div>
    </div>
  );
}
