/**
 * PeerHandler
 * @param options
 * @constructor
 */
function PeerHandler(options) {
    console.log("Loaded PeerHandler", arguments);
    EventEmitter.call(this);
  
    // Cross browsing
    navigator.getUserMedia =
      navigator.getUserMedia ||
      navigator.webkitGetUserMedia ||
      navigator.mozGetUserMedia ||
      navigator.mediaDevices.getUserMedia;
    const RTCPeerConnection =
      window.RTCPeerConnection ||
      window.mozRTCPeerConnection ||
      window.webkitRTCPeerConnection;
    const RTCSessionDescription =
      window.RTCSessionDescription ||
      window.mozRTCSessionDescription ||
      window.webkitRTCSessionDescription;
    const RTCIceCandidate =
      window.RTCIceCandidate ||
      window.mozRTCIceCandidate ||
      window.webkitRTCIceCandidate;
    const browserVersion = DetectRTC.browser.version;
    const isEdge = DetectRTC.browser.isEdge && browserVersion >= 15063; // 15버전 이상
    const isH264 = location.href.match("h264");
  
    const that = this;
    const send = options.send;
    const iceServers = {
      // 'iceTransportPolicy': 'relay',
      iceServers: [
        {
          urls: [
            "stun:stun.l.google.com:19302",
            "stun:stun1.l.google.com:19302",
            "stun:stun2.l.google.com:19302"
          ]
        },
        {
          urls: ["turn:107.150.19.220:3478"],
          credential: "turnserver",
          username: "subrosa"
        }
      ]
    };
  
    let localStream = null;
    let peer = null; // offer or answer peer
    let peerConnectionOptions = {
      optional: [
        {
          DtlsSrtpKeyAgreement: "true"
        }
      ]
    };
    let mediaConstraints = {
      mandatory: {
        OfferToReceiveAudio: true,
        OfferToReceiveVideo: true
      }
    };
  
    // edge is not supported
    if (isEdge) {
      peerConnectionOptions = {};
      mediaConstraints = {};
    }
  
    /**
     * getUserMedia
     */
    function getUserMedia(mediaOption, callback, isOffer) {
      console.log("getUserMedia");
  
      navigator.getUserMedia(
        mediaOption,
        function(stream) {
          localStream = stream;
          callback && callback(localStream);
  
          if (isOffer) {
            createPeerConnection();
            createOffer();
          }
        },
        function(error) {
          console.error("Error getUserMedia", error);
        }
      );
    }
  
    /**
     * SDP 변경
     * @param SDP
     * @returns {*}
     */
    function editSDP(SDP) {
      console.log("editSDP", SDP);
  
      SDP.sdp = SDP.sdp.replace("96 98 100", "100 96 98"); // for chrome 57 <
      SDP.sdp = SDP.sdp.replace(
        "96 97 98 99 100 101 102",
        "100 101 102 96 97 98 99"
      ); // for chrome 65 <
  
      console.log("return editSDP", SDP);
      return SDP;
    }
  
    /**
     * offer SDP를 생성 한다.
     */
    function createOffer() {
      console.log("createOffer", arguments);
  
      peer.addStream(localStream); // addStream 제외시 recvonly로 SDP 생성됨
      peer.createOffer(
        function(SDP) {
          if (isH264) {
            SDP = editSDP(SDP);
          }
  
          peer.setLocalDescription(SDP);
          console.log("Sending offer description", SDP);
          send({
            to: "all",
            sdp: SDP
          });
        },
        onSdpError,
        mediaConstraints
      );
    }
  
    /**
     * offer에 대한 응답 SDP를 생성 한다.
     * @param msg offer가 보내온 signaling massage
     */
    function createAnswer(msg) {
      console.log("createAnswer", arguments);
  
      peer.addStream(localStream);
      peer.setRemoteDescription(
        new RTCSessionDescription(msg.sdp),
        function() {
          peer.createAnswer(
            function(SDP) {
              if (isH264) {
                SDP = editSDP(SDP);
              }
              peer.setLocalDescription(SDP);
              console.log("Sending answer to peer.", SDP);
  
              send({
                to: "all",
                sdp: SDP
              });
            },
            onSdpError,
            mediaConstraints
          );
        },
        function() {
          console.error("setRemoteDescription", arguments);
        }
      );
    }
  
    /**
     * createPeerConnection
     * offer, answer 공통 함수로 peer를 생성하고 관련 이벤트를 바인딩 한다.
     */
    function createPeerConnection() {
      console.log("createPeerConnection", arguments);
  
      peer = new RTCPeerConnection(iceServers, peerConnectionOptions);
      console.log("new Peer", peer);
  
      peer.onicecandidate = function(event) {
        if (event.candidate) {
          send({
            to: "all",
            label: event.candidate.sdpMLineIndex,
            id: event.candidate.sdpMid,
            candidate: event.candidate.candidate
          });
        } else {
          console.info("Candidate denied", event.candidate);
        }
      };
  
      peer.onaddstream = function(event) {
        console.log("Adding remote strem", event);
        that.emit("addRemoteStream", event.stream);
      };
  
      peer.onremovestream = function(event) {
        console.log("Removing remote stream", event);
        that.emit("removeRemoteStream", event.stream);
      };
  
      peer.onnegotiationneeded = function(event) {
        console.log("onnegotiationneeded", event);
      };
  
      peer.onsignalingstatechange = function(event) {
        console.log("onsignalingstatechange", event);
      };
  
      peer.oniceconnectionstatechange = function(event) {
        console.log(
          "oniceconnectionstatechange",
          "iceGatheringState: " + peer.iceGatheringState,
          "/ iceConnectionState: " + peer.iceConnectionState
        );
  
        that.emit("iceconnectionStateChange", event);
      };
    }
  
    /**
     * onSdpError
     */
    function onSdpError() {
      console.log("onSdpError", arguments);
    }
  
    /**
     * signaling
     * @param data
     */
    function signaling(data) {
      console.log("onmessage", data);
  
      const msg = data;
      const sdp = msg.sdp || null;
  
      // 접속자가 보내온 offer처리
      if (sdp) {
        if (sdp.type === "offer") {
          createPeerConnection();
          createAnswer(msg);
  
          // offer에 대한 응답 처리
        } else if (sdp.type === "answer") {
          peer.setRemoteDescription(new RTCSessionDescription(msg.sdp));
        }
  
        // offer or answer cadidate처리
      } else if (msg.candidate) {
        const candidate = new RTCIceCandidate({
          sdpMid: msg.id,
          sdpMLineIndex: msg.label,
          candidate: msg.candidate
        });
  
        peer.addIceCandidate(candidate);
      } else {
        //console.log()
      }
    }
  
    /**
     * extends
     */
    this.getUserMedia = getUserMedia;
    this.signaling = signaling;
  }
  
  /**
   * inherit
   * @param {object} Parent
   * @param {object} Child
   *
   */
  const inherit = (function(Parent, Child) {
    const F = function() {};
    return function(Parent, Child) {
      F.prototype = Parent.prototype;
      Child.prototype = new F();
      Child.prototype.constructor = Child;
      Child.super = Parent.prototype;
    };
  })();
  
  
  inherit(EventEmitter, PeerHandler);
  