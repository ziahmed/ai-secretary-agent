import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { FileText, CheckCircle, XCircle, Edit, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Streamdown } from "streamdown";

export default function ReviewQueue() {
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [editedContent, setEditedContent] = useState("");
  const [rejectNotes, setRejectNotes] = useState("");
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState("");

  const utils = trpc.useUtils();
  const { data: reviewItems, isLoading } = trpc.review.getPending.useQuery();
  
  const approveMutation = trpc.review.approve.useMutation({
    onSuccess: () => {
      utils.review.getPending.invalidate();
      setSelectedItem(null);
      setEditedContent("");
      toast.success("Item approved successfully");
    },
  });

  const rejectMutation = trpc.review.reject.useMutation({
    onSuccess: () => {
      utils.review.getPending.invalidate();
      setSelectedItem(null);
      setRejectNotes("");
      setIsRejectDialogOpen(false);
      toast.success("Item rejected");
    },
  });

  const sendEmailMutation = trpc.email.sendApproved.useMutation({
    onSuccess: () => {
      toast.success("Email sent successfully");
    },
  });

  const handleApprove = (item: any) => {
    approveMutation.mutate({
      id: item.id,
      editedContent: editedContent !== item.content ? editedContent : undefined,
    });
  };

  const handleReject = () => {
    if (!selectedItem || !rejectNotes) {
      toast.error("Please provide rejection notes");
      return;
    }
    rejectMutation.mutate({
      id: selectedItem.id,
      notes: rejectNotes,
    });
  };

  const handleSendEmail = (reviewId: number) => {
    sendEmailMutation.mutate({ reviewId });
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "meeting_summary": return "Meeting Summary";
      case "action_items": return "Action Items";
      case "email_draft": return "Email Draft";
      case "translation": return "Translation";
      default: return type;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "meeting_summary": return "bg-blue-100 text-blue-800";
      case "action_items": return "bg-green-100 text-green-800";
      case "email_draft": return "bg-purple-100 text-purple-800";
      case "translation": return "bg-orange-100 text-orange-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.history.back()}
              className="-ml-2"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </div>
          <h1 className="text-3xl font-bold text-foreground">Review Queue</h1>
          <p className="text-foreground mt-2">Review and approve AI-generated content before distribution</p>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-foreground">Loading review items...</p>
          </div>
        ) : reviewItems && reviewItems.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-foreground">No items pending review</p>
              <p className="text-sm text-muted-foreground mt-2">All content has been reviewed</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {reviewItems?.map((item) => {
              // Check if this is a reminder item
              const metadata = item.metadata ? JSON.parse(item.metadata) : {};
              const isReminder = metadata.isReminder === true;
              
              return (
              <Card key={item.id} className={isReminder ? "border-l-4 border-l-amber-500 bg-amber-50/50" : ""}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-foreground flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        {getTypeLabel(item.type)}
                      </CardTitle>
                      <CardDescription className="text-foreground">
                        Created {new Date(item.createdAt).toLocaleString()}
                      </CardDescription>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${getTypeColor(item.type)}`}>
                      {item.type}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  {item.originalContent && (
                    <div className="mb-4 p-3 bg-muted/20 rounded-lg">
                      <p className="text-sm font-medium text-foreground mb-2">Original Content:</p>
                      <div className="text-sm text-foreground whitespace-pre-wrap">
                        <Streamdown>{item.originalContent}</Streamdown>
                      </div>
                    </div>
                  )}

                  <div className="mb-4">
                    <Label htmlFor={`content-${item.id}`} className="text-foreground mb-2 block">
                      {item.originalContent ? "Translated/Generated Content:" : "Content to Review:"}
                    </Label>
                    <Textarea
                      id={`content-${item.id}`}
                      value={selectedItem?.id === item.id ? editedContent : item.content}
                      onChange={(e) => {
                        setSelectedItem(item);
                        setEditedContent(e.target.value);
                      }}
                      rows={8}
                      className="font-mono text-sm"
                    />
                  </div>

                  {item.metadata && (
                    <div className="mb-4 p-3 bg-muted/20 rounded-lg">
                      <p className="text-sm font-medium text-foreground mb-2">Additional Info:</p>
                      <pre className="text-xs text-foreground overflow-auto">
                        {JSON.stringify(JSON.parse(item.metadata), null, 2)}
                      </pre>
                    </div>
                  )}

                  {item.type === "email_draft" && (
                    <div className="mb-4">
                      <Label htmlFor={`email-${item.id}`} className="text-foreground mb-2 block">
                        Recipient Email:
                      </Label>
                      <input
                        id={`email-${item.id}`}
                        type="email"
                        value={recipientEmail || (item.metadata ? JSON.parse(item.metadata).recipientEmail : 'secretary.omega2@gmail.com')}
                        onChange={(e) => setRecipientEmail(e.target.value)}
                        className="w-full px-3 py-2 border rounded-md"
                        placeholder="secretary.omega2@gmail.com"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Default sender: secretary.omega2@gmail.com | CC: Approver
                      </p>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button
                      onClick={() => {
                        setSelectedItem(item);
                        setEditedContent(item.content);
                        handleApprove(item);
                      }}
                      disabled={approveMutation.isPending}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approve
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSelectedItem(item);
                        setEditedContent(item.content);
                        handleApprove(item);
                      }}
                      disabled={approveMutation.isPending}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Approve with Edits
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => {
                        setSelectedItem(item);
                        setIsRejectDialogOpen(true);
                      }}
                      disabled={rejectMutation.isPending}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject
                    </Button>
                    {item.type === "email_draft" && item.status === "approved" && (
                      <Button
                        variant="secondary"
                        onClick={() => handleSendEmail(item.id)}
                        disabled={sendEmailMutation.isPending}
                      >
                        Send Email
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
            })}
          </div>
        )}

        <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-foreground">Reject Item</DialogTitle>
              <DialogDescription className="text-foreground">
                Please provide a reason for rejecting this item
              </DialogDescription>
            </DialogHeader>
            <div>
              <Label htmlFor="rejectNotes" className="text-foreground">Rejection Notes</Label>
              <Textarea
                id="rejectNotes"
                value={rejectNotes}
                onChange={(e) => setRejectNotes(e.target.value)}
                placeholder="Explain why this item is being rejected..."
                rows={4}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsRejectDialogOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleReject} disabled={rejectMutation.isPending}>
                Reject
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
