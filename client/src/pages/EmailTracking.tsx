import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, CheckCircle, XCircle, Clock, Eye, ArrowLeft, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { EmailLog } from "../../../drizzle/schema";
import { toast } from "sonner";

export default function EmailTracking() {
  const { data: emailLogs, isLoading } = trpc.emails.getAll.useQuery();
  const utils = trpc.useUtils();

  const deleteEmailMutation = trpc.emails.delete.useMutation({
    onSuccess: () => {
      utils.emails.getAll.invalidate();
      toast.success("Email log deleted successfully");
    },
    onError: (error: any) => {
      toast.error(`Failed to delete: ${error.message}`);
    },
  });

  const stats = emailLogs?.reduce(
    (acc: { total: number; sent: number; delivered: number; opened: number; failed: number }, log: EmailLog) => {
      acc.total++;
      if (log.status === "sent") acc.sent++;
      if (log.status === "delivered") acc.delivered++;
      if (log.status === "opened") acc.opened++;
      if (log.status === "failed") acc.failed++;
      return acc;
    },
    { total: 0, sent: 0, delivered: 0, opened: 0, failed: 0 }
  ) || { total: 0, sent: 0, delivered: 0, opened: 0, failed: 0 };

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
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
        <h1 className="text-3xl font-bold text-black">Email Tracking</h1>
        <p className="text-gray-600 mt-1">Monitor email delivery and engagement status</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Total Emails</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-blue-600" />
              <span className="text-2xl font-bold text-black">{stats.total}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Sent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              <span className="text-2xl font-bold text-black">{stats.sent}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Delivered</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-2xl font-bold text-black">{stats.delivered}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Opened</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-purple-600" />
              <span className="text-2xl font-bold text-black">{stats.opened}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Failed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-600" />
              <span className="text-2xl font-bold text-black">{stats.failed}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Email Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-black">Recent Email Activity</CardTitle>
          <CardDescription>Track the status of all sent emails</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-48">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : emailLogs && emailLogs.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 text-black font-semibold">Recipient</th>
                    <th className="text-left py-3 px-4 text-black font-semibold">Subject</th>
                    <th className="text-left py-3 px-4 text-black font-semibold">Type</th>
                    <th className="text-left py-3 px-4 text-black font-semibold">Status</th>
                    <th className="text-left py-3 px-4 text-black font-semibold">Sent At</th>
                    <th className="text-left py-3 px-4 text-black font-semibold">Delivered At</th>
                    <th className="text-left py-3 px-4 text-black font-semibold">Opened At</th>
                    <th className="text-left py-3 px-4 text-black font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {emailLogs.map((log) => (
                    <tr key={log.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 text-black">{log.recipientEmail}</td>
                      <td className="py-3 px-4 text-black truncate max-w-xs">{log.subject}</td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {log.emailType}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            log.status === "sent"
                              ? "bg-yellow-100 text-yellow-800"
                              : log.status === "delivered"
                              ? "bg-green-100 text-green-800"
                              : log.status === "opened"
                              ? "bg-purple-100 text-purple-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {log.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-black text-sm">
                        {new Date(log.sentAt).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-black text-sm">
                        {log.deliveredAt ? new Date(log.deliveredAt).toLocaleString() : "-"}
                      </td>
                      <td className="py-3 px-4 text-black text-sm">
                        {log.openedAt ? new Date(log.openedAt).toLocaleString() : "-"}
                      </td>
                      <td className="py-3 px-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (confirm('Are you sure you want to delete this email log?')) {
                              deleteEmailMutation.mutate({ id: log.id });
                            }
                          }}
                          disabled={deleteEmailMutation.isPending}
                        >
                          <Trash className="h-4 w-4 text-red-600" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <Mail className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-black">No emails sent yet</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
