import { useEffect, useRef, useState } from 'react';

interface JitsiMeetProps {
  roomName: string;
  displayName?: string;
  onRecordingStatusChanged?: (recording: boolean) => void;
}

export default function JitsiMeet({ 
  roomName, 
  displayName = 'Guest',
  onRecordingStatusChanged 
}: JitsiMeetProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [iframeUrl, setIframeUrl] = useState<string>('');

  useEffect(() => {
    // Build Jitsi Meet iframe URL with proper configuration
    // Using direct iframe embedding (not External API) to avoid 5-minute demo limitation
    const baseUrl = 'https://meet.jit.si';
    const params = new URLSearchParams({
      // User configuration
      'userInfo.displayName': displayName,
      
      // Interface configuration - hide Jitsi branding and unnecessary elements
      'config.prejoinPageEnabled': 'false', // Skip pre-join page
      'config.startWithAudioMuted': 'false',
      'config.startWithVideoMuted': 'false',
      
      // Enable recording features
      'config.fileRecordingsEnabled': 'true',
      'config.liveStreamingEnabled': 'false',
      
      // Toolbar configuration
      'config.toolbarButtons': JSON.stringify([
        'microphone',
        'camera',
        'closedcaptions',
        'desktop',
        'fullscreen',
        'fodeviceselection',
        'hangup',
        'profile',
        'recording',
        'settings',
        'raisehand',
        'videoquality',
        'filmstrip',
        'tileview',
        'videobackgroundblur',
        'help',
      ]),
      
      // Disable demo warning
      'config.disableDeepLinking': 'true',
    });

    const url = `${baseUrl}/${roomName}?${params.toString()}`;
    setIframeUrl(url);
  }, [roomName, displayName]);

  // Listen for messages from Jitsi iframe for recording status
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Only accept messages from Jitsi Meet domain
      if (event.origin !== 'https://meet.jit.si') return;

      try {
        const data = event.data;
        
        // Handle recording status changes
        if (data.event === 'recordingStatusChanged' && onRecordingStatusChanged) {
          onRecordingStatusChanged(data.on === true);
        }
      } catch (error) {
        console.error('Error handling Jitsi message:', error);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onRecordingStatusChanged]);

  return (
    <div className="w-full h-full min-h-[600px]">
      {iframeUrl && (
        <iframe
          ref={iframeRef}
          src={iframeUrl}
          allow="camera; microphone; fullscreen; display-capture; autoplay"
          className="w-full h-full border-0"
          title="Jitsi Meet Video Conference"
        />
      )}
    </div>
  );
}
