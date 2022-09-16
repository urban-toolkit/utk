// import { Signaling, WebSocketSignaling } from "../../js/signaling.js";
import { Signaling, WebSocketSignaling } from "./signaling.js";
// import Peer from "../../js/peer.js";
import Peer from "./peer.js";
// import * as Logger from "../../js/logger.js";
import * as Logger from "./logger.js";
// import { runInThisContext } from "vm";

export class SendVideo {
  constructor() {
    this.pc = null;
    this.localCanvas;
    this.preferedCodecs = null;
    this.ondisconnect = function (message) { Logger.log(`Disconnect peer. message:${message}`); };
  }

  async startVideo(localCanvas) {
      this.localCanvas = localCanvas;
      console.log(localCanvas);
      this.localStream = this.localCanvas.captureStream(25); 
      // let localVideo = document.querySelector('video');
      // localVideo.srcObject = this.localStream;
      // let ctx = this.localCanvas.getContext("webgl2");  
      // console.log(ctx);
      // console.log(this.localStream.getTracks()[0].muted);
      // let ctx = this.localCanvas.getContext("2d");  
      // setInterval(function() { ctx.fillRect(10,10,150,80); }, 25); 
  }

  async setupConnection(connectionId, useWebSocket, codecs) {
    const _this = this;
    this.preferedCodecs = codecs;

    if (useWebSocket) {
      this.signaling = new WebSocketSignaling();
    } else {
      this.signaling = new Signaling();
    }

    this.signaling.addEventListener('connect', async (e) => {
      const data = e.detail;
      _this.prepareNewPeerConnection(data.connectionId, data.polite);
      _this.addTracks(data.connectionId);
      
    });

    this.signaling.addEventListener('disconnect', async (e) => {
      const data = e.detail;
      if (_this.pc != null && _this.pc.connectionId == data.connectionId) {
        _this.ondisconnect(`Receive disconnect message from server. connectionId:${data.connectionId}`);
      }
    });

    this.signaling.addEventListener('offer', async (e) => {
      const offer = e.detail;
      // offer.sdp += `b=AS:512\r\n`; //added
      if (_this.pc == null) {
        _this.prepareNewPeerConnection(offer.connectionId, offer.polite);
        _this.addTracks(offer.connectionId);
      }
      const desc = new RTCSessionDescription({ sdp: offer.sdp, type: "offer" });
      try {
        await _this.pc.onGotDescription(offer.connectionId, desc);
      } catch (error) {
        _this.ondisconnect(`Error happen on GotDescription that description.\n Message: ${error}\n RTCSdpType:${desc.type}\n sdp:${desc.sdp}`);
      }
    });

    this.signaling.addEventListener('answer', async (e) => {
      const answer = e.detail;
      const desc = new RTCSessionDescription({ sdp: answer.sdp, type: "answer" });
      if (_this.pc != null) {
        try {
          await _this.pc.onGotDescription(answer.connectionId, desc);
        } catch (error) {
          _this.ondisconnect(`Error happen on GotDescription that description.\n Message: ${error}\n RTCSdpType:${desc.type}\n sdp:${desc.sdp}`);
        }
      }
    });

    this.signaling.addEventListener('candidate', async (e) => {
      const candidate = e.detail;
      const iceCandidate = new RTCIceCandidate({ candidate: candidate.candidate, sdpMid: candidate.sdpMid, sdpMLineIndex: candidate.sdpMLineIndex });
      if (_this.pc != null) {
        await _this.pc.onGotCandidate(candidate.connectionId, iceCandidate);
      }
    });

    await this.signaling.start();
    await this.signaling.createConnection(connectionId);
  }

  prepareNewPeerConnection(connectionId, polite) {
    const _this = this;
    // close current RTCPeerConnection
    if (this.pc) {
      Logger.log('Close current PeerConnection');
      this.pc.close();
      this.pc = null;
    }

    // Create peerConnection with proxy server and set up handlers
    this.pc = new Peer(connectionId, polite, this.preferedCodecs);

    this.pc.addEventListener('disconnect', () => {
      _this.ondisconnect(`Receive disconnect message from peer.`);
    });
    this.pc.addEventListener('sendoffer', (e) => {
      const offer = e.detail;
      _this.signaling.sendOffer(offer.connectionId, offer.sdp);
    });
    this.pc.addEventListener('sendanswer', (e) => {
      const answer = e.detail;
      _this.signaling.sendAnswer(answer.connectionId, answer.sdp);
    });
    this.pc.addEventListener('sendcandidate', (e) => {
      const candidate = e.detail;
      _this.signaling.sendCandidate(candidate.connectionId, candidate.candidate, candidate.sdpMid, candidate.sdpMLineIndex);
    });
  }

  addTracks(connectionId) {
    const _this = this;
    const tracks = _this.localStream.getTracks();
    let sender;
    for (const track of tracks) {
      sender = _this.pc.addTrack(connectionId, track);
    }
    
    const params = sender.getParameters();
    console.log(params);
    // params.encodings[0].maxBitrate = 300;
    // sender.setParameters(params);
  }

  async getStats(connectionId) {
    return await this.pc.getStats(connectionId);
  }

  async hangUp(connectionId) {
    if (this.signaling == null) {
      return;
    }

    this.pc.close();
    this.pc = null;
    Logger.log(`delete connection ${connectionId}`);
    await this.signaling.deleteConnection(connectionId);

    await this.stop();
  }

  async stop() {
    if (this.signaling) {
      await this.signaling.stop();
      this.signaling = null;
    }
  }
}
