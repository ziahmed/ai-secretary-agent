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
  const [editedActionItems, setEditedActionItems] = useState<Record<number, any[]>>({});
  const [isNotificationDialogOpen, setIsNotificationDialogOpen] = useState(false);
  const [notificationEmail, setNotificationEmail] = useState("");
  const [notificationAction, setNotificationAction] = useState<'approved' | 'rejected'>('approved');
  const [pendingApprovalItem, setPendingApprovalItem] = useState<any>(null);

  const utils = trpc.useUtils();
  const { data: reviewItems, isLoading } = trpc.review.getPending.useQuery();
  const { data: users } = trpc.users.list.useQuery();
  
  const approveMutation = trpc.review.approve.useMutation({
    onSuccess: (data, variables) => {
      utils.review.getPending.invalidate();
      setPendingApprovalItem({ id: variables.id, action: 'approved' });
      setNotificationAction('approved');
      setIsNotificationDialogOpen(true);
      toast.success("Item approved successfully");
    },
  });

  const rejectMutation = trpc.review.reject.useMutation({
    onSuccess: (data, variables) => {
      utils.review.getPending.invalidate();
      setIsRejectDialogOpen(false);
      setPendingApprovalItem({ id: variables.id, action: 'rejected' });
      setNotificationAction('rejected');
      setIsNotificationDialogOpen(true);
      toast.success("Item rejected");
    },
  });

  const sendEmailMutation = trpc.email.sendApproved.useMutation({
    onSuccess: () => {
      utils.review.getPending.invalidate();
      toast.success("Email sent successfully!");
    },
    onError: (error) => {
      toast.error(`Failed to send email: ${error.message}`);
      console.error('Email send error:', error);
    },
  });

  const sendNotificationMutation = trpc.review.sendNotification.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
    },
    onError: (error) => {
      toast.error(`Failed to send notification: ${error.message}`);
    },
  });

  const handleApprove = (item: any) => {
    let contentToApprove = editedContent !== item.content ? editedContent : undefined;
    
    // For action items, use edited action items if available
    if (item.type === "action_items" && editedActionItems[item.id]) {
      contentToApprove = JSON.stringify(editedActionItems[item.id]);
    }
    
    approveMutation.mutate({
      id: item.id,
      editedContent: contentToApprove,
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

                  {item.type === "action_items" ? (
                    // Special rendering for action items
                    <div className="mb-4">
                      <div className="mb-4">
                        <h3 className="text-lg font-semibold text-foreground mb-3">
                          {item.metadata ? JSON.parse(item.metadata).meetingTitle || "Action Items" : "Action Items"}
                        </h3>
                      </div>
                      <div className="space-y-3">
                        {(() => {
                          try {
                            const actionItems = JSON.parse(item.content);
                            // Initialize edited items if not already done
                            if (!editedActionItems[item.id]) {
                              setEditedActionItems(prev => ({ ...prev, [item.id]: actionItems }));
                            }
                            const currentItems = editedActionItems[item.id] || actionItems;
                            
                            return currentItems.map((actionItem: any, index: number) => (
                              <div key={index} className="p-4 border rounded-lg bg-card">
                                <div className="flex items-start gap-3">
                                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
                                    {index + 1}
                                  </div>
                                  <div className="flex-1 space-y-3">
                                    <div>
                                      <Label className="text-xs text-muted-foreground mb-1">Description</Label>
                                      <Textarea
                                        value={actionItem.description}
                                        onChange={(e) => {
                                          const updated = [...currentItems];
                                          updated[index] = { ...updated[index], description: e.target.value };
                                          setEditedActionItems(prev => ({ ...prev, [item.id]: updated }));
                                        }}
                                        rows={2}
                                        className="text-sm"
                                      />
                                    </div>
                                    <div className="space-y-3">
                                      <div>
                                        <Label className="text-xs text-muted-foreground mb-1">Assign to User</Label>
                                        <select
                                          value={actionItem.ownerId || ""}
                                          onChange={(e) => {
                                            const updated = [...currentItems];
                                            const userId = e.target.value ? Number(e.target.value) : null;
                                            const selectedUser = users?.find(u => u.id === userId);
                                            updated[index] = { 
                                              ...updated[index], 
                                              ownerId: userId,
                                              ownerEmail: selectedUser?.email || updated[index].ownerEmail
                                            };
                                            setEditedActionItems(prev => ({ ...prev, [item.id]: updated }));
                                          }}
                                          className="w-full px-3 py-2 border rounded-md text-sm"
                                        >
                                          <option value="">-- Select registered user --</option>
                                          {users?.map(user => (
                                            <option key={user.id} value={user.id}>
                                              {user.name || user.email}
                                            </option>
                                          ))}
                                        </select>
                                      </div>
                                      <div>
                                        <Label className="text-xs text-muted-foreground mb-1">Or enter email manually</Label>
                                        <input
                                          type="text"
                                          value={actionItem.ownerEmail || ""}
                                          onChange={(e) => {
                                            const updated = [...currentItems];
                                            updated[index] = { ...updated[index], ownerEmail: e.target.value, ownerId: null };
                                            setEditedActionItems(prev => ({ ...prev, [item.id]: updated }));
                                          }}
                                          className="w-full px-3 py-2 border rounded-md text-sm"
                                          placeholder="Email address for external user"
                                        />
                                      </div>
                                    </div>
                                    <div className="grid grid-cols-1 gap-3">
                                      <div>
                                        <Label className="text-xs text-muted-foreground mb-1">Deadline</Label>
                                        <input
                                          type="date"
                                          value={actionItem.deadline ? new Date(actionItem.deadline).toISOString().split('T')[0] : ""}
                                          onChange={(e) => {
                                            const updated = [...currentItems];
                                            updated[index] = { ...updated[index], deadline: e.target.value ? new Date(e.target.value).toISOString() : null };
                                            setEditedActionItems(prev => ({ ...prev, [item.id]: updated }));
                                          }}
                                          className="w-full px-3 py-2 border rounded-md text-sm"
                                        />
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ));
                          } catch (e) {
                            return <p className="text-destructive">Error parsing action items</p>;
                          }
                        })()}
                      </div>
                    </div>
                  ) : (
                    // Default rendering for other types
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
                  )}

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

        <Dialog open={isNotificationDialogOpen} onOpenChange={setIsNotificationDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-foreground">Send Notification</DialogTitle>
              <DialogDescription className="text-foreground">
                Item has been {notificationAction}. Would you like to notify someone?
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="notifyUser" className="text-foreground mb-2">Select User to Notify</Label>
                <select
                  id="notifyUser"
                  value={notificationEmail || ""}
                  onChange={(e) => setNotificationEmail(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="">-- Select a user --</option>
                  {users?.map(user => (
                    <option key={user.id} value={user.email || ""}>
                      {user.name || user.email}
                    </option>
                  ))}
                  <option value="secretary.omega2@gmail.com">Secretary (secretary.omega2@gmail.com)</option>
                </select>
              </div>
              <div>
                <Label htmlFor="customEmail" className="text-foreground mb-2">Or Enter Custom Email</Label>
                <input
                  id="customEmail"
                  type="email"
                  value={notificationEmail}
                  onChange={(e) => setNotificationEmail(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="Enter email address"
                />
              </div>
            </div>
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsNotificationDialogOpen(false);
                  setNotificationEmail("");
                  setSelectedItem(null);
                  setEditedContent("");
                  setRejectNotes("");
                }}
              >
                Skip Notification
              </Button>
              <Button 
                onClick={() => {
                  if (notificationEmail && pendingApprovalItem) {
                    sendNotificationMutation.mutate({
                      reviewId: pendingApprovalItem.id,
                      recipientEmail: notificationEmail,
                      action: pendingApprovalItem.action,
                    });
                  }
                  setIsNotificationDialogOpen(false);
                  setNotificationEmail("");
                  setSelectedItem(null);
                  setEditedContent("");
                  setRejectNotes("");
                  setPendingApprovalItem(null);
                }}
                disabled={!notificationEmail || sendNotificationMutation.isPending}
              >
                {sendNotificationMutation.isPending ? "Sending..." : "Send Notification"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
