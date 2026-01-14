import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { Calendar, Plus, FileText, Mail } from "lucide-react";
import { toast } from "sonner";

export default function Meetings() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [meetingDate, setMeetingDate] = useState("");
  const [location, setLocation] = useState("");
  const [participants, setParticipants] = useState("");
  const [transcript, setTranscript] = useState("");
  const [selectedMeetingId, setSelectedMeetingId] = useState<number | null>(null);

  const utils = trpc.useUtils();
  const { data: meetings, isLoading } = trpc.meetings.list.useQuery();
  const createMutation = trpc.meetings.create.useMutation({
    onSuccess: () => {
      utils.meetings.list.invalidate();
      setIsCreateOpen(false);
      resetForm();
      toast.success("Meeting created successfully");
    },
  });

  const generateSummaryMutation = trpc.meetings.generateSummary.useMutation({
    onSuccess: () => {
      utils.meetings.list.invalidate();
      utils.review.getPending.invalidate();
      toast.success("Meeting summary generated and sent for review");
    },
  });

  const extractActionItemsMutation = trpc.meetings.extractActionItems.useMutation({
    onSuccess: () => {
      utils.actionItems.getByMeeting.invalidate();
      utils.review.getPending.invalidate();
      toast.success("Action items extracted and sent for review");
    },
  });

  const resendInvitesMutation = trpc.meetings.resendInvites.useMutation({
    onSuccess: () => {
      toast.success("Meeting invites resent to all participants");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to resend invites");
    },
  });

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setMeetingDate("");
    setLocation("");
    setParticipants("");
    setTranscript("");
  };

  const handleCreate = () => {
    if (!title || !meetingDate) {
      toast.error("Please fill in required fields");
      return;
    }

    const participantsList = participants
      .split(',')
      .map(p => p.trim())
      .filter(p => p.length > 0);

    createMutation.mutate({
      title,
      description,
      meetingDate: new Date(meetingDate),
      location,
      participants: participantsList.length > 0 ? participantsList : undefined,
    });
  };

  const handleGenerateSummary = (meetingId: number) => {
    if (!transcript) {
      toast.error("Please enter meeting transcript");
      return;
    }
    generateSummaryMutation.mutate({ meetingId, transcript });
  };

  const handleExtractActionItems = (meetingId: number) => {
    if (!transcript) {
      toast.error("Please enter meeting transcript");
      return;
    }
    extractActionItemsMutation.mutate({ meetingId, transcript });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Meetings</h1>
            <p className="text-foreground mt-2">Manage meetings, generate summaries, and extract action items</p>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Meeting
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="text-foreground">Create New Meeting</DialogTitle>
                <DialogDescription className="text-foreground">
                  Add a new meeting to the system
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title" className="text-foreground">Title *</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Weekly team sync"
                  />
                </div>
                <div>
                  <Label htmlFor="description" className="text-foreground">Description</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Meeting agenda and topics"
                  />
                </div>
                <div>
                  <Label htmlFor="date" className="text-foreground">Date & Time *</Label>
                  <Input
                    id="date"
                    type="datetime-local"
                    value={meetingDate}
                    onChange={(e) => setMeetingDate(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="location" className="text-foreground">Location</Label>
                  <Input
                    id="location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Conference Room A"
                  />
                </div>
                <div>
                  <Label htmlFor="participants" className="text-foreground">Participants</Label>
                  <Input
                    id="participants"
                    value={participants}
                    onChange={(e) => setParticipants(e.target.value)}
                    placeholder="email1@example.com, email2@example.com"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Enter email addresses separated by commas
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreate} disabled={createMutation.isPending}>
                  Create Meeting
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-foreground">Loading meetings...</p>
          </div>
        ) : meetings && meetings.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-foreground">No meetings yet</p>
              <p className="text-sm text-muted-foreground mt-2">Create your first meeting to get started</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {meetings?.map((meeting) => (
              <Card key={meeting.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-foreground">{meeting.title}</CardTitle>
                      <CardDescription className="text-foreground">
                        {new Date(meeting.meetingDate).toLocaleString()} • {meeting.location || 'No location'}
                      </CardDescription>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      meeting.status === 'completed' ? 'bg-green-100 text-green-800' :
                      meeting.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {meeting.status}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  {meeting.description && (
                    <p className="text-foreground mb-4">{meeting.description}</p>
                  )}
                  
                  {meeting.participants && (
                    <div className="mb-4">
                      <p className="text-sm font-medium text-foreground mb-2">Participants:</p>
                      <div className="flex flex-wrap gap-2">
                        {JSON.parse(meeting.participants).map((email: string, idx: number) => (
                          <span key={idx} className="px-2 py-1 text-xs bg-muted rounded-full text-foreground">
                            {email}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {meeting.summaryText && (
                    <div className="bg-muted/20 p-3 rounded-lg mb-4">
                      <p className="text-sm font-medium text-foreground mb-2">AI Summary:</p>
                      <p className="text-sm text-foreground">{meeting.summaryText}</p>
                    </div>
                  )}

                  <div className="space-y-3">
                    <div>
                      <Label htmlFor={`transcript-${meeting.id}`} className="text-foreground">Meeting Transcript</Label>
                      <Textarea
                        id={`transcript-${meeting.id}`}
                        placeholder="Paste meeting transcript here..."
                        value={selectedMeetingId === meeting.id ? transcript : ""}
                        onChange={(e) => {
                          setSelectedMeetingId(meeting.id);
                          setTranscript(e.target.value);
                        }}
                        rows={4}
                      />
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedMeetingId(meeting.id);
                          handleGenerateSummary(meeting.id);
                        }}
                        disabled={generateSummaryMutation.isPending || !transcript}
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Generate Summary
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedMeetingId(meeting.id);
                          handleExtractActionItems(meeting.id);
                        }}
                        disabled={extractActionItemsMutation.isPending || !transcript}
                      >
                        Extract Action Items
                      </Button>
                      {meeting.participants && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => resendInvitesMutation.mutate({ id: meeting.id })}
                          disabled={resendInvitesMutation.isPending}
                        >
                          <Mail className="h-4 w-4 mr-2" />
                          Resend Invites
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
