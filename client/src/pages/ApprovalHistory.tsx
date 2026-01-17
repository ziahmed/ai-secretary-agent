import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, CheckCircle, XCircle, Edit2, ArrowLeft, Trash } from "lucide-react";
import { Streamdown } from "streamdown";
import { toast } from "sonner";

export default function ApprovalHistory() {
  const { data: completedItems, isLoading } = trpc.review.getCompleted.useQuery();
  const utils = trpc.useUtils();

  const deleteItemMutation = trpc.review.deleteItem.useMutation({
    onSuccess: () => {
      utils.review.getCompleted.invalidate();
      toast.success("Item deleted successfully");
    },
    onError: (error: any) => {
      toast.error(`Failed to delete: ${error.message}`);
    },
  });

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "meeting_summary": return "Meeting Summary";
      case "action_items": return "Action Items";
      case "email_draft": return "Email Draft";
      case "translation": return "Translation";
      default: return type;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved": return <CheckCircle className="h-5 w-5 text-green-600" />;
      case "edited": return <Edit2 className="h-5 w-5 text-blue-600" />;
      case "rejected": return <XCircle className="h-5 w-5 text-red-600" />;
      default: return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved": return "bg-green-100 text-green-800";
      case "edited": return "bg-blue-100 text-blue-800";
      case "rejected": return "bg-red-100 text-red-800";
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
          <h1 className="text-3xl font-bold text-foreground">Approval History</h1>
          <p className="text-foreground mt-2">View all completed reviews and their outcomes</p>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-foreground">Loading history...</p>
          </div>
        ) : completedItems && completedItems.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-foreground">No completed reviews yet</p>
              <p className="text-sm text-muted-foreground mt-2">Approved and rejected items will appear here</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {completedItems?.map((item) => {
              const metadata = item.metadata ? JSON.parse(item.metadata) : {};
              const isReminder = metadata.isReminder === true;
              
              return (
                <Card key={item.id} className={isReminder ? "border-l-4 border-l-amber-500" : ""}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(item.status)}
                        <div>
                          <CardTitle className="text-foreground flex items-center gap-2">
                            {getTypeLabel(item.type)}
                            {isReminder && (
                              <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-full">
                                Reminder
                              </span>
                            )}
                          </CardTitle>
                          <CardDescription className="text-foreground">
                            Reviewed {item.reviewedAt ? new Date(item.reviewedAt).toLocaleString() : 'N/A'}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(item.status)}`}>
                          {item.status}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (confirm('Are you sure you want to delete this item?')) {
                              deleteItemMutation.mutate({ id: item.id });
                            }
                          }}
                          disabled={deleteItemMutation.isPending}
                        >
                          <Trash className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm font-medium text-foreground mb-2">Content:</p>
                        <div className="p-3 bg-muted/20 rounded-lg text-sm text-foreground">
                          <Streamdown>{item.content}</Streamdown>
                        </div>
                      </div>

                      {item.reviewNotes && (
                        <div>
                          <p className="text-sm font-medium text-foreground mb-2">Review Notes:</p>
                          <div className="p-3 bg-muted/20 rounded-lg text-sm text-foreground">
                            {item.reviewNotes}
                          </div>
                        </div>
                      )}

                      {item.metadata && (
                        <div>
                          <p className="text-sm font-medium text-foreground mb-2">Additional Info:</p>
                          <div className="p-3 bg-muted/20 rounded-lg">
                            <pre className="text-xs text-foreground overflow-auto">
                              {JSON.stringify(JSON.parse(item.metadata), null, 2)}
                            </pre>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
