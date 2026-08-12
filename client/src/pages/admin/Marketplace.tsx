import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ShieldBan, Search } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { format } from "date-fns";

export default function AdminMarketplace() {
  const utils = trpc.useUtils();
  const [status, setStatus] = useState<"all" | "draft" | "active" | "paused" | "sold" | "archived">("all");
  
  const { data: listings, isLoading } = trpc.marketplace.adminListAll.useQuery({
    status: status,
    limit: 50,
  });

  const disableListing = trpc.marketplace.adminDisable.useMutation({
    onSuccess: () => {
      toast.success("Listing disabled by admin");
      utils.marketplace.adminListAll.invalidate();
    },
    onError: (err) => toast.error(err.message)
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Marketplace Moderation</h1>
          <p className="text-muted-foreground mt-1">
            Monitor and moderate all listings across the SproutX platform.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader className="py-4 border-b">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <CardTitle>Platform Listings</CardTitle>
            <div className="flex gap-2">
              <Select value={status} onValueChange={(v: any) => setStatus(v)}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Organization</TableHead>
                <TableHead>Seller</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Listed Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center h-24 text-muted-foreground">
                    Loading listings...
                  </TableCell>
                </TableRow>
              ) : listings?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center h-24 text-muted-foreground">
                    No listings found.
                  </TableCell>
                </TableRow>
              ) : (
                listings?.map(({ listing, category, orgName, sellerName }) => (
                  <TableRow key={listing.id}>
                    <TableCell className="font-medium max-w-[200px] truncate" title={listing.title}>
                      {listing.title}
                    </TableCell>
                    <TableCell>{orgName}</TableCell>
                    <TableCell>{sellerName}</TableCell>
                    <TableCell>{category?.name || "-"}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 text-xs font-semibold rounded ${
                        listing.status === 'active' ? 'bg-green-100 text-green-700' :
                        listing.status === 'archived' ? 'bg-red-100 text-red-700' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {listing.status.toUpperCase()}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(listing.createdAt), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell className="text-right">
                      {listing.status !== 'archived' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => {
                            if(confirm("Are you sure you want to disable this listing? This will archive it and remove it from public view.")) {
                              disableListing.mutate({ listingId: listing.id });
                            }
                          }}
                          disabled={disableListing.isPending}
                        >
                          <ShieldBan className="w-4 h-4 mr-2" />
                          Disable
                        </Button>
                      )}
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
