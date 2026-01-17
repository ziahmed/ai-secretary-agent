import { useParams, useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import JitsiMeet from '@/components/JitsiMeet';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { AudioRecorder } from '@/components/AudioRecorder';
import { toast } from 'sonner';

export default function MeetingRoom() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const [isRecording, setIsRecording] = useState(false);
  const [showRecorder, setShowRecorder] = useState(false);

  // Fetch meeting details
  const { data: meeting, isLoading, error } = trpc.meetings.getById.useQuery(
    { id: parseInt(id || '0') },
    { enabled: !!id }
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading meeting...</p>
        </div>
      </div>
    );
  }

  if (error || !meeting) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center text-white">
          <p className="text-red-400 mb-4">Meeting not found</p>
          <Button onClick={() => setLocation('/meetings')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Meetings
          </Button>
        </div>
      </div>
    );
  }

  // Extract room code from meeting link
  // Example: https://meet.jit.si/room-code-123 -> room-code-123
  const extractRoomCode = (link: string) => {
    try {
      const url = new URL(link);
      return url.pathname.substring(1); // Remove leading slash
    } catch {
      // If not a valid URL, treat the whole string as room code
      return link;
    }
  };

  const roomCode = extractRoomCode(meeting.meetLink || '');

  return (
    <div className="h-screen bg-black flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800 px-4 py-2 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation('/meetings')}
            className="text-white hover:bg-gray-800"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-white font-semibold">{meeting.title}</h1>
            <p className="text-gray-400 text-sm">
              {new Date(meeting.meetingDate).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>
        </div>
        {isRecording && (
          <div className="flex items-center gap-2 text-red-500">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
            <span className="font-medium">Recording</span>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden flex">
        {/* Jitsi Meet Container */}
        <div className="flex-1 overflow-hidden">
          <JitsiMeet
            roomName={roomCode}
            displayName="User"
            onRecordingStatusChanged={setIsRecording}
          />
        </div>

        {/* Audio Recorder Sidebar */}
        <div className="flex flex-col bg-gray-900 border-l border-gray-800">
          {/* Toggle Button */}
          <button
            onClick={() => setShowRecorder(!showRecorder)}
            className="px-4 py-3 text-white hover:bg-gray-800 flex items-center gap-2 border-b border-gray-800"
          >
            {showRecorder ? (
              <>
                <ChevronUp className="w-4 h-4" />
                <span className="text-sm font-medium">Hide Recorder</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4" />
                <span className="text-sm font-medium">Show Recorder</span>
              </>
            )}
          </button>

          {/* Recorder Panel */}
          {showRecorder && (
            <div className="w-80 p-4 overflow-y-auto">
              <AudioRecorder
                meetingId={parseInt(id || '0')}
                onTranscriptComplete={(transcript) => {
                  toast({
                    title: 'Transcript saved',
                    description: 'Meeting transcript has been saved successfully',
                  });
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
