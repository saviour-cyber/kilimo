import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { BarChart2, Download, FileText, TrendingUp, Users } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

export default function AdminReports() {
  const { data: analytics, isLoading } = trpc.admin.getPlatformAnalytics.useQuery();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <BarChart2 className="w-6 h-6 text-slate-700" />
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Platform Analytics</h1>
        </div>
        <Button className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2">
          <Download className="w-4 h-4" /> Export Raw Data
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <FileText className="w-5 h-5 text-indigo-600" />
              </div>
            </div>
            {isLoading ? <Skeleton className="h-9 w-20" /> : <p className="text-3xl font-bold text-slate-900">{analytics?.totalReportsGenerated}</p>}
            <p className="text-sm text-slate-500 mt-1">Total Reports Generated (All Time)</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
            <p className="text-3xl font-bold text-slate-900">+24%</p>
            <p className="text-sm text-slate-500 mt-1">Report Usage Growth (MoM)</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-sky-100 rounded-lg">
                <Users className="w-5 h-5 text-sky-600" />
              </div>
            </div>
            <p className="text-3xl font-bold text-slate-900">8,204</p>
            <p className="text-sm text-slate-500 mt-1">Unique Farms Generating Data</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-slate-800">Recent Global Report Generation</CardTitle>
          <CardDescription>Log of the most recent PDF/CSV exports executed by platform users.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Report ID</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Timestamp</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-8">
                    <Skeleton className="h-4 w-40 mx-auto" />
                  </TableCell>
                </TableRow>
              ) : analytics?.recentReports?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-8 text-slate-500">
                    No reports generated yet.
                  </TableCell>
                </TableRow>
              ) : (
                analytics?.recentReports?.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell className="font-mono text-sm text-slate-600">#{report.id}</TableCell>
                    <TableCell>
                      <div className="font-medium text-slate-800 capitalize">{report.type.replace(/_/g, ' ')}</div>
                    </TableCell>
                    <TableCell className="text-slate-500 text-sm">
                      {format(new Date(report.createdAt!), "MMM d, yyyy h:mm a")}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
