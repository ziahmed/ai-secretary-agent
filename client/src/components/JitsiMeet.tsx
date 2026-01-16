import { useEffect, useRef, useState } from 'react';
import { trpc } from '@/lib/trpc';

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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get JaaS token from backend
  const { data: jaasData, isLoading: isLoadingToken } = trpc.jaas.getToken.useQuery({
    roomName,
    enableRecording: true,
  });

  useEffect(() => {
    if (!jaasData || isLoadingToken) return;

    const loadJitsiScript = async () => {
      try {
        // Load JaaS External API script
        const script = document.createElement('script');
        script.src = jaasData.config.scriptUrl;
        script.async = true;
        
        script.onload = () => {
          initializeJitsi();
        };
        
        script.onerror = () => {
          setError('Failed to load Jitsi Meet. Please refresh the page.');
          setIsLoading(false);
        };

        document.body.appendChild(script);

        return () => {
          if (jitsiApiRef.current) {
            jitsiApiRef.current.dispose();
          }
          document.body.removeChild(script);
        };
      } catch (err) {
        setError('Failed to initialize video conference.');
        setIsLoading(false);
      }
    };

    loadJitsiScript();
  }, [jaasData, isLoadingToken]);

  const initializeJitsi = () => {
    if (!jitsiContainerRef.current || !window.JitsiMeetExternalAPI || !jaasData) return;

    try {
      const options = {
        roomName: `${jaasData.config.appId}/${roomName}`,
        width: '100%',
        height: '100%',
        parentNode: jitsiContainerRef.current,
        jwt: jaasData.token, // JWT token for authentication
        userInfo: {
          displayName: displayName
        },
        configOverwrite: {
          startWithAudioMuted: false,
          startWithVideoMuted: false,
          enableRecording: true,
          fileRecordingsEnabled: true,
          liveStreamingEnabled: false,
          prejoinPageEnabled: false,
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
            'settings',
            'raisehand',
            'videoquality',
            'filmstrip',
            'tileview',
            'videobackgroundblur',
            'help',
          ],
        },
      };

      jitsiApiRef.current = new window.JitsiMeetExternalAPI(jaasData.config.domain, options);

      // Event listeners
      jitsiApiRef.current.addListener('videoConferenceJoined', () => {
        console.log('User joined the conference');
        setIsLoading(false);
      });

      jitsiApiRef.current.addListener('recordingStatusChanged', (event: any) => {
        if (onRecordingStatusChanged) {
          onRecordingStatusChanged(event.on);
        }
      });

      jitsiApiRef.current.addListener('readyToClose', () => {
        console.log('Conference ended');
      });
    } catch (err) {
      console.error('Error initializing Jitsi:', err);
      setError('Failed to start video conference.');
      setIsLoading(false);
    }
  };

  if (isLoadingToken) {
    return (
      <div className="w-full h-full min-h-[600px] flex items-center justify-center bg-black">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Preparing video conference...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-full min-h-[600px] flex items-center justify-center bg-black">
        <div className="text-center text-white">
          <p className="text-red-400 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full min-h-[600px] relative">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black z-10">
          <div className="text-center text-white">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p>Joining meeting...</p>
          </div>
        </div>
      )}
      <div ref={jitsiContainerRef} className="w-full h-full" />
    </div>
  );
}
