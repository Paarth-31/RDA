import { useState, useEffect, useCallback } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { HeroSection } from '@/components/sections/HeroSection';
import { HostCard } from '@/components/sections/HostCard';
import { JoinCard } from '@/components/sections/Joincard';
import { RecentSessions } from '@/components/sections/RecentSessions';
import { ContextDropdown } from '@/components/sections/ContextDropdown';
import { ChatPanel } from '@/components/ChatPanel';
import { MediaControls } from '@/components/MediaControls';
import { RemoteScreen } from '@/components/RemoteScreen';
import { usePeerConnection } from './hooks/usePeerConnection';

export default function App() {
  const generateId = () =>
    Math.floor(10000000000 + Math.random() * 90000000000).toString();

  const [myId, setMyId] = useState(generateId);
  const [remoteId, setRemoteId] = useState('');
  const [availableSources, setAvailableSources] = useState<any[]>([]);
  const [showPicker, setShowPicker] = useState(false);
  const [controlEnabled, setControlEnabled] = useState(false);
  // true = this app instance is the host (sharing its screen)
  const [isHost, setIsHost] = useState(false);

  const {
    connectionStatus,
    connectToPeer,
    myStream,
    remoteStream,
    startScreenShare,
    screenAudioEnabled,
    toggleScreenAudio,
    callStream,
    remoteCallStream,
    inCall,
    startCall,
    endCall,
    micEnabled,
    toggleMic,
    camEnabled,
    toggleCam,
    messages,
    sendChatMessage,
    cryptoReady,
    sendControlEvent,
  } = usePeerConnection(myId, remoteId);

  // Determine role: if myStream exists we are the host
  useEffect(() => {
    if (myStream) setIsHost(true);
  }, [myStream]);

  const remoteVideoRef = useCallback(
    (node: HTMLVideoElement | null) => {
      if (node && myStream) node.srcObject = myStream;
    },
    [myStream]
  );

  const callVideoRef = useCallback(
    (node: HTMLVideoElement | null) => {
      if (node && callStream) node.srcObject = callStream;
    },
    [callStream]
  );

  const remoteCallVideoRef = useCallback(
    (node: HTMLVideoElement | null) => {
      if (node && remoteCallStream) node.srcObject = remoteCallStream;
    },
    [remoteCallStream]
  );

  useEffect(() => {
    (window as any).electronAPI?.onSourcesResponse((sources: any[]) => {
      setAvailableSources(sources);
      setShowPicker(true);
    });
  }, []);

  const handleSourceSelect = (sourceId: string) => {
    (window as any).electronAPI?.selectSource(sourceId);
    setShowPicker(false);
  };

  const sessionActive = myStream || remoteStream;

  return (
    <div className="min-h-screen bg-background text-foreground bg-grid font-sans selection:bg-primary/30 flex flex-col overflow-hidden">
      <Navbar />

      <main className="flex-1 flex flex-col items-center justify-start pt-16 px-4 relative z-10">
        <HeroSection myId={myId} />

        <div
          className={`mb-4 px-4 py-2 rounded-full text-sm font-semibold transition-colors duration-300 ${
            connectionStatus === 'Connected'
              ? 'bg-green-500/20 text-green-400'
              : 'bg-gray-800 text-gray-400'
          }`}
        >
          Status: {connectionStatus}
        </div>

        {sessionActive ? (
          <div className="w-full max-w-6xl flex flex-col gap-4 animate-in fade-in zoom-in duration-500">

            {/* ── Video grid ─────────────────────────────────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              {/* My screen (host side) */}
              {myStream && (
                <div className="bg-black/50 border border-white/10 rounded-xl overflow-hidden relative aspect-video shadow-2xl">
                  <p className="absolute top-3 left-3 bg-black/60 px-2 py-1 rounded text-xs font-medium z-20 border border-white/5">
                    My screen (broadcasting)
                  </p>
                  <video ref={remoteVideoRef} autoPlay playsInline muted className="w-full h-full object-contain" />
                </div>
              )}

              {/* Remote screen — with control overlay */}
              {remoteStream && (
                <div
                  className="bg-black/50 border border-white/10 rounded-xl overflow-hidden relative aspect-video shadow-2xl"
                  onClick={() => !isHost && setControlEnabled((v) => !v)}
                >
                  <p className="absolute top-3 left-3 bg-black/60 px-2 py-1 rounded text-xs font-medium z-20 border border-white/5">
                    Remote screen{!isHost && ' · click to toggle control'}
                  </p>
                  <RemoteScreen
                    stream={remoteStream}
                    onControlEvent={sendControlEvent}
                    controlEnabled={controlEnabled && !isHost}
                  />
                </div>
              )}

              {/* My webcam (AV call) */}
              {callStream && (
                <div className="bg-black/50 border border-white/10 rounded-xl overflow-hidden relative aspect-video shadow-2xl">
                  <p className="absolute top-3 left-3 bg-black/60 px-2 py-1 rounded text-xs font-medium z-20 border border-white/5">
                    My camera
                  </p>
                  <video ref={callVideoRef} autoPlay playsInline muted className="w-full h-full object-contain" />
                </div>
              )}

              {/* Remote webcam */}
              {remoteCallStream && (
                <div className="bg-black/50 border border-white/10 rounded-xl overflow-hidden relative aspect-video shadow-2xl">
                  <p className="absolute top-3 left-3 bg-black/60 px-2 py-1 rounded text-xs font-medium z-20 border border-white/5">
                    Remote camera
                  </p>
                  <video ref={remoteCallVideoRef} autoPlay playsInline className="w-full h-full object-contain" />
                </div>
              )}
            </div>

            {/* ── Media controls bar ─────────────────────────────────────── */}
            <MediaControls
              inCall={inCall}
              micEnabled={micEnabled}
              camEnabled={camEnabled}
              screenAudioEnabled={screenAudioEnabled}
              onStartCall={startCall}
              onEndCall={endCall}
              onToggleMic={toggleMic}
              onToggleCam={toggleCam}
              onToggleScreenAudio={toggleScreenAudio}
              isHost={isHost}
            />

            {/* ── Chat panel ─────────────────────────────────────────────── */}
            <div className="h-80">
              <ChatPanel
                messages={messages}
                onSend={sendChatMessage}
                cryptoReady={cryptoReady}
              />
            </div>

            <button
              onClick={() => window.location.reload()}
              className="bg-red-500/10 hover:bg-red-500/20 text-red-500 py-3 rounded-lg border border-red-500/20 transition-all font-medium"
            >
              End remote session
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl relative">
            <div className="flex flex-col gap-4">
              <HostCard handleGenerateId={() => setMyId(generateId())} />
              <button
                onClick={startScreenShare}
                className="bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-lg font-semibold shadow-lg shadow-blue-600/20 transition-all transform active:scale-95"
              >
                📺 Start broadcasting my screen
              </button>
            </div>
            <JoinCard remoteId={remoteId} setRemoteId={setRemoteId} handleJoin={() => {
              if (!remoteId) { alert('Please enter a Remote ID.'); return; }
              connectToPeer(remoteId);
            }} />
            <ContextDropdown />
          </div>
        )}

        <div className="mt-12 w-full max-w-4xl">
          <RecentSessions />
        </div>

        {/* ── Source picker modal ─────────────────────────────────────────── */}
        {showPicker && (
          <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-6">
            <div className="bg-gray-900 rounded-xl p-6 w-full max-w-2xl">
              <h2 className="text-white font-semibold text-lg mb-4">Choose what to share</h2>
              <div className="grid grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                {availableSources.map((source) => (
                  <button
                    key={source.id}
                    onClick={() => handleSourceSelect(source.id)}
                    className="bg-gray-800 hover:bg-gray-700 rounded-lg p-3 flex flex-col items-center gap-2 transition-all border border-white/10 hover:border-blue-500/50"
                  >
                    <img src={source.thumbnail} className="w-full rounded" alt={source.name} />
                    <span className="text-white text-xs text-center truncate w-full">{source.name}</span>
                  </button>
                ))}
              </div>
              <button
                onClick={() => setShowPicker(false)}
                className="mt-4 w-full py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}