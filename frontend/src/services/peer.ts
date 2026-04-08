class PeerService {
  public peer: RTCPeerConnection | null = null;

  // Track all senders so we can swap tracks without full renegotiation
  private senders: Map<string, RTCRtpSender> = new Map();

  constructor() {
    this.reset();
  }

  reset() {
    if (this.peer) {
      this.peer.close();
      this.peer = null;
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