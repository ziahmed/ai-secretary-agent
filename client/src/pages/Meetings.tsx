import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { useLocation } from "wouter";
import { Calendar, Plus, FileText, Mail, ArrowLeft, X, CalendarClock, Upload, ExternalLink, ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function Meetings() {
  const [, navigate] = useLocation();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [meetingDate, setMeetingDate] = useState("");
  const [location, setLocation] = useState("");
  const [participants, setParticipants] = useState("");
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  const [manualEmail, setManualEmail] = useState("");
  const [transcript, setTranscript] = useState("");
  const [selectedMeetingId, setSelectedMeetingId] = useState<number | null>(null);
  const [collapsedMeetings, setCollapsedMeetings] = useState<Set<number>>(new Set());

  const utils = trpc.useUtils();
  const { data: meetingsData, isLoading } = trpc.meetings.list.useQuery();
  const { data: users } = trpc.users.list.useQuery();
  
  // Sort meetings by date (latest first)
  const meetings = meetingsData?.slice().sort((a, b) => 
    new Date(b.meetingDate).getTime() - new Date(a.meetingDate).getTime()
  );
  const createMutation = trpc.meetings.create.useMutation({
    onSuccess: (data: any) => {
      utils.meetings.list.invalidate();
      setIsCreateOpen(false);
      resetForm();
      
      if (data.conflicts && data.conflicts.length > 0) {
        const conflictTitles = data.conflicts.map((c: any) => c.title).join(', ');
        toast.warning(`Meeting created, but conflicts with: ${conflictTitles}`, {
          duration: 5000,
        });
      } else {
        toast.success("Meeting created successfully");
      }
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
  
  const uploadTranscriptMutation = trpc.meetings.uploadTranscript.useMutation({
    onSuccess: () => {
      utils.meetings.list.invalidate();
      toast.success("Transcript uploaded to Google Drive successfully");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to upload transcript");
    },
  });
  
  const handleUploadTranscript = (meetingId: number) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.txt,.doc,.docx,.pdf';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64Content = event.target?.result as string;
        const base64Data = base64Content.split(',')[1];
        
        uploadTranscriptMutation.mutate({
          meetingId,
          fileName: file.name,
          fileContent: base64Data,
          mimeType: file.type || 'text/plain',
        });
      };
      reader.readAsDataURL(file);
    };
    input.click();
  };
  
  const deleteMeetingMutation = trpc.meetings.delete.useMutation({
    onSuccess: () => {
      utils.meetings.list.invalidate();
      toast.success("Meeting deleted successfully");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete meeting");
    },
  });

  const generateMeetLinkMutation = trpc.meetings.generateMeetLink.useMutation({
    onSuccess: (data) => {
      utils.meetings.list.invalidate();
      toast.success("Jitsi meeting room created successfully");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to generate meet link");
    },
  });

  const updateMeetingMutation = trpc.meetings.update.useMutation({
    onSuccess: (data: any) => {
      utils.meetings.list.invalidate();
      
      if (data.conflicts && data.conflicts.length > 0) {
        const conflictTitles = data.conflicts.map((c: any) => c.title).join(', ');
        toast.warning(`Meeting updated, but conflicts with: ${conflictTitles}`, {
          duration: 5000,
        });
      } else {
        toast.success("Meeting updated successfully");
      }
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update meeting");
    },
  });
  
  const handleCancelMeeting = (meetingId: number, meetingTitle: string) => {
    if (confirm(`Are you sure you want to cancel "${meetingTitle}"?`)) {
      updateMeetingMutation.mutate({
        id: meetingId,
        status: "cancelled",
        cancellationReason: "Cancelled by secretary"
      });
    }
  };
  
  const handleRescheduleMeeting = (meetingId: number) => {
    const newDate = prompt("Enter new date and time (YYYY-MM-DDTHH:MM):");
    if (newDate) {
      try {
        const date = new Date(newDate);
        if (isNaN(date.getTime())) {
          toast.error("Invalid date format");
          return;
        }
        updateMeetingMutation.mutate({
          id: meetingId,
          meetingDate: date
        });
      } catch (error) {
        toast.error("Invalid date format");
      }
    }
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setMeetingDate("");
    setLocation("");
    setParticipants("");
    setSelectedParticipants([]);
    setManualEmail("");
    setTranscript("");
  };

  const handleCreate = () => {
    if (!title || !meetingDate) {
      toast.error("Please fill in required fields");
      return;
    }

    createMutation.mutate({
      title,
      description,
      meetingDate: new Date(meetingDate),
      location,
      participants: selectedParticipants.length > 0 ? selectedParticipants : undefined,
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
                  <Label className="text-foreground">Participants</Label>
                  <div className="space-y-2">
                    <select
                      className="w-full px-3 py-2 border rounded-md text-sm"
                      value=""
                      onChange={(e) => {
                        const email = e.target.value;
                        if (email && !selectedParticipants.includes(email)) {
                          setSelectedParticipants([...selectedParticipants, email]);
                        }
                      }}
                    >
                      <option value="">-- Select registered user --</option>
                      {users?.map(user => (
                        <option key={user.id} value={user.email || ''}>
                          {user.name || user.email}
                        </option>
                      ))}
                    </select>
                    <div className="flex gap-2">
                      <Input
                        value={manualEmail}
                        onChange={(e) => setManualEmail(e.target.value)}
                        placeholder="Or enter email manually"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && manualEmail && !selectedParticipants.includes(manualEmail)) {
                            e.preventDefault();
                            setSelectedParticipants([...selectedParticipants, manualEmail]);
                            setManualEmail("");
                          }
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          if (manualEmail && !selectedParticipants.includes(manualEmail)) {
                            setSelectedParticipants([...selectedParticipants, manualEmail]);
                            setManualEmail("");
                          }
                        }}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    {selectedParticipants.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {selectedParticipants.map((email, idx) => (
                          <span key={idx} className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full flex items-center gap-1">
                            {email}
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedParticipants(selectedParticipants.filter((_, i) => i !== idx));
                              }}
                              className="hover:text-blue-900"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
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
                    <div className="flex-1">
                      <CardTitle className="text-foreground">{meeting.title}</CardTitle>
                      <CardDescription className="text-foreground">
                        {new Date(meeting.meetingDate).toLocaleString()} • {meeting.location || 'No location'}
                      </CardDescription>
                      {meeting.minutesUrl && (
                        <a 
                          href={meeting.minutesUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1 mt-2"
                        >
                          <FileText className="h-3 w-3" />
                          View Summary in Google Drive <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        meeting.status === 'completed' ? 'bg-green-100 text-green-800' :
                        meeting.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {meeting.status}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const newCollapsed = new Set(collapsedMeetings);
                          if (newCollapsed.has(meeting.id)) {
                            newCollapsed.delete(meeting.id);
                          } else {
                            newCollapsed.add(meeting.id);
                          }
                          setCollapsedMeetings(newCollapsed);
                        }}
                      >
                        {collapsedMeetings.has(meeting.id) ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronUp className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                {!collapsedMeetings.has(meeting.id) && (
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
                  
                  {meeting.transcriptUrl && (
                    <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm font-medium text-green-800 mb-1">Transcript Available</p>
                      <a 
                        href={meeting.transcriptUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-green-600 hover:text-green-700 flex items-center gap-1"
                      >
                        View in Google Drive <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  )}
                  
                  {meeting.meetLink && (
                    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm font-medium text-blue-800 mb-2">Video Conference</p>
                      <Button
                        onClick={() => navigate(`/meeting-room/${meeting.id}`)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
                      >
                        🎥 Join Video Call
                      </Button>
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
                      {!meeting.meetLink && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => generateMeetLinkMutation.mutate({ id: meeting.id })}
                          disabled={generateMeetLinkMutation.isPending}
                        >
                          🎥 Create Video Room
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUploadTranscript(meeting.id)}
                        disabled={uploadTranscriptMutation.isPending}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Transcript
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedMeetingId(meeting.id);
                          // Call without transcript parameter - backend will fetch from Google Drive
                          generateSummaryMutation.mutate({ meetingId: meeting.id });
                        }}
                        disabled={generateSummaryMutation.isPending || !meeting.transcriptUrl}
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Generate Summary
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedMeetingId(meeting.id);
                          // Call without transcript parameter - backend will fetch from Google Drive
                          extractActionItemsMutation.mutate({ meetingId: meeting.id });
                        }}
                        disabled={extractActionItemsMutation.isPending || !meeting.transcriptUrl}
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
                      {meeting.status !== 'cancelled' && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRescheduleMeeting(meeting.id)}
                            disabled={updateMeetingMutation.isPending}
                          >
                            <CalendarClock className="h-4 w-4 mr-2" />
                            Reschedule
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCancelMeeting(meeting.id, meeting.title)}
                            disabled={updateMeetingMutation.isPending}
                            className="text-red-600 hover:text-red-700"
                          >
                            <X className="h-4 w-4 mr-2" />
                            Cancel Meeting
                          </Button>
                        </>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (confirm(`Are you sure you want to permanently delete "${meeting.title}"? This action cannot be undone.`)) {
                            deleteMeetingMutation.mutate({ id: meeting.id });
                          }
                        }}
                        disabled={deleteMeetingMutation.isPending}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
