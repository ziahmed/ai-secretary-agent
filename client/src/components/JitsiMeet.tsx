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
  const scriptLoadedRef = useRef(false);

  // Fetch JaaS token (happens in parallel with script loading)
  const { data: jaasData, isLoading: isLoadingToken, error: tokenError } = trpc.jaas.getToken.useQuery({
    roomName,
    enableRecording: true,
  });
  
  // Handle token fetch error
  useEffect(() => {
    if (tokenError) {
      console.error('[JitsiMeet] Token fetch error:', tokenError);
      setError(`Failed to authenticate with video service: ${tokenError.message}`);
      setIsLoading(false);
    }
  }, [tokenError]);

  // Load JaaS External API script once
  useEffect(() => {
    if (scriptLoadedRef.current || !jaasData) return;

    const existingScript = document.querySelector(`script[src="${jaasData.config.scriptUrl}"]`);
    if (existingScript) {
      scriptLoadedRef.current = true;
      if (window.JitsiMeetExternalAPI) {
        initializeJitsi();
      }
      return;
    }

    const script = document.createElement('script');
    script.src = jaasData.config.scriptUrl;
    script.async = true;
    
    script.onload = () => {
      scriptLoadedRef.current = true;
      initializeJitsi();
    };
    
    script.onerror = () => {
      setError('Failed to load Jitsi Meet. Please refresh the page.');
      setIsLoading(false);
    };

    document.body.appendChild(script);

    return () => {
      if (jitsiApiRef.current) {
        try {
          jitsiApiRef.current.dispose();
        } catch (e) {
          console.error('Error disposing Jitsi API:', e);
        }
      }
    };
  }, [jaasData]);

  const initializeJitsi = () => {
    if (!jitsiContainerRef.current || !window.JitsiMeetExternalAPI || !jaasData) {
      return;
    }

    // Prevent double initialization
    if (jitsiApiRef.current) {
      return;
    }

    try {
      const options = {
        roomName: `${jaasData.config.appId}/${roomName}`,
        width: '100%',
        height: '100%',
        parentNode: jitsiContainerRef.current,
        jwt: jaasData.token,
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
          // Performance optimizations
          disableDeepLinking: true,
          enableNoAudioDetection: false,
          enableNoisyMicDetection: false,
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
          SHOW_JITSI_WATERMARK: false,
          SHOW_WATERMARK_FOR_GUESTS: false,
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

      // Set loading to false after a timeout as fallback
      setTimeout(() => {
        setIsLoading(false);
      }, 5000);

    } catch (err) {
      console.error('Error initializing Jitsi:', err);
      setError('Failed to start video conference.');
      setIsLoading(false);
    }
  };

  if (tokenError) {
    return (
      <div className="w-full h-full min-h-[600px] flex items-center justify-center bg-black">
        <div className="text-center text-white">
          <p className="text-red-400 mb-4">Failed to authenticate with video service</p>
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

  if (isLoadingToken) {
    return (
      <div className="w-full h-full min-h-[600px] flex items-center justify-center bg-black">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Authenticating...</p>
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
    <div className="w-full h-full relative">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black z-10">
          <div className="text-center text-white">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p>Joining meeting...</p>
            <p className="text-sm text-gray-400 mt-2">This may take a few moments</p>
          </div>
        </div>
      )}
      <div ref={jitsiContainerRef} className="w-full h-full absolute inset-0" />
    </div>
  );
}
