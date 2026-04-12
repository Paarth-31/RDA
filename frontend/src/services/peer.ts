class PeerService {
  public peer: RTCPeerConnection | null = null;
  public chatChannel: RTCDataChannel | null = null;
  public fileChannel: RTCDataChannel | null = null;

  private static CHUNK_SIZE = 16 * 1024; // 16KB per chunk
  // Track all senders so we can swap tracks without full renegotiation
  private senders: Map<string, RTCRtpSender> = new Map();

  constructor() {
    this.reset();
  }

  reset() {
    if (this.peer) {
      this.peer.close();
      this.peer = null;
      this.chatChannel = null;
      this.fileChannel = null;
    }
    this.senders.clear();
    this.peer = new RTCPeerConnection({
      iceServers: [
        {
          urls: 'turns:rda-turnserver.duckdns.org:5349',
          username: 'rda',
          credential: 'rda123',
        },
      ],
    });

    // File transfer channel — binary, ordered delivery
    this.fileChannel = this.peer.createDataChannel('file-transfer', {
      ordered: true,        // files must arrive in order
      maxRetransmits: 30,   // retry dropped packets
    });
    this.fileChannel.binaryType = 'arraybuffer';
  }

  // Called on the RECEIVING side when peer creates a channel
  setupIncomingChannels(
    onChat: (msg: any) => void,
    onFileChunk: (data: ArrayBuffer | string) => void
  ) {
    if (!this.peer) return;
    this.peer.ondatachannel = (event) => {
      const channel = event.channel;
      if (channel.label === 'file-transfer') {
        channel.binaryType = 'arraybuffer';
        this.fileChannel = channel;
        channel.onmessage = (e) => onFileChunk(e.data);
      }
      if (channel.label === 'chat') {
        this.chatChannel = channel;
        channel.onmessage = (e) => onChat(JSON.parse(e.data));
      }
    };
  }

  // Send a file in chunks
  async sendFile(
    file: File,
    onProgress: (percent: number) => void
  ): Promise<void> {
    if (!this.fileChannel || this.fileChannel.readyState !== 'open') {
      throw new Error('File channel not open');
    }

    const totalChunks = Math.ceil(file.size / PeerService.CHUNK_SIZE);

    // 1. Send metadata first as JSON string
    const metadata = JSON.stringify({
      type: 'file-meta',
      name: file.name,
      size: file.size,
      mimeType: file.type,
      totalChunks,
    });
    this.fileChannel.send(metadata);

    // 2. Read and send chunks
    const arrayBuffer = await file.arrayBuffer();
    let chunkIndex = 0;

    const sendNextChunk = () => {
      return new Promise<void>((resolve) => {
        const sendChunk = () => {
          // Respect buffer limits — pause if buffer is getting full
          if (this.fileChannel!.bufferedAmount > 5 * 1024 * 1024) {
            setTimeout(sendChunk, 100);
            return;
          }

          if (chunkIndex >= totalChunks) {
            // Send completion signal
            this.fileChannel!.send(JSON.stringify({ type: 'file-complete' }));
            onProgress(100);
            resolve();
            return;
          }

          const start = chunkIndex * PeerService.CHUNK_SIZE;
          const end = Math.min(start + PeerService.CHUNK_SIZE, file.size);
          const chunk = arrayBuffer.slice(start, end);

          this.fileChannel!.send(chunk);
          chunkIndex++;
          onProgress(Math.round((chunkIndex / totalChunks) * 100));
          setTimeout(sendChunk, 0); // yield to event loop between chunks
        };
        sendChunk();
      });
    };

    await sendNextChunk();
  }

  // ── Add a track and remember its sender by a label ───────────────────────
  addTrack(track: MediaStreamTrack, stream: MediaStream, label?: string): RTCRtpSender {
    const sender = this.peer!.addTrack(track, stream);
    const key = label ?? `${track.kind}-${track.id}`;
    this.senders.set(key, sender);
    return sender;
  }

  // ── Replace a track on an existing sender (no full renegotiation needed) ─
  async replaceTrack(label: string, newTrack: MediaStreamTrack | null): Promise<boolean> {
    const sender = this.senders.get(label);
    if (!sender) return false;
    await sender.replaceTrack(newTrack);
    return true;
  }

  // ── Remove a sender entirely (requires renegotiation) ───────────────────
  removeTrack(label: string) {
    const sender = this.senders.get(label);
    if (sender && this.peer) {
      this.peer.removeTrack(sender);
      this.senders.delete(label);
    }
  }

  getSender(label: string): RTCRtpSender | undefined {
    return this.senders.get(label);
  }

  async getOffer(): Promise<RTCSessionDescriptionInit | undefined> {
    if (!this.peer) return;
    const offer = await this.peer.createOffer();
    await this.peer.setLocalDescription(new RTCSessionDescription(offer));
    return offer;
  }

  async getAnswer(offer: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit | undefined> {
    if (!this.peer) return;
    await this.peer.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await this.peer.createAnswer();
    await this.peer.setLocalDescription(new RTCSessionDescription(answer));
    return answer;
  }

  async setRemoteDescription(ans: RTCSessionDescriptionInit) {
    if (!this.peer) return;
    await this.peer.setRemoteDescription(new RTCSessionDescription(ans));
  }

  close() {
    if (this.peer) {
      this.peer.close();
      this.peer = null;
    }
    this.senders.clear();
  }
}

export default new PeerService();