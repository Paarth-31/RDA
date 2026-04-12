import { useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import peer from '../services/peer';
import {
  generateECDHKeyPair,
  importPublicKey,
  buildCryptoSession,
  encryptMessage,
  decryptMessage,
} from '../services/messageCrypto';

const SERVER_URL = 'https://rda-signaling.duckdns.org';

// ── Public types ─────────────────────────────────────────────────────────────

export interface ChatMessage {
  from: 'me' | 'them';
  text: string;
  timestamp: number;
}

// Remote control action sent over the control DataChannel
export interface ControlAction {
  type: 'mousemove' | 'mousedown' | 'mouseup' | 'click' | 'scroll' | 'keydown' | 'keyup';
  normX?: number;   // normalised 0-1 relative to the video element
  normY?: number;
  button?: 'left' | 'right' | 'middle';
  key?: string;
  scrollX?: number;
  scrollY?: number;
}

export interface MediaToggles {
  micEnabled: boolean;
  camEnabled: boolean;
  screenAudioEnabled: boolean;
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export const usePeerConnection = (myId: string, _remoteId: string, onFileChunk?: (data: ArrayBuffer | string) => void) => {
  // ── Connection state ──────────────────────────────────────────────────────
  const [socket, setSocket] = useState<Socket | null>(null);
  const [status, setStatus] = useState('Disconnected');

  // ── Stream state ──────────────────────────────────────────────────────────
  const [myStream, setMyStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

  // ── AV call state ─────────────────────────────────────────────────────────
  // Separate stream for webcam/mic — does not affect screen share stream
  const [callStream, setCallStream] = useState<MediaStream | null>(null);
  const [remoteCallStream, setRemoteCallStream] = useState<MediaStream | null>(null);
  const [inCall, setInCall] = useState(false);
  const [micEnabled, setMicEnabled] = useState(true);
  const [camEnabled, setCamEnabled] = useState(true);
  const [screenAudioEnabled, setScreenAudioEnabled] = useState(true);

  // ── Chat state ────────────────────────────────────────────────────────────
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [cryptoReady, setCryptoReady] = useState(false);

  // ── Refs ──────────────────────────────────────────────────────────────────
  const connectedUserRef = useRef<string | null>(null);
  const socketRef = useRef<Socket | null>(null);
  // Two separate data channels: "chat" (E2EE text) and "control" (mouse/kb)
  const chatChannelRef = useRef<RTCDataChannel | null>(null);
  const controlChannelRef = useRef<RTCDataChannel | null>(null);
  const fileChannelRef = useRef<RTCDataChannel | null>(null); // ← new
  const cryptoSessionRef = useRef<Awaited<ReturnType<typeof buildCryptoSession>> | null>(null);
  const myKeyPairRef = useRef<CryptoKeyPair | null>(null);
  // Keep track of whether this side is the initiator (created the data channels)
  const isInitiatorRef = useRef(false);
  const onFileChunkRef = useRef(onFileChunk);  // ← keep latest callback in ref
  // Keep ref in sync when callback changes
  useEffect(() => {
    onFileChunkRef.current = onFileChunk;
  }, [onFileChunk]);
  // Local tracks refs for toggling without re-negotiation
  const screenVideoSenderLabel = 'screen-video';
  const screenAudioSenderLabel = 'screen-audio';
  const micSenderLabel = 'mic-audio';
  const camSenderLabel = 'cam-video';

  // ── Attach file channel ──────────────────────────────────────────────────
  const attachFileChannel = useCallback((channel: RTCDataChannel) => {
    fileChannelRef.current = channel;
    channel.binaryType = 'arraybuffer';

    channel.onmessage = (event: MessageEvent) => {
      // Forward every message (string metadata or ArrayBuffer chunk) to the hook
      if (onFileChunkRef.current) {
        onFileChunkRef.current(event.data);
      }
    };

    channel.onerror = (e) => console.error('File channel error:', e);

    if (channel.readyState !== 'open') {
      channel.onopen = () => console.log('File channel opened');
    } else {
      console.log('File channel already open');
    }
  }, []);

  // ── Expose sendFileChunk so useFileTransfer can call it ──────────────────
  const sendFileChunk = useCallback((data: string | ArrayBuffer) => {
    if (!fileChannelRef.current || fileChannelRef.current.readyState !== 'open') {
      console.warn('File channel not open');
      return;
    }
    fileChannelRef.current.send(data as any);
  }, []);

  // ──────────────────────────────────────────────────────────────────────────
  // CHAT CHANNEL: E2EE via ECDH + AES-GCM + HMAC
  // ──────────────────────────────────────────────────────────────────────────

  const attachChatChannel = useCallback((channel: RTCDataChannel) => {
    chatChannelRef.current = channel;

    const sendPublicKey = async () => {
      try {
        const { keyPair, exportedPublic } = await generateECDHKeyPair();
        myKeyPairRef.current = keyPair;
        channel.send(JSON.stringify({ type: 'ecdh-public-key', key: exportedPublic }));
        console.log('Sent ECDH public key');
      } catch (e) {
        console.error('Failed to send public key:', e);
      }
    };

    channel.onmessage = async (event: MessageEvent) => {
      // Binary = encrypted message
      if (event.data instanceof ArrayBuffer) {
        if (!cryptoSessionRef.current) return;
        try {
          const plaintext = await decryptMessage(
            cryptoSessionRef.current,
            new Uint8Array(event.data)
          );
          setMessages((prev) => [...prev, { from: 'them', text: plaintext, timestamp: Date.now() }]);
        } catch (e) {
          console.error('Decryption failed:', e);
        }
        return;
      }
      // Text = ECDH handshake
      if (typeof event.data === 'string') {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'ecdh-public-key') {
            if (!myKeyPairRef.current) {
              // Race: our key isn't generated yet — retry after a tick
              setTimeout(
                () => channel.dispatchEvent(new MessageEvent('message', { data: event.data })),
                100
              );
              return;
            }
            const theirPublicKey = await importPublicKey(msg.key);
            const session = await buildCryptoSession(
              myKeyPairRef.current.privateKey,
              theirPublicKey
            );
            cryptoSessionRef.current = session;
            setCryptoReady(true);
            console.log('Crypto session established — chat ready');
          }
        } catch (e) {
          console.error('Handshake error:', e);
        }
      }
    };

    channel.onerror = (e) => console.error('Chat channel error:', e);
    channel.onclose = () => {
      console.log('Chat channel closed');
      setCryptoReady(false);
    };

    if (channel.readyState === 'open') {
      sendPublicKey();
    } else {
      channel.onopen = () => {
        console.log('Chat channel opened');
        sendPublicKey();
      };
    }
  }, []);

  // ──────────────────────────────────────────────────────────────────────────
  // CONTROL CHANNEL: mouse + keyboard events (plain JSON, low-latency)
  // ──────────────────────────────────────────────────────────────────────────

  const attachControlChannel = useCallback((channel: RTCDataChannel) => {
    controlChannelRef.current = channel;

    // Receiver side: execute actions via Electron IPC → robot.js
    channel.onmessage = (event: MessageEvent) => {
      if (typeof event.data !== 'string') return;
      try {
        const action: ControlAction = JSON.parse(event.data);
        // Forward to main process which runs robot.js
        (window as any).electronAPI?.sendControlAction(action);
      } catch (e) {
        console.error('Control event parse error:', e);
      }
    };

    channel.onerror = (e) => console.error('Control channel error:', e);

    if (channel.readyState !== 'open') {
      channel.onopen = () => console.log('Control channel opened');
    }
  }, []);

  // ──────────────────────────────────────────────────────────────────────────
  // MAIN SOCKET + WebRTC EFFECT
  // ──────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    peer.reset();
    const newSocket = io(SERVER_URL, { rejectUnauthorized: false });
    setSocket(newSocket);
    socketRef.current = newSocket;

    newSocket.on('connect', () => {
      setStatus('Connected');
      console.log('Socket connected:', newSocket.id);
      newSocket.emit('join-room', myId);
    });

    newSocket.on('disconnect', () => setStatus('Disconnected'));

    // ── Initiator: remote peer joined my room ─────────────────────────────
    newSocket.on('user-connected', async (socketId: string) => {
      console.log('Remote peer joined, socket ID:', socketId);
      connectedUserRef.current = socketId;
      isInitiatorRef.current = true;

      if (peer.peer) {
        // Create BOTH data channels before the offer — included in SDP negotiation
        const chatCh = peer.peer.createDataChannel('chat', { ordered: true });
        const ctrlCh = peer.peer.createDataChannel('control', {
          ordered: false,     // control events are best-effort, low-latency
          maxRetransmits: 0,
        });
        const fileCh = peer.peer.createDataChannel('file-transfer', { // ← new
          ordered: true,
          maxRetransmits: 30,
        });
        attachChatChannel(chatCh);
        attachControlChannel(ctrlCh);
        attachFileChannel(fileCh); // ← new
      }

      // Auto-start screen share with system audio
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: { frameRate: { ideal: 30 } },
          audio: true, // Chromium/Electron will use loopback audio from main.ts
        });
        setMyStream(stream);

        // Add video track
        const videoTrack = stream.getVideoTracks()[0];
        if (videoTrack) {
          peer.addTrack(videoTrack, stream, screenVideoSenderLabel);
        }
        // Add audio track (system audio) if present
        const audioTrack = stream.getAudioTracks()[0];
        if (audioTrack) {
          peer.addTrack(audioTrack, stream, screenAudioSenderLabel);
        }

        const offer = await peer.getOffer();
        newSocket.emit('call-user', {
          userToCall: socketId,
          from: newSocket.id,
          signalData: offer,
        });
      } catch (err) {
        console.error('Auto screen share failed:', err);
      }
    });

    // ── Receiver: incoming offer ──────────────────────────────────────────
    newSocket.on('incoming-call', async ({ from, signal }) => {
      console.log('Incoming call from:', from, 'type:', signal?.type);
      connectedUserRef.current = from;
      isInitiatorRef.current = false;
      const answer = await peer.getAnswer(signal);
      newSocket.emit('answer-call', { to: from, signal: answer });
    });

    // ── Initiator: answer received ────────────────────────────────────────
    newSocket.on('call-accepted', async (data) => {
      console.log('Call accepted:', data);
      const signal = data?.signal ?? data;
      await peer.setRemoteDescription(signal);
    });

    // ── ICE candidates ────────────────────────────────────────────────────
    newSocket.on('ice-candidate', async ({ candidate }) => {
      if (peer.peer) {
        await peer.peer.addIceCandidate(new RTCIceCandidate(candidate));
      }
    });

    if (peer.peer) {
      // Remote tracks arrive here — distinguish screen vs call streams by track count/kind
      // We use a composite remote stream and let the UI split by track kind
      peer.peer.addEventListener('track', (ev: RTCTrackEvent) => {
        console.log('Remote track received:', ev.track.kind);
        const stream = ev.streams[0];
        if (ev.track.kind === 'video') {
          // Check if this is a webcam video (second video track) or screen share
          const existingVideoTracks = remoteStream?.getVideoTracks() ?? [];
          if (existingVideoTracks.length === 0) {
            setRemoteStream(stream);
          } else {
            // Second video track = webcam from AV call
            setRemoteCallStream(stream);
          }
        } else if (ev.track.kind === 'audio') {
          // Audio goes onto whichever stream already has audio or the first stream
          setRemoteStream((prev) => {
            if (!prev) return stream;
            // Add audio track to existing remote stream
            stream.getAudioTracks().forEach((t) => prev.addTrack(t));
            return prev;
          });
        }
      });

      // Receiver side data channels
      peer.peer.ondatachannel = (event: RTCDataChannelEvent) => {
        console.log('ondatachannel:', event.channel.label);
        if (event.channel.label === 'chat') {
          attachChatChannel(event.channel);
        } else if (event.channel.label === 'control') {
          attachControlChannel(event.channel);
        } else if (event.channel.label === 'file-transfer') { // ← new
          attachFileChannel(event.channel);
        }
      };

      peer.peer.onicecandidate = (event) => {
        if (event.candidate && connectedUserRef.current) {
          socketRef.current?.emit('ice-candidate', {
            target: connectedUserRef.current,
            candidate: event.candidate,
          });
        }
      };
    }

    return () => {
      newSocket.disconnect();
      socketRef.current = null;
    };
  }, [myId, attachChatChannel, attachControlChannel, attachFileChannel]);

  // ──────────────────────────────────────────────────────────────────────────
  // PUBLIC ACTIONS
  // ──────────────────────────────────────────────────────────────────────────

  // User B: join User A's room
  const connectToPeer = useCallback(async (targetId: string) => {
    if (!socketRef.current) return;
    console.log('Joining room:', targetId);
    socketRef.current.emit('join-room', targetId);
  }, []);

  // User A: manual screen share trigger (for non-auto path)
  const startScreenShare = useCallback(async () => {
    if (!socketRef.current || !connectedUserRef.current) {
      alert('No remote peer connected yet.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: { ideal: 30 } },
        audio: true,
      });
      setMyStream(stream);

      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) peer.addTrack(videoTrack, stream, screenVideoSenderLabel);

      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) peer.addTrack(audioTrack, stream, screenAudioSenderLabel);

      const offer = await peer.getOffer();
      socketRef.current.emit('call-user', {
        userToCall: connectedUserRef.current,
        from: socketRef.current.id,
        signalData: offer,
      });
    } catch (err) {
      console.error('Screen share failed:', err);
    }
  }, []);

  // ── Toggle screen audio on/off without renegotiation ─────────────────────
  const toggleScreenAudio = useCallback(async () => {
    setScreenAudioEnabled((prev) => {
      const next = !prev;
      // replaceTrack with null = mute; with original track = unmute
      const audioTrack = myStream?.getAudioTracks()[0] ?? null;
      peer.replaceTrack(screenAudioSenderLabel, next ? audioTrack : null);
      return next;
    });
  }, [myStream]);

  // ── Audio/video call: start a webcam+mic call ─────────────────────────────
  const startCall = useCallback(async (withVideo = true) => {
    if (!socketRef.current || !connectedUserRef.current) {
      alert('No remote peer connected yet.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: withVideo,
      });
      setCallStream(stream);
      setInCall(true);

      const micTrack = stream.getAudioTracks()[0];
      if (micTrack) peer.addTrack(micTrack, stream, micSenderLabel);

      const camTrack = stream.getVideoTracks()[0];
      if (camTrack && withVideo) peer.addTrack(camTrack, stream, camSenderLabel);

      // Renegotiate — new tracks require a new offer
      const offer = await peer.getOffer();
      socketRef.current.emit('call-user', {
        userToCall: connectedUserRef.current,
        from: socketRef.current.id,
        signalData: offer,
      });
    } catch (err) {
      console.error('Call start failed:', err);
    }
  }, []);

  // ── End the AV call (keeps screen share running) ─────────────────────────
  const endCall = useCallback(() => {
    callStream?.getTracks().forEach((t) => t.stop());
    peer.removeTrack(micSenderLabel);
    peer.removeTrack(camSenderLabel);
    setCallStream(null);
    setRemoteCallStream(null);
    setInCall(false);
  }, [callStream]);

  // ── Toggle microphone ─────────────────────────────────────────────────────
  const toggleMic = useCallback(() => {
    setMicEnabled((prev) => {
      const next = !prev;
      const track = callStream?.getAudioTracks()[0];
      if (track) track.enabled = next;
      return next;
    });
  }, [callStream]);

  // ── Toggle camera ─────────────────────────────────────────────────────────
  const toggleCam = useCallback(() => {
    setCamEnabled((prev) => {
      const next = !prev;
      const track = callStream?.getVideoTracks()[0];
      if (track) {
        track.enabled = next;
        // replaceTrack with null = black frame; with track = live video
        peer.replaceTrack(camSenderLabel, next ? track : null);
      }
      return next;
    });
  }, [callStream]);

  // ── Send encrypted chat message ───────────────────────────────────────────
  const sendChatMessage = useCallback(async (text: string) => {
    if (!cryptoSessionRef.current || !chatChannelRef.current) {
      console.warn('Chat not ready');
      return;
    }
    if (chatChannelRef.current.readyState !== 'open') {
      console.warn('Chat channel not open');
      return;
    }
    try {
      const encrypted = await encryptMessage(cryptoSessionRef.current, text);
      chatChannelRef.current.send(encrypted.buffer as ArrayBuffer);
      setMessages((prev) => [...prev, { from: 'me', text, timestamp: Date.now() }]);
    } catch (e) {
      console.error('Send failed:', e);
    }
  }, []);

  // ── Send a remote control event to the host machine ──────────────────────
  // Called by the Controller side (the person watching the remote screen).
  // Events are sent over the "control" DataChannel as plain JSON.
  const sendControlEvent = useCallback((action: ControlAction) => {
    if (!controlChannelRef.current || controlChannelRef.current.readyState !== 'open') return;
    controlChannelRef.current.send(JSON.stringify(action));
  }, []);

  return {
    // Connection
    connectionStatus: status,
    connectToPeer,
    // Screen share
    myStream,
    remoteStream,
    startScreenShare,
    screenAudioEnabled,
    toggleScreenAudio,
    // AV call
    callStream,
    remoteCallStream,
    inCall,
    startCall,
    endCall,
    micEnabled,
    toggleMic,
    camEnabled,
    toggleCam,
    // Chat
    messages,
    sendChatMessage,
    cryptoReady,
    // Remote control
    sendControlEvent,
    sendFileChunk,  // ← new export
  };
};