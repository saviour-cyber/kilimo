import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bell, Plus, RefreshCw, Trash2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { format } from "date-fns";
import { useState } from "react";
import { toast } from "sonner";

export default function AdminAnnouncements() {
  const utils = trpc.useContext();
  const { data: announcements, isLoading } = trpc.admin.listAnnouncements.useQuery();
  const createMutation = trpc.admin.createAnnouncement.useMutation();
  const toggleMutation = trpc.admin.toggleAnnouncement.useMutation();
  const deleteMutation = trpc.admin.deleteAnnouncement.useMutation();

  const [isOpen, setIsOpen] = useState(false);
  const [newAnn, setNewAnn] = useState({ title: "", content: "", type: "info" as "info" | "warning" | "critical" });

  const handleCreate = async () => {
    try {
      await createMutation.mutateAsync(newAnn);
      toast.success("Announcement published globally.");
      setIsOpen(false);
      setNewAnn({ title: "", content: "", type: "info" });
      utils.admin.listAnnouncements.invalidate();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleToggle = async (id: string, isActive: boolean) => {
    try {
      await toggleMutation.mutateAsync({ id, isActive });
      toast.success(isActive ? "Announcement activated" : "Announcement hidden");
      utils.admin.listAnnouncements.invalidate();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Permanently delete this announcement?")) return;
    try {
      await deleteMutation.mutateAsync({ id });
      toast.success("Announcement deleted.");
      utils.admin.listAnnouncements.invalidate();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const getBadgeColor = (type: string) => {
    switch(type) {
      case 'info': return 'bg-sky-100 text-sky-700 hover:bg-sky-100';
      case 'warning': return 'bg-amber-100 text-amber-700 hover:bg-amber-100';
      case 'critical': return 'bg-rose-100 text-rose-700 hover:bg-rose-100';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Bell className="w-6 h-6 text-muted-foreground" />
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Platform Announcements</h1>
        </div>
        
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="bg-background hover:bg-accent text-white gap-2">
              <Plus className="w-4 h-4" /> New Announcement
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Publish Global Announcement</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Title</label>
                <Input value={newAnn.title} onChange={e => setNewAnn({...newAnn, title: e.target.value})} placeholder="e.g. Scheduled Maintenance" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Type</label>
                <Select value={newAnn.type} onValueChange={(val: any) => setNewAnn({...newAnn, type: val})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="info">Info (Blue)</SelectItem>
                    <SelectItem value="warning">Warning (Yellow)</SelectItem>
                    <SelectItem value="critical">Critical (Red)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Content</label>
                <Textarea value={newAnn.content} onChange={e => setNewAnn({...newAnn, content: e.target.value})} placeholder="Message content to display to all users..." className="h-24" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
              <Button onClick={handleCreate} disabled={!newAnn.title || !newAnn.content || createMutation.isPending}>
                {createMutation.isPending && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />}
                Publish
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-border shadow-sm">
        <CardHeader>
          <CardTitle className="text-foreground">Broadcast History</CardTitle>
          <CardDescription>Manage active banners displayed across the user platform.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[300px]">Announcement</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Date Published</TableHead>
                <TableHead className="text-right">Visibility</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Loading...</TableCell>
                </TableRow>
              ) : announcements?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No announcements found.</TableCell>
                </TableRow>
              ) : (
                announcements?.map((ann) => (
                  <TableRow key={ann.id}>
                    <TableCell>
                      <div className="font-semibold text-foreground">{ann.title}</div>
                      <div className="text-xs text-muted-foreground mt-1 line-clamp-1">{ann.content}</div>
                    </TableCell>
                    <TableCell>
                      <Badge className={`${getBadgeColor(ann.type)} border-none capitalize`}>{ann.type}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {format(new Date(ann.createdAt), "MMM d, yyyy h:mm a")}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end">
                        <Switch 
                          checked={ann.isActive} 
                          onCheckedChange={(checked) => handleToggle(ann.id, checked)}
                          disabled={toggleMutation.isPending}
                        />
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                        onClick={() => handleDelete(ann.id)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
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
