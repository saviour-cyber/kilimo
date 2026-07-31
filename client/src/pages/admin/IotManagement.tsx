import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Map, Server, Activity, Wifi, WifiOff, Settings } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminIotManagement() {
  const { data: stats, isLoading } = trpc.admin.getIotStats.useQuery();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Server className="w-6 h-6 text-slate-700" />
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">IoT Network Global</h1>
        </div>
        <Button className="bg-sky-600 hover:bg-sky-700 text-white gap-2">
          <Settings className="w-4 h-4" /> Gateway Settings
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-sky-100 rounded-lg">
                <Server className="w-5 h-5 text-sky-600" />
              </div>
            </div>
            {isLoading ? <Skeleton className="h-9 w-20" /> : <p className="text-3xl font-bold text-slate-900">{stats?.gateways.total}</p>}
            <p className="text-sm text-slate-500 mt-1">Total Gateways</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <Wifi className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
            {isLoading ? <Skeleton className="h-9 w-20" /> : <p className="text-3xl font-bold text-slate-900">{stats?.devices.active}</p>}
            <p className="text-sm text-slate-500 mt-1">Active Sensors</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-rose-100 rounded-lg">
                <WifiOff className="w-5 h-5 text-rose-600" />
              </div>
            </div>
            {isLoading ? <Skeleton className="h-9 w-20" /> : <p className="text-3xl font-bold text-slate-900">{Number(stats?.devices.total) - Number(stats?.devices.active)}</p>}
            <p className="text-sm text-slate-500 mt-1">Offline Sensors</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <Activity className="w-5 h-5 text-indigo-600" />
              </div>
            </div>
            {isLoading ? <Skeleton className="h-9 w-20" /> : <p className="text-3xl font-bold text-slate-900">12.4M</p>}
            <p className="text-sm text-slate-500 mt-1">Events / Hour</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2 border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-slate-800 flex items-center gap-2">
                  <Map className="w-5 h-5 text-slate-500" />
                  Global Gateway Map
                </CardTitle>
                <CardDescription>Live deployment map across regions</CardDescription>
              </div>
            </div>
          </CardHeader>
          <div className="flex-1 bg-slate-100 relative min-h-[400px] flex items-center justify-center">
            {/* Minimal wireframe map visualization */}
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#94a3b8 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
            <div className="relative z-10 text-center">
              <Map className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 font-medium">Interactive Map Module Loading...</p>
              <p className="text-slate-400 text-sm mt-1">Connecting to geospatial services</p>
            </div>
            
            {/* Simulated Active Nodes */}
            <div className="absolute top-1/4 left-1/3 w-3 h-3 bg-emerald-500 rounded-full animate-ping shadow-[0_0_10px_rgba(16,185,129,0.8)]"></div>
            <div className="absolute top-1/2 left-2/3 w-3 h-3 bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.8)]"></div>
            <div className="absolute bottom-1/3 left-1/2 w-3 h-3 bg-rose-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(244,63,94,0.8)]"></div>
          </div>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-slate-800">Critical Alerts</CardTitle>
            <CardDescription>Gateways requiring attention</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-3 bg-rose-50 border border-rose-100 rounded-lg">
                <div className="flex justify-between items-start">
                  <span className="font-medium text-rose-900 text-sm">Gateway-NVR-14</span>
                  <Badge variant="outline" className="text-rose-600 border-rose-200 text-[10px]">OFFLINE</Badge>
                </div>
                <p className="text-xs text-rose-600 mt-1">Lost connection 4 hours ago. Region: Rift Valley.</p>
              </div>
              <div className="p-3 bg-amber-50 border border-amber-100 rounded-lg">
                <div className="flex justify-between items-start">
                  <span className="font-medium text-amber-900 text-sm">Gateway-MBA-02</span>
                  <Badge variant="outline" className="text-amber-600 border-amber-200 text-[10px]">LATENCY</Badge>
                </div>
                <p className="text-xs text-amber-600 mt-1">High packet loss detected in the last hour.</p>
              </div>
              <Button variant="outline" className="w-full text-slate-600 border-slate-200 mt-4">
                View All Alerts
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
