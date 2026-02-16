class PeerService{
	public peer: RTCPeerConnection | null=null;

	constructor(){
		if(!this.peer){
			this.peer = new RTCPeerConnection({
				iceServers: [
					{
						urls: [
							"stun:stun.l.google.com:19302",
							"stun:global.stun.twilio.com:3478",
						],
					},
				],
			});
		}
	}
	
	//Create Offer(User A initiation)
	async getOffer(): Promise<RTCSessionDescriptionInit | undefined> {
		if(this.peer){
			const offer = await this.peer.createOffer();
			await this.peer.setLocalDescription(new RTCSessionDescription(offer));
			return offer;
		}
	}

	//Create Answer(User B responds)
	async getAnswer(offer: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit | undefined>{
		if(this.peer){
			await this.peer.setRemoteDescription(offer);
			const answer = await this.peer.createAnswer();
			await this.peer.setLocalDescription(new RTCSessionDescription(answer));
			return answer;
		}
	}

	//Set Remote Description (Finalised by User A)
	async setLocalDescription(ans: RTCSessionDescriptionInit){
		if(this.peer){
			await this.peer.setRemoteDescription(new RTCSessionDescription(ans));
		}
	}

	//Add Stream(Audio/Video)
	addStream(stream: MediaStream){
		if(this.peer){
			stream.getTracks().forEach((track) => {
				this.peer?.addTrack(track, stream);
			});
		}
	}

	//Cleanup
	close(){
		if(this.peer){
			this.peer.close();
			this.peer=null;
		}
	}
}

export default new PeerService();
