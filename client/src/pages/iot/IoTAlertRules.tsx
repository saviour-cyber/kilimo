import { useState } from "react";
import { Link } from "wouter";
import { Plus, Settings2, Bell, Zap, Bot, BrainCircuit, Trash2, ArrowLeft } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useFarm } from "@/contexts/FarmContext";
import AlertRuleModal from "./AlertRuleModal";

export default function IoTAlertRules() {
  const { currentFarm } = useFarm();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: rules = [], isLoading } = trpc.iot.getAlertRules.useQuery(
    { farmId: currentFarm?.farm.id! },
    { enabled: !!currentFarm }
  );

  const toggleMutation = trpc.iot.updateAlertRule.useMutation({
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [["iot", "getAlertRules"]] }),
  });

  const deleteMutation = trpc.iot.deleteAlertRule.useMutation({
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [["iot", "getAlertRules"]] }),
  });

  if (isLoading) {
    return <div className="p-8 animate-pulse flex space-x-4"><div className="flex-1 space-y-4 py-1"><div className="h-2 bg-slate-200 rounded"></div><div className="space-y-3"><div className="grid grid-cols-3 gap-4"><div className="h-2 bg-slate-200 rounded col-span-2"></div><div className="h-2 bg-slate-200 rounded col-span-1"></div></div><div className="h-2 bg-slate-200 rounded"></div></div></div></div>;
  }

  const getActionIcon = (type: string) => {
    switch (type) {
      case "notify": return <Bell className="w-4 h-4 text-blue-500" />;
      case "task": return <Zap className="w-4 h-4 text-amber-500" />;
      case "recommendation": return <BrainCircuit className="w-4 h-4 text-purple-500" />;
      default: return <Settings2 className="w-4 h-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/iot"><ArrowLeft className="w-5 h-5" /></Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold font-serif text-foreground">Alert Rules Engine</h1>
            <p className="text-muted-foreground text-sm mt-0.5">Configure automated workflows and AI recommendations based on live telemetry.</p>
          </div>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full">
          <Plus className="w-4 h-4" /> Create Rule
        </Button>
      </div>

      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
        {rules.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            <Bot className="w-12 h-12 mx-auto mb-4 text-slate-300" />
            <p>No alert rules configured for this farm.</p>
            <Button variant="outline" onClick={() => setIsModalOpen(true)} className="mt-4">
              Create your first rule
            </Button>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-muted border-b border-border text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                <th className="px-6 py-4">Rule Name</th>
                <th className="px-6 py-4">Condition</th>
                <th className="px-6 py-4">Action</th>
                <th className="px-6 py-4">Severity</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rules.map((rule) => (
                <tr key={rule.id} className="hover:bg-muted/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-foreground">{rule.name}</div>
                    <div className="text-xs text-muted-foreground">{rule.sensorType ? `All ${rule.sensorType} sensors` : "Specific sensor"}</div>
                  </td>
                  <td className="px-6 py-4">
                    <code className="bg-muted text-muted-foreground px-2 py-1 rounded text-xs font-mono">
                      Value {rule.condition} {rule.threshold}
                    </code>
                  </td>
                  <td className="px-6 py-4 flex items-center gap-2">
                    {getActionIcon(rule.actionType)}
                    <span className="text-sm font-medium text-muted-foreground capitalize">{rule.actionType}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize
                      ${rule.severity === 'critical' ? 'bg-red-100 text-red-700' :
                        rule.severity === 'warning' ? 'bg-amber-100 text-amber-700' :
                        'bg-sky-100 text-sky-700'}`}>
                      {rule.severity}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <Switch
                      checked={rule.enabled}
                      onCheckedChange={(checked) => toggleMutation.mutate({ id: rule.id, enabled: checked })}
                    />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Button variant="ghost" size="sm" onClick={() => deleteMutation.mutate({ id: rule.id })} className="text-red-500 hover:text-red-700 hover:bg-red-50">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <AlertRuleModal open={isModalOpen} onOpenChange={setIsModalOpen} farmId={currentFarm?.farm.id!} />
    </div>
  );
}
