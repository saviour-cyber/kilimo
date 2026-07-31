import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Building2, 
  Users, 
  Sprout, 
  Server, 
  Sparkles, 
  Activity, 
  Banknote, 
  HardDrive 
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

// Mock chart data
const growthData = [
  { name: 'Jan', users: 4000, revenue: 2400000 },
  { name: 'Feb', users: 5000, revenue: 2600000 },
  { name: 'Mar', users: 6500, revenue: 3100000 },
  { name: 'Apr', users: 9000, revenue: 3800000 },
  { name: 'May', users: 12000, revenue: 4500000 },
  { name: 'Jun', users: 18542, revenue: 5200000 },
];

export default function AdminDashboard() {
  const { data: stats, isLoading } = trpc.admin.getPlatformStats.useQuery();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-xl" />
        ))}
      </div>
    );
  }

  const kpis = [
    { title: "Organizations", value: stats?.totalOrganizations?.toLocaleString() || "0", icon: Building2, color: "text-blue-600", bg: "bg-blue-100" },
    { title: "Active Farms", value: stats?.activeFarms?.toLocaleString() || "0", icon: Sprout, color: "text-emerald-600", bg: "bg-emerald-100" },
    { title: "Total Users", value: stats?.totalUsers?.toLocaleString() || "0", icon: Users, color: "text-purple-600", bg: "bg-purple-100" },
    { title: "Monthly Revenue", value: `KES ${stats?.monthlyRevenue?.toLocaleString() || "0"}`, icon: Banknote, color: "text-amber-600", bg: "bg-amber-100" },
    { title: "API Requests Today", value: (stats?.apiRequestsToday! / 1000000).toFixed(1) + "M", icon: Activity, color: "text-rose-600", bg: "bg-rose-100" },
    { title: "Online Devices", value: stats?.onlineDevices?.toLocaleString() || "0", icon: Server, color: "text-cyan-600", bg: "bg-cyan-100" },
    { title: "AI Requests Today", value: stats?.aiRequestsToday?.toLocaleString() || "0", icon: Sparkles, color: "text-indigo-600", bg: "bg-indigo-100" },
    { title: "Storage Used", value: stats?.storageUsedTb + " TB", icon: HardDrive, color: "text-slate-600", bg: "bg-slate-100" },
  ];

  return (
    <div className="space-y-8">
      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi, i) => (
          <Card key={i} className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">
                {kpi.title}
              </CardTitle>
              <div className={`w-10 h-10 rounded-xl ${kpi.bg} flex items-center justify-center`}>
                <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-800">{kpi.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-slate-700">Platform User Growth</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={growthData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} />
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Area type="monotone" dataKey="users" stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#colorUsers)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-slate-700">Monthly Revenue (KES)</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={growthData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} 
                  tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
                />
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <RechartsTooltip 
                  formatter={(value: number) => new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(value)}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} 
                />
                <Area type="monotone" dataKey="revenue" stroke="#3B82F6" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
