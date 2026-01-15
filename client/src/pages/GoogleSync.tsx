import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { Calendar, Mail, RefreshCw, CheckCircle, XCircle, AlertCircle, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export default function GoogleSync() {
  const [refreshToken, setRefreshToken] = useState("");
  
  const { data: syncStatus, isLoading: statusLoading } = trpc.google.getSyncStatus.useQuery();
  const { data: authUrl } = trpc.google.getAuthUrl.useQuery();
  
  const syncCalendarMutation = trpc.google.syncCalendar.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
    },
    onError: (error) => {
      toast.error(`Calendar sync failed: ${error.message}`);
    },
  });

  const syncGmailMutation = trpc.google.syncGmail.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
    },
    onError: (error) => {
      toast.error(`Gmail sync failed: ${error.message}`);
    },
  });

  // Check for OAuth callback code in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    if (code) {
      // Show the code to user to manually add to env
      setRefreshToken(code);
      toast.info("Authorization code received. Please contact admin to add refresh token to environment.");
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const handleCalendarSync = () => {
    syncCalendarMutation.mutate({ maxResults: 50 });
  };

  const handleGmailSync = () => {
    syncGmailMutation.mutate({ maxResults: 50 });
  };

  const handleAuthorize = () => {
    if (authUrl?.url) {
      window.location.href = authUrl.url;
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
          <h1 className="text-3xl font-bold text-foreground">Google Integration</h1>
          <p className="text-foreground mt-2">Sync meetings from Google Calendar and emails from Gmail</p>
        </div>

        {/* Status Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-foreground">Connection Status</CardTitle>
            <CardDescription className="text-foreground">
              Current status of Google API integration
            </CardDescription>
          </CardHeader>
          <CardContent>
            {statusLoading ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-foreground font-medium">API Credentials:</span>
                  {syncStatus?.configured ? (
                    <Badge variant="default" className="flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      Configured
                    </Badge>
                  ) : (
                    <Badge variant="destructive" className="flex items-center gap-1">
                      <XCircle className="h-3 w-3" />
                      Not Configured
                    </Badge>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-foreground font-medium">Authentication:</span>
                  {syncStatus?.authenticated ? (
                    <Badge variant="default" className="flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      Authenticated
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      Not Authenticated
                    </Badge>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-foreground font-medium">Account:</span>
                  <span className="text-foreground">{syncStatus?.accountEmail}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Authorization Card */}
        {syncStatus && !syncStatus.authenticated && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-foreground">
              You need to authorize access to Google Calendar and Gmail. Click the button below to start the OAuth flow.
              After authorization, you'll receive a refresh token that needs to be added to the environment variables.
            </AlertDescription>
          </Alert>
        )}

        {!syncStatus?.authenticated && (
          <Card>
            <CardHeader>
              <CardTitle className="text-foreground">Authorize Google Access</CardTitle>
              <CardDescription className="text-foreground">
                Grant permission to access Google Calendar and Gmail for secretary.omega2@gmail.com
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={handleAuthorize} disabled={!syncStatus?.configured}>
                Authorize with Google
              </Button>
              {!syncStatus?.configured && (
                <p className="text-sm text-muted-foreground mt-2">
                  API credentials must be configured first
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Re-authorize Button */}
        {syncStatus?.authenticated && (
          <Card>
            <CardHeader>
              <CardTitle className="text-foreground">Re-authorize Google Account</CardTitle>
              <CardDescription className="text-foreground">
                Update permissions or switch to a different Google account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-foreground">
                  If you need to add new permissions (like gmail.send for email delivery) or switch accounts,
                  click the button below to restart the authorization process. You'll receive a new refresh token
                  that needs to be updated in Settings → Secrets.
                </AlertDescription>
              </Alert>
              <Button
                variant="outline"
                onClick={handleAuthorize}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Re-authorize with Google
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Sync Actions */}
        {syncStatus?.authenticated && (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="text-foreground flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Google Calendar Sync
                </CardTitle>
                <CardDescription className="text-foreground">
                  Import upcoming events from Google Calendar into the meetings database
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={handleCalendarSync}
                  disabled={syncCalendarMutation.isPending}
                >
                  {syncCalendarMutation.isPending ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Syncing...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Sync Calendar
                    </>
                  )}
                </Button>
                {syncCalendarMutation.isSuccess && (
                  <p className="text-sm text-foreground mt-2">
                    Last sync: {syncCalendarMutation.data?.syncedCount} new events imported
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-foreground flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Gmail Sync
                </CardTitle>
                <CardDescription className="text-foreground">
                  Parse emails to extract meeting invites and action items
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={handleGmailSync}
                  disabled={syncGmailMutation.isPending}
                >
                  {syncGmailMutation.isPending ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Syncing...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Sync Gmail
                    </>
                  )}
                </Button>
                {syncGmailMutation.isSuccess && (
                  <p className="text-sm text-foreground mt-2">
                    Last sync: {syncGmailMutation.data?.processedCount} emails processed
                  </p>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-foreground">Setup Instructions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-foreground">
            <div>
              <h3 className="font-semibold mb-2">1. Configure API Credentials</h3>
              <p className="text-sm">
                Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to your environment variables.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">2. Authorize Access</h3>
              <p className="text-sm">
                Click "Authorize with Google" and sign in with secretary.omega2@gmail.com.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">3. Add Refresh Token</h3>
              <p className="text-sm">
                After authorization, add the GOOGLE_REFRESH_TOKEN to your environment variables.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">4. Sync Data</h3>
              <p className="text-sm">
                Use the sync buttons above to import calendar events and parse emails.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
