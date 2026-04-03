class PeerService{
	public peer: RTCPeerConnection | null=null;

	constructor(){
		if(!this.peer){
			this.peer = new RTCPeerConnection({
				iceServers: [
					{
                  		urls: "turns:rda-turnserver.duckdns.org:5349", // <-- turns: and 5349 are crucial!
    					username: //Username,
    					credential: //Password,
}
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
			await this.peer.setRemoteDescription(new RTCSessionDescription(offer));
			const answer = await this.peer.createAnswer();
			await this.peer.setLocalDescription(new RTCSessionDescription(answer));
			return answer;
		}
	}

	//Set Remote Description (Finalised by User A)
	async setRemoteDescription(ans: RTCSessionDescriptionInit){
		if(this.peer){
			await this.peer.setRemoteDescription(new RTCSessionDescription(ans));
		}
	}

	//Add Stream(Audio/Video)
	addStream(stream: MediaStream){
		if(this.peer){
			stream.getTracks().forEach((track) => {
				const alreadyAdded = this.peer?.getSenders().find(s => s.track === track);
				if(!alreadyAdded) this.peer?.addTrack(track, stream);
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
