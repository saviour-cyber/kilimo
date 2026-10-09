import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Headset,
  MessageSquare,
  Search,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  Phone,
  Mail,
  Send,
  User,
  Building,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface SupportTicket {
  id: string;
  ticketNumber: string;
  farmerName: string;
  organization: string;
  email: string;
  phone: string;
  subject: string;
  description: string;
  category: "IoT Sensors" | "Livestock/Dairy" | "Billing" | "Crop Advisory" | "Account";
  priority: "low" | "medium" | "high" | "urgent";
  status: "open" | "in_progress" | "resolved";
  channel: "WhatsApp" | "Email" | "Field Hotline" | "Web Portal";
  createdAt: string;
  responses: { sender: string; message: string; timestamp: string }[];
}

const INITIAL_TICKETS: SupportTicket[] = [
  {
    id: "t-101",
    ticketNumber: "KS-8901",
    farmerName: "Peter Kariuki",
    organization: "Nyeri Central Dairy Cooperative",
    email: "pkariuki@nyeridairy.co.ke",
    phone: "+254 712 345 678",
    subject: "Soil Moisture Sensor offline in Greenhouse 2",
    description: "The LoRaWAN telemetry gateway stopped transmitting moisture readings since 6:00 AM this morning.",
    category: "IoT Sensors",
    priority: "high",
    status: "open",
    channel: "WhatsApp",
    createdAt: new Date(Date.now() - 3600 * 1000 * 2).toISOString(),
    responses: [
      {
        sender: "Peter Kariuki",
        message: "Gateway power LED is blinking amber instead of steady green.",
        timestamp: new Date(Date.now() - 3600 * 1000 * 2).toISOString(),
      },
    ],
  },
  {
    id: "t-102",
    ticketNumber: "KS-8902",
    farmerName: "Grace Wanjiku",
    organization: "Aberdare Highlands Farm",
    email: "grace@aberdarehighlands.com",
    phone: "+254 722 890 123",
    subject: "M-Pesa payment confirmation for Pro Plan renewal",
    description: "Paid KSh 4,500 via Till number for Pro Plan renewal, transaction code QK8920194. Account still shows pending.",
    category: "Billing",
    priority: "urgent",
    status: "in_progress",
    channel: "Web Portal",
    createdAt: new Date(Date.now() - 3600 * 1000 * 5).toISOString(),
    responses: [
      {
        sender: "Grace Wanjiku",
        message: "Attached confirmation message from Safaricom M-Pesa.",
        timestamp: new Date(Date.now() - 3600 * 1000 * 5).toISOString(),
      },
      {
        sender: "Support Agent (KiliSense)",
        message: "Hello Grace, we have received the transaction code and are verifying with Safaricom Daraja settlement.",
        timestamp: new Date(Date.now() - 3600 * 1000 * 3).toISOString(),
      },
    ],
  },
  {
    id: "t-103",
    ticketNumber: "KS-8903",
    farmerName: "Mwangi Nderitu",
    organization: "Kieni West Farmers Hub",
    email: "mwanginderitu@gmail.com",
    phone: "+254 733 456 789",
    subject: "Cow heat cycle alert verification inquiry",
    description: "Received AI heat detection alert for animal #TAG-412. Requested veterinary review confirmation.",
    category: "Livestock/Dairy",
    priority: "medium",
    status: "resolved",
    channel: "Email",
    createdAt: new Date(Date.now() - 3600 * 1000 * 24).toISOString(),
    responses: [
      {
        sender: "Mwangi Nderitu",
        message: "Alert received at 04:30 AM with 94% activity confidence.",
        timestamp: new Date(Date.now() - 3600 * 1000 * 24).toISOString(),
      },
      {
        sender: "Support Agent (KiliSense)",
        message: "Verified with the Animal Core heuristic model. Insemination window recommended between 14:00 and 18:00 today.",
        timestamp: new Date(Date.now() - 3600 * 1000 * 20).toISOString(),
      },
    ],
  },
  {
    id: "t-104",
    ticketNumber: "KS-8904",
    farmerName: "Lucy Muthoni",
    organization: "Muthoni Organic Orchard",
    email: "lucy@muthoniorganics.co.ke",
    phone: "+254 720 112 233",
    subject: "Crop disease image scanning model error",
    description: "Uploading avocado leaf image returned unrecognized blight warning. Please inspect model sensitivity.",
    category: "Crop Advisory",
    priority: "low",
    status: "open",
    channel: "Field Hotline",
    createdAt: new Date(Date.now() - 3600 * 1000 * 12).toISOString(),
    responses: [
      {
        sender: "Lucy Muthoni",
        message: "Took photo in direct sunlight, leaf showed early anthracnose symptoms.",
        timestamp: new Date(Date.now() - 3600 * 1000 * 12).toISOString(),
      },
    ],
  },
];

