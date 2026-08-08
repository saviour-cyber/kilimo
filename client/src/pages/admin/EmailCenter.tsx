import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Mail, CheckCircle2, AlertCircle, RefreshCw, Send, Users } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

export default function EmailCenter() {
  const utils = trpc.useContext();
  
  // Queries
  const { data: logs, isLoading: isLogsLoading } = trpc.admin.getPlatformEmailLogs.useQuery();
  const { data: recipients, isLoading: isRecipientsLoading } = trpc.admin.getEmailRecipients.useQuery();
  
  // Mutations
  const sendEmailMutation = trpc.admin.sendPlatformEmail.useMutation();

  // State
  const [activeTab, setActiveTab] = useState("compose");
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [formData, setFormData] = useState({
    recipientGroup: "", // 'all_users', 'all_farms', or specific IDs
    templateKey: "platform_announcement" as "platform_announcement" | "payment_reminder" | "security_alert" | "custom",
    subject: "",
    message: "",
    callToActionUrl: "",
    callToActionLabel: "",
  });

  const getRecipientIds = () => {
    if (!recipients) return [];
    if (formData.recipientGroup === "all_users") return recipients.users.map(u => u.id);
    if (formData.recipientGroup === "all_farms") return Array.from(new Set(recipients.farms.map(f => f.ownerId)));
    // Add specific targeting if needed
    return [];
  };

  const handleSend = async () => {
    const ids = getRecipientIds();
    if (ids.length === 0) {
      toast.error("No recipients selected.");
      setIsConfirmOpen(false);
      return;
    }

    try {
      const result = await sendEmailMutation.mutateAsync({
        recipientIds: ids,
        subject: formData.subject,
        message: formData.message,
        templateKey: formData.templateKey,
        callToActionUrl: formData.callToActionUrl,
        callToActionLabel: formData.callToActionLabel,
      });

      toast.success(`Sent ${result.sentCount} emails (${result.failedCount} failed)`);
      setIsConfirmOpen(false);
      setFormData({
        ...formData,
        subject: "",
        message: "",
      });
      setActiveTab("history");
      utils.admin.getPlatformEmailLogs.invalidate();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'sent': return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none"><CheckCircle2 className="w-3 h-3 mr-1" /> Sent</Badge>;
      case 'failed': return <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-100 border-none"><AlertCircle className="w-3 h-3 mr-1" /> Failed</Badge>;
      case 'queued': return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-none">Queued</Badge>;
      default: return <Badge variant="outline" className="capitalize">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Mail className="w-6 h-6 text-slate-700" />
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Email Center</h1>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="compose" className="gap-2"><Send className="w-4 h-4" /> Compose</TabsTrigger>
          <TabsTrigger value="history" className="gap-2"><RefreshCw className="w-4 h-4" /> History</TabsTrigger>
        </TabsList>

        {/* Compose Tab */}
        <TabsContent value="compose">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle>Send Mass Email</CardTitle>
              <CardDescription>Dispatch announcements, reminders, or security alerts to your users.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Target Audience</label>
                  <Select value={formData.recipientGroup} onValueChange={(val) => setFormData({...formData, recipientGroup: val})}>
                    <SelectTrigger><SelectValue placeholder="Select audience..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all_users">All Registered Users ({recipients?.users?.length || 0})</SelectItem>
                      <SelectItem value="all_farms">All Farm Owners ({new Set(recipients?.farms?.map(f => f.ownerId)).size || 0})</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Template</label>
                  <Select value={formData.templateKey} onValueChange={(val: any) => setFormData({...formData, templateKey: val})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="platform_announcement">Platform Announcement</SelectItem>
                      <SelectItem value="security_alert">Security Alert</SelectItem>
                      <SelectItem value="custom">Custom HTML</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Subject</label>
                <Input value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})} placeholder="Email Subject" />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Message Body</label>
                <Textarea 
                  value={formData.message} 
                  onChange={e => setFormData({...formData, message: e.target.value})} 
                  placeholder="Type your message here..." 
                  className="h-40" 
                />
              </div>

              {formData.templateKey === 'platform_announcement' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Call to Action Label (Optional)</label>
                    <Input value={formData.callToActionLabel} onChange={e => setFormData({...formData, callToActionLabel: e.target.value})} placeholder="e.g. View Dashboard" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Call to Action URL (Optional)</label>
                    <Input value={formData.callToActionUrl} onChange={e => setFormData({...formData, callToActionUrl: e.target.value})} placeholder="https://..." />
                  </div>
                </div>
              )}

              <div className="pt-4 flex justify-end">
                <Button 
                  onClick={() => setIsConfirmOpen(true)}
                  disabled={!formData.recipientGroup || !formData.subject || !formData.message}
                  className="bg-primary hover:bg-primary/90"
                >
                  <Send className="w-4 h-4 mr-2" /> Prepare Email
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle>Email Delivery Logs</CardTitle>
              <CardDescription>Track the status of all sent emails.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Recipient</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Template</TableHead>
                    <TableHead>Date Sent</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLogsLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-slate-500">Loading...</TableCell>
                    </TableRow>
                  ) : logs?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-slate-500">No email logs found.</TableCell>
                    </TableRow>
                  ) : (
                    logs?.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="font-medium">{log.recipient}</TableCell>
                        <TableCell className="text-slate-600 line-clamp-1 max-w-[250px]">{log.subject}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs bg-slate-50 text-slate-600 font-normal capitalize">
                            {log.templateKey.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-slate-500 text-sm">
                          {format(new Date(log.sentAt), "MMM d, yyyy h:mm a")}
                        </TableCell>
                        <TableCell className="text-right">
                          {getStatusBadge(log.status)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Confirmation Dialog */}
      <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Mass Send</DialogTitle>
            <DialogDescription>
              You are about to send an email to {getRecipientIds().length} recipients. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="bg-slate-50 p-4 rounded-md border border-slate-100 text-sm space-y-2">
              <div className="flex"><strong className="w-24 text-slate-700">Audience:</strong> <span>{formData.recipientGroup.replace('_', ' ').toUpperCase()}</span></div>
              <div className="flex"><strong className="w-24 text-slate-700">Subject:</strong> <span>{formData.subject}</span></div>
              <div className="flex"><strong className="w-24 text-slate-700">Template:</strong> <span>{formData.templateKey.replace('_', ' ')}</span></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConfirmOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleSend} 
              disabled={sendEmailMutation.isPending}
            >
              {sendEmailMutation.isPending && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />}
              Yes, Send Now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
