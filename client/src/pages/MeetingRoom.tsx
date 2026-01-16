import { useEffect, useState } from 'react';
import { useLocation, useRoute } from 'wouter';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import JitsiMeet from '@/components/JitsiMeet';
import { ArrowLeft, Video, Circle } from 'lucide-react';
import { toast } from 'sonner';


export default function MeetingRoom() {
  const [, params] = useRoute('/meeting-room/:id');
  const [, setLocation] = useLocation();
  const { data: authUser } = trpc.auth.me.useQuery();
  const [isRecording, setIsRecording] = useState(false);
  
  const meetingId = params?.id ? parseInt(params.id) : null;
  const { data: meeting, isLoading } = trpc.meetings.getById.useQuery(
    { id: meetingId! },
    { enabled: !!meetingId }
  );

  const handleRecordingStatusChanged = (recording: boolean) => {
    setIsRecording(recording);
    if (recording) {
      toast.success('Recording started');
    } else {
      toast.info('Recording stopped');
    }
  };

  if (isLoading) {
    return (
      <div className="container py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4">Loading meeting...</p>
        </div>
      </div>
    );
  }

  if (!meeting) {
    return (
      <div className="container py-8">
        <Card>
          <CardContent className="py-12 text-center">
            <p>Meeting not found</p>
            <Button onClick={() => setLocation('/meetings')} className="mt-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Meetings
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Extract room code from Jitsi link
  const getRoomCode = (meetLink: string | null) => {
    if (!meetLink) return 'default-room';
    const match = meetLink.match(/meet\.jit\.si\/(.+)/);
    return match ? match[1] : 'default-room';
  };

  const roomCode = getRoomCode(meeting.meetLink);

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="bg-background border-b p-4">
        <div className="container flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation('/meetings')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-xl font-semibold">{meeting.title}</h1>
              <p className="text-sm text-muted-foreground">
                {new Date(meeting.meetingDate).toLocaleString()}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isRecording && (
              <div className="flex items-center gap-2 text-red-600 animate-pulse">
                <Circle className="h-3 w-3 fill-current" />
                <span className="text-sm font-medium">Recording</span>
              </div>
            )}
            <Video className="h-5 w-5 text-muted-foreground" />
          </div>
        </div>
      </div>

      {/* Jitsi Meeting Container */}
      <div className="flex-1 bg-black">
        <JitsiMeet
          roomName={roomCode}
          displayName={authUser?.name || authUser?.email || 'Guest'}
          onRecordingStatusChanged={handleRecordingStatusChanged}
        />
      </div>

      {/* Footer Info */}
      <div className="bg-background border-t p-2">
        <div className="container">
          <p className="text-xs text-muted-foreground text-center">
            💡 Tip: Click the record button in the toolbar to start recording. Recordings can be used to generate transcripts and summaries.
          </p>
        </div>
      </div>
    </div>
  );
}
