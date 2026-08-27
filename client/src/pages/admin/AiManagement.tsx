import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { BrainCircuit, Settings, Sparkles, TrendingUp, AlertTriangle } from "lucide-react";

export default function AdminAiManagement() {
  // Static configuration since these are platform-wide AI models
  const models = [
    {
      id: "gpt-4o",
      name: "GPT-4o (OpenAI)",
      description: "Primary model for complex reasoning and disease detection analysis.",
      status: "Active",
      usage: 78,
      limit: "100k req/mo",
    },
    {
      id: "claude-3-5",
      name: "Claude 3.5 Sonnet (Anthropic)",
      description: "Fallback model for crop reporting and large context processing.",
      status: "Active",
      usage: 42,
      limit: "50k req/mo",
    },
    {
      id: "dall-e-3",
      name: "DALL-E 3 (OpenAI)",
      description: "Generates farm layout diagrams and report cover images.",
      status: "Disabled",
      usage: 0,
      limit: "5k req/mo",
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <BrainCircuit className="w-6 h-6 text-slate-700" />
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">AI Management</h1>
        </div>
        <Button className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
          <Settings className="w-4 h-4" /> Global Settings
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <Sparkles className="w-5 h-5 text-indigo-600" />
              </div>
            </div>
            <p className="text-3xl font-bold text-slate-900">1.2M</p>
            <p className="text-sm text-muted-foreground mt-1">Tokens Processed Today</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
            <p className="text-3xl font-bold text-slate-900">4,285</p>
            <p className="text-sm text-muted-foreground mt-1">AI Requests Today</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-amber-100 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>
            </div>
            <p className="text-3xl font-bold text-slate-900">0.05s</p>
            <p className="text-sm text-muted-foreground mt-1">Avg Response Latency</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-slate-800">Connected AI Models</CardTitle>
          <CardDescription>Configure which foundation models power the platform features.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[300px]">Model</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[200px]">Usage Quota</TableHead>
                <TableHead className="text-right">Global Toggle</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {models.map((model) => (
                <TableRow key={model.id}>
                  <TableCell>
                    <div className="font-semibold text-slate-800">{model.name}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{model.description}</div>
                  </TableCell>
                  <TableCell>
                    {model.status === "Active" ? (
                      <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none">Active</Badge>
                    ) : (
                      <Badge className="bg-slate-100 text-muted-foreground hover:bg-slate-100 border-none">Disabled</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
                        <span>{model.usage}%</span>
                        <span className="text-muted-foreground">{model.limit}</span>
                      </div>
                      <Progress value={model.usage} className="h-1.5" />
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Switch 
                      checked={model.status === "Active"}
                      className="data-[state=checked]:bg-indigo-500"
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