export default function Support() {
  const [tickets, setTickets] = useState<SupportTicket[]>(INITIAL_TICKETS);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [replyMessage, setReplyMessage] = useState("");
  const [isNewTicketOpen, setIsNewTicketOpen] = useState(false);

  // New ticket state
  const [newFarmer, setNewFarmer] = useState("");
  const [newOrg, setNewOrg] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newSubject, setNewSubject] = useState("");
  const [newCategory, setNewCategory] = useState<SupportTicket["category"]>("IoT Sensors");
  const [newPriority, setNewPriority] = useState<SupportTicket["priority"]>("medium");
  const [newChannel, setNewChannel] = useState<SupportTicket["channel"]>("WhatsApp");
  const [newDescription, setNewDescription] = useState("");

  const filteredTickets = tickets.filter((t) => {
    const matchesStatus = filterStatus === "all" || t.status === filterStatus;
    const matchesQuery =
      t.ticketNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.farmerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.organization.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesQuery;
  });

  const openCount = tickets.filter((t) => t.status === "open").length;
  const inProgressCount = tickets.filter((t) => t.status === "in_progress").length;
  const resolvedCount = tickets.filter((t) => t.status === "resolved").length;

  const handleSendReply = () => {
    if (!selectedTicket || !replyMessage.trim()) return;

    const updated = tickets.map((t) => {
      if (t.id === selectedTicket.id) {
        return {
          ...t,
          status: "in_progress" as const,
          responses: [
            ...t.responses,
            {
              sender: "Support Agent (KiliSense Admin)",
              message: replyMessage.trim(),
              timestamp: new Date().toISOString(),
            },
          ],
        };
      }
      return t;
    });

    setTickets(updated);
    setSelectedTicket(updated.find((t) => t.id === selectedTicket.id) || null);
    setReplyMessage("");
    toast.success("Reply dispatched to customer.");
  };

  const handleStatusChange = (status: SupportTicket["status"]) => {
    if (!selectedTicket) return;
    const updated = tickets.map((t) =>
      t.id === selectedTicket.id ? { ...t, status } : t
    );
    setTickets(updated);
    setSelectedTicket(updated.find((t) => t.id === selectedTicket.id) || null);
    toast.success(`Ticket status updated to ${status.replace("_", " ")}.`);
  };

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFarmer || !newSubject || !newDescription) {
      toast.error("Please fill in all required fields.");
      return;
    }

    const ticketNumber = `KS-${Math.floor(1000 + Math.random() * 9000)}`;
    const newTicket: SupportTicket = {
      id: `t-${Date.now()}`,
      ticketNumber,
      farmerName: newFarmer,
      organization: newOrg || "Individual Farmer",
      phone: newPhone || "+254 700 000 000",
      email: newEmail || "farmer@kilisense.com",
      subject: newSubject,
      description: newDescription,
      category: newCategory,
      priority: newPriority,
      status: "open",
      channel: newChannel,
      createdAt: new Date().toISOString(),
      responses: [
        {
          sender: newFarmer,
          message: newDescription,
          timestamp: new Date().toISOString(),
        },
      ],
    };

    setTickets([newTicket, ...tickets]);
    setIsNewTicketOpen(false);
    setNewFarmer("");
    setNewOrg("");
    setNewPhone("");
    setNewEmail("");
    setNewSubject("");
    setNewDescription("");
    toast.success(`Ticket ${ticketNumber} created successfully.`);
  };

  const getPriorityBadge = (p: SupportTicket["priority"]) => {
    switch (p) {
      case "urgent":
        return <Badge className="bg-red-500/15 text-red-600 border-none font-semibold">Urgent</Badge>;
      case "high":
        return <Badge className="bg-orange-500/15 text-orange-600 border-none font-semibold">High</Badge>;
      case "medium":
        return <Badge className="bg-amber-500/15 text-amber-600 border-none font-semibold">Medium</Badge>;
      case "low":
        return <Badge className="bg-emerald-500/15 text-emerald-600 border-none font-semibold">Low</Badge>;
    }
  };

  const getStatusBadge = (s: SupportTicket["status"]) => {
    switch (s) {
      case "open":
        return (
          <Badge className="bg-amber-500/15 text-amber-600 border-none flex items-center gap-1 w-fit">
            <Clock className="w-3 h-3" /> Open
          </Badge>
        );
      case "in_progress":
        return (
          <Badge className="bg-blue-500/15 text-blue-600 border-none flex items-center gap-1 w-fit">
            <AlertCircle className="w-3 h-3" /> In Progress
          </Badge>
        );
      case "resolved":
        return (
          <Badge className="bg-emerald-500/15 text-emerald-600 border-none flex items-center gap-1 w-fit">
            <CheckCircle2 className="w-3 h-3" /> Resolved
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Support Center</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage farmer support tickets, inquiries, and customer helpdesk for KiliSense.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={() => setIsNewTicketOpen(true)}
            className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
          >
            <Plus className="w-4 h-4" /> New Ticket
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-border shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Total Tickets</span>
              <MessageSquare className="w-4 h-4 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold text-foreground mt-2">{tickets.length}</p>
            <p className="text-xs text-muted-foreground mt-1">All recorded inquiries</p>
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-amber-600">Open Tickets</span>
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
            <p className="text-2xl font-bold text-amber-600 mt-2">{openCount}</p>
            <p className="text-xs text-muted-foreground mt-1">Requires initial response</p>
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-blue-600">In Progress</span>
              <AlertCircle className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-blue-600 mt-2">{inProgressCount}</p>
            <p className="text-xs text-muted-foreground mt-1">Currently being handled</p>
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-emerald-600">Resolved</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-2xl font-bold text-emerald-600 mt-2">{resolvedCount}</p>
            <p className="text-xs text-muted-foreground mt-1">Closed successfully</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Support Hub */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Ticket List & Management */}
        <div className="lg:col-span-3 space-y-4">
          <Card className="border-border shadow-sm">
            <CardHeader className="p-4 border-b border-border/50">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <Tabs value={filterStatus} onValueChange={setFilterStatus} className="w-full sm:w-auto">
                  <TabsList>
                    <TabsTrigger value="all">All ({tickets.length})</TabsTrigger>
                    <TabsTrigger value="open">Open ({openCount})</TabsTrigger>
                    <TabsTrigger value="in_progress">In Progress ({inProgressCount})</TabsTrigger>
                    <TabsTrigger value="resolved">Resolved ({resolvedCount})</TabsTrigger>
                  </TabsList>
                </Tabs>

                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search tickets..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 h-9 text-sm"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ticket ID</TableHead>
                    <TableHead>Farmer / Org</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Channel</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTickets.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        No support tickets found matching your filter.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredTickets.map((ticket) => (
                      <TableRow key={ticket.id} className="cursor-pointer hover:bg-muted/40">
                        <TableCell className="font-mono text-xs font-semibold text-primary">
                          {ticket.ticketNumber}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium text-foreground text-sm">{ticket.farmerName}</div>
                          <div className="text-xs text-muted-foreground">{ticket.organization}</div>
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate font-medium text-foreground text-sm">
                          {ticket.subject}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{ticket.category}</TableCell>
                        <TableCell>{getPriorityBadge(ticket.priority)}</TableCell>
                        <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{ticket.channel}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedTicket(ticket)}
                          >
                            View
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

        {/* Support Helpdesk Channels & Info Sidebar */}
        <div className="space-y-4">
          <Card className="border-border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Headset className="w-4 h-4 text-primary" /> Helpdesk Channels
              </CardTitle>
              <CardDescription>Direct contact channels for Kenyan farmers</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="p-3 rounded-lg border border-border bg-muted/30 space-y-1">
                <div className="flex items-center gap-2 font-semibold text-foreground">
                  <Phone className="w-4 h-4 text-emerald-600" /> WhatsApp Hotline
                </div>
                <p className="text-xs text-muted-foreground">Direct farmer messaging & sensor diagnostics</p>
                <p className="text-xs font-mono font-medium text-primary mt-1">+254 700 890 000</p>
              </div>

              <div className="p-3 rounded-lg border border-border bg-muted/30 space-y-1">
                <div className="flex items-center gap-2 font-semibold text-foreground">
                  <Mail className="w-4 h-4 text-blue-600" /> Support Desk Email
                </div>
                <p className="text-xs text-muted-foreground">Official support inquiries & account escalation</p>
                <p className="text-xs font-mono font-medium text-primary mt-1">support@kilisense.com</p>
              </div>

              <div className="p-3 rounded-lg border border-border bg-muted/30 space-y-1">
                <div className="flex items-center gap-2 font-semibold text-foreground">
                  <Building className="w-4 h-4 text-amber-600" /> Field Service Center
                </div>
                <p className="text-xs text-muted-foreground">Hardware inspection, gateways & sensors</p>
                <p className="text-xs font-medium text-foreground mt-1">Nyeri Hub · Nyeri, Kenya</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Support SLA Status</CardTitle>
              <CardDescription>Target response times</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-xs text-muted-foreground">
              <div className="flex justify-between py-1 border-b border-border/40">
                <span>Critical / Urgent:</span>
                <span className="font-semibold text-foreground">&lt; 1 hour</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/40">
                <span>Hardware / IoT Gateways:</span>
                <span className="font-semibold text-foreground">&lt; 4 hours</span>
              </div>
              <div className="flex justify-between py-1">
                <span>General Inquiries:</span>
                <span className="font-semibold text-foreground">&lt; 24 hours</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Ticket Details & Conversation Modal */}
      {selectedTicket && (
        <Dialog open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
          <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
            <DialogHeader className="border-b pb-3">
              <div className="flex items-center justify-between pr-6">
                <div>
                  <DialogTitle className="text-lg flex items-center gap-2">
                    <span>{selectedTicket.subject}</span>
                    <Badge variant="outline" className="font-mono text-xs">{selectedTicket.ticketNumber}</Badge>
                  </DialogTitle>
                  <DialogDescription className="text-xs mt-1">
                    Submitted by {selectedTicket.farmerName} ({selectedTicket.organization}) via {selectedTicket.channel} · {format(new Date(selectedTicket.createdAt), "MMM d, yyyy h:mm a")}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto space-y-4 py-4 pr-1">
              {/* Ticket Metadata Bar */}
              <div className="grid grid-cols-4 gap-2 p-3 bg-muted/40 rounded-lg text-xs">
                <div>
                  <span className="text-muted-foreground block">Category</span>
                  <span className="font-medium text-foreground">{selectedTicket.category}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Priority</span>
                  <span className="font-medium">{getPriorityBadge(selectedTicket.priority)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Status</span>
                  <span className="font-medium">{getStatusBadge(selectedTicket.status)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Phone</span>
                  <span className="font-mono text-foreground">{selectedTicket.phone}</span>
                </div>
              </div>

              {/* Status Change Buttons */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground font-medium">Change Status:</span>
                <Button
                  size="sm"
                  variant={selectedTicket.status === "open" ? "default" : "outline"}
                  className="h-7 text-xs"
                  onClick={() => handleStatusChange("open")}
                >
                  Open
                </Button>
                <Button
                  size="sm"
                  variant={selectedTicket.status === "in_progress" ? "default" : "outline"}
                  className="h-7 text-xs"
                  onClick={() => handleStatusChange("in_progress")}
                >
                  In Progress
                </Button>
                <Button
                  size="sm"
                  variant={selectedTicket.status === "resolved" ? "default" : "outline"}
                  className="h-7 text-xs"
                  onClick={() => handleStatusChange("resolved")}
                >
                  Resolved
                </Button>
              </div>

              {/* Conversation Log */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Inquiry & Responses</h4>
                {selectedTicket.responses.map((res, i) => (
                  <div
                    key={i}
                    className={`p-3 rounded-lg text-sm ${
                      res.sender.includes("KiliSense")
                        ? "bg-primary/10 border border-primary/20 ml-6"
                        : "bg-muted border border-border mr-6"
                    }`}
                  >
                    <div className="flex justify-between items-center text-xs mb-1 font-semibold text-foreground">
                      <span>{res.sender}</span>
                      <span className="text-muted-foreground font-normal">
                        {format(new Date(res.timestamp), "h:mm a, MMM d")}
                      </span>
                    </div>
                    <p className="text-foreground leading-relaxed text-xs">{res.message}</p>
                  </div>
                ))}
              </div>

              {/* Reply Box */}
              <div className="space-y-2 pt-2 border-t">
                <label className="text-xs font-semibold text-muted-foreground">Reply to Farmer</label>
                <Textarea
                  placeholder="Type assistance response or resolution details..."
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  className="text-xs min-h-[80px]"
                />
              </div>
            </div>

            <DialogFooter className="border-t pt-3 flex justify-between sm:justify-between items-center">
              <Button variant="outline" size="sm" onClick={() => setSelectedTicket(null)}>
                Close
              </Button>
              <Button
                size="sm"
                className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
                disabled={!replyMessage.trim()}
                onClick={handleSendReply}
              >
                <Send className="w-3.5 h-3.5" /> Send Response
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* New Ticket Modal */}
      <Dialog open={isNewTicketOpen} onOpenChange={setIsNewTicketOpen}>
        <DialogContent className="max-w-lg">
          <form onSubmit={handleCreateTicket} className="space-y-4">
            <DialogHeader>
              <DialogTitle>Log New Support Ticket</DialogTitle>
              <DialogDescription>
                Record an incoming farmer inquiry or field officer ticket.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium">Farmer Name *</label>
                  <Input
                    required
                    placeholder="e.g. Samuel Githinji"
                    value={newFarmer}
                    onChange={(e) => setNewFarmer(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium">Organization / Farm</label>
                  <Input
                    placeholder="e.g. Othaya Farm"
                    value={newOrg}
                    onChange={(e) => setNewOrg(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium">Phone Number</label>
                  <Input
                    placeholder="+254 7..."
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium">Email Address</label>
                  <Input
                    type="email"
                    placeholder="farmer@..."
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium">Category</label>
                  <Select value={newCategory} onValueChange={(v: any) => setNewCategory(v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="IoT Sensors">IoT Sensors</SelectItem>
                      <SelectItem value="Livestock/Dairy">Livestock/Dairy</SelectItem>
                      <SelectItem value="Billing">Billing</SelectItem>
                      <SelectItem value="Crop Advisory">Crop Advisory</SelectItem>
                      <SelectItem value="Account">Account</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium">Priority</label>
                  <Select value={newPriority} onValueChange={(v: any) => setNewPriority(v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium">Channel</label>
                  <Select value={newChannel} onValueChange={(v: any) => setNewChannel(v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                      <SelectItem value="Field Hotline">Field Hotline</SelectItem>
                      <SelectItem value="Email">Email</SelectItem>
                      <SelectItem value="Web Portal">Web Portal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium">Subject *</label>
                <Input
                  required
                  placeholder="Summary of the issue..."
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium">Detailed Description *</label>
                <Textarea
                  required
                  placeholder="Provide details about the issue or question..."
                  rows={3}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsNewTicketOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                Create Ticket
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
