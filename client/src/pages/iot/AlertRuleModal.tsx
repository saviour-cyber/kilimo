import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { trpc } from "@/lib/trpc";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  farmId: number;
}

export default function AlertRuleModal({ open, onOpenChange, farmId }: Props) {
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [name, setName] = useState("");
  const [sensorType, setSensorType] = useState("soil_moisture");
  const [condition, setCondition] = useState<">" | "<" | "==">("<");
  const [threshold, setThreshold] = useState("20");
  const [severity, setSeverity] = useState<"info" | "warning" | "critical">("warning");
  const [actionType, setActionType] = useState<"notify" | "task" | "webhook" | "recommendation">("recommendation");
  const [webhookUrl, setWebhookUrl] = useState("");

  const createMutation = trpc.iot.createAlertRule.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [["iot", "getAlertRules"]] });
      toast.success("Alert rule created successfully");
      onOpenChange(false);
      setName("");
    },
    onError: (err) => {
      toast.error(err.message || "Failed to create rule");
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !threshold) return;

    setIsSubmitting(true);
    let msgTemplate = `{{sensor}} is {{value}}{{unit}}, which breached the threshold of ${threshold}.`;
    if (actionType === "recommendation") {
      msgTemplate = `AI Request: {{sensor}} is {{value}}{{unit}}, breaching threshold. Needs mitigation strategy.`;
    }

    createMutation.mutate({
      farmId,
      name,
      sensorType,
      condition,
      threshold: parseFloat(threshold),
      severity,
      actionType,
      webhookUrl: actionType === "webhook" ? webhookUrl : undefined,
      messageTemplate: msgTemplate,
    }, {
      onSettled: () => setIsSubmitting(false)
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create Alert Rule</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Rule Name</Label>
            <Input 
              placeholder="e.g. Low Soil Moisture Alert" 
              value={name} 
              onChange={e => setName(e.target.value)} 
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Sensor Type</Label>
              <Select value={sensorType} onValueChange={setSensorType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="soil_moisture">Soil Moisture</SelectItem>
                  <SelectItem value="soil_temperature">Soil Temperature</SelectItem>
                  <SelectItem value="air_temperature">Air Temperature</SelectItem>
                  <SelectItem value="tank_level">Water Tank Level</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Severity</Label>
              <Select value={severity} onValueChange={(v: any) => setSeverity(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Condition</Label>
              <Select value={condition} onValueChange={(v: any) => setCondition(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value=">">Greater than (&gt;)</SelectItem>
                  <SelectItem value="<">Less than (&lt;)</SelectItem>
                  <SelectItem value="==">Equals (==)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Threshold Value</Label>
              <Input 
                type="number" 
                step="0.1"
                value={threshold} 
                onChange={e => setThreshold(e.target.value)} 
                required
              />
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <Label>Action to Take</Label>
            <Select value={actionType} onValueChange={(v: any) => setActionType(v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="notify">Standard Notification</SelectItem>
                <SelectItem value="task">Create Task</SelectItem>
                <SelectItem value="recommendation">Request AI Recommendation</SelectItem>
                <SelectItem value="webhook">Trigger Webhook</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-slate-500 mt-1">
              {actionType === "recommendation" && "Kili AI will analyze the alert and generate a mitigation strategy automatically."}
              {actionType === "task" && "A task will be automatically created and assigned to you."}
              {actionType === "notify" && "A standard alert will be sent to your notifications."}
              {actionType === "webhook" && "A POST request with alert details will be sent to the webhook URL."}
            </p>
          </div>

          {actionType === "webhook" && (
            <div className="space-y-2 pt-2">
              <Label>Webhook URL</Label>
              <Input 
                placeholder="https://api.example.com/webhook" 
                value={webhookUrl} 
                onChange={e => setWebhookUrl(e.target.value)} 
                required
                type="url"
              />
            </div>
          )}

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Rule"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
