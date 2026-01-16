import { useEffect, useRef } from 'react';

interface JitsiMeetProps {
  roomName: string;
  displayName?: string;
  onRecordingStatusChanged?: (recording: boolean) => void;
}

declare global {
  interface Window {
    JitsiMeetExternalAPI: any;
  }
}

export default function JitsiMeet({ 
  roomName, 
  displayName = 'Guest',
  onRecordingStatusChanged 
}: JitsiMeetProps) {
  const jitsiContainerRef = useRef<HTMLDivElement>(null);
  const jitsiApiRef = useRef<any>(null);

  useEffect(() => {
    // Load Jitsi Meet External API script
    const script = document.createElement('script');
    script.src = 'https://meet.jit.si/external_api.js';
    script.async = true;
    script.onload = () => initializeJitsi();
    document.body.appendChild(script);

    return () => {
      // Cleanup
      if (jitsiApiRef.current) {
        jitsiApiRef.current.dispose();
      }
      document.body.removeChild(script);
    };
  }, []);

  const initializeJitsi = () => {
    if (!jitsiContainerRef.current || !window.JitsiMeetExternalAPI) return;

    const domain = 'meet.jit.si';
    const options = {
      roomName: roomName,
      width: '100%',
      height: '100%',
      parentNode: jitsiContainerRef.current,
      userInfo: {
        displayName: displayName
      },
      configOverwrite: {
        startWithAudioMuted: false,
        startWithVideoMuted: false,
        enableRecording: true,
        fileRecordingsEnabled: true,
        liveStreamingEnabled: false,
      },
      interfaceConfigOverwrite: {
        TOOLBAR_BUTTONS: [
          'microphone',
          'camera',
          'closedcaptions',
          'desktop',
          'fullscreen',
          'fodeviceselection',
          'hangup',
          'profile',
          'recording',
          'livestreaming',
          'etherpad',
          'sharedvideo',
          'settings',
          'raisehand',
          'videoquality',
          'filmstrip',
          'feedback',
          'stats',
          'shortcuts',
          'tileview',
          'videobackgroundblur',
          'download',
          'help',
          'mute-everyone',
        ],
      },
    };

    jitsiApiRef.current = new window.JitsiMeetExternalAPI(domain, options);

    // Event listeners
    // Note: videoConferenceLeft fires for many internal Jitsi actions (login, settings, etc.)
    // We don't automatically navigate away to prevent interrupting user interactions
    // Users can use the Back button in the header to leave the meeting
    jitsiApiRef.current.addListener('videoConferenceJoined', () => {
      console.log('User joined the conference');
    });

    jitsiApiRef.current.addListener('recordingStatusChanged', (event: any) => {
      if (onRecordingStatusChanged) {
        onRecordingStatusChanged(event.on);
      }
    });
  };

  return (
    <div className="w-full h-full min-h-[600px]">
      <div ref={jitsiContainerRef} className="w-full h-full" />
    </div>
  );
}
