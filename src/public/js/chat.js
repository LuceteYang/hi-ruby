/*!
 *
 * WebRTC Lab
 * @author dodortus (dodortus@gmail.com / codejs.co.kr)
 *
 */
$(function() {
  console.log("Loaded Main");

  let roomId;
  let userId;
  let remoteUserId;
  let isOffer;

  const socket = io();
  const mediaHandler = new MediaHandler();
  const peerHandler = new PeerHandler({
    send: send
  });
  const animationTime = 500;
  const isSafari = DetectRTC.browser.isSafari;
  const isMobile = DetectRTC.isMobileDevice;
  const mediaOption = {
    audio: true,
    video: {
      mandatory: {
        maxWidth: 1920,
        maxHeight: 1080,
        maxFrameRate: 30
      },
      optional: [
        { googNoiseReduction: true }, // Likely removes the noise in the captured video stream at the expense of computational effort.
        { facingMode: "user" } // Select the front/user facing camera or the rear/environment facing camera if available (on Phone)
      ]
    }
  };

  // DOM
  const $body = $("body");
  const $createWrap = $("#create-wrap");
  const $waitWrap = $("#wait-wrap");
  const $videoWrap = $("#video-wrap");
  const $shareLink = $("#share-link");
  const $link = $("#link");
  /**
   * 입장 후 다른 참여자 발견시 호출
   */
  function onDetectUser() {
    console.log("onDetectUser");

    $waitWrap.html(
      [
        '<div class="room-info">',
        "<p>Someone is waing for you.</p>",
        '<button class="btn" id="btn-join">Join</button>',
        "</div>"
      ].join("\n")
    );

    $("#btn-join").click(function() {
      isOffer = true;
      peerHandler.getUserMedia(mediaOption, onLocalStream, isOffer);
      $(this).attr("disabled", true);
    });

    $createWrap.slideUp(animationTime);
  }

  function onJoin(roomId, userList) {
    console.log("onJoin", userList);
    if (Object.keys(userList).length > 1) {
      onDetectUser();
    }
  }

  /**
   * 이탈자 핸들링
   * @param userId
   */
  function onLeave(userId) {
    console.log("onLeave", arguments);

    if (remoteUserId === userId) {
      $("#remote-video").remove();
      $body.removeClass("connected").addClass("wait");
      remoteUserId = null;
    }
  }

  /**
   * 소켓 메세지 핸들링
   * @param data
   */
  function onMessage(data) {
    console.log("onMessage", arguments);

    if (!remoteUserId) {
      remoteUserId = data.sender;
    }

    if (data.sdp || data.candidate) {
      peerHandler.signaling(data);
    } else {
      // etc
    }
  }

  /**
   * 소켓 메시지 전송
   * @param data
   */
  function send(data) {
    console.log("send", arguments);

    data.roomId = roomId;
    data.sender = userId;
    socket.send(data);
  }


  /**
   * 클립보드 복사
   */
  function setClipboard() {
    $shareLink.click(function() {
      const link = location.href;

      if (window.clipboardData) {
        window.clipboardData.setData("text", link);
        alert("Copy to Clipboard successful.");
      } else {
        var $temp = $("<input>");
        $("body").append($temp);
        $temp.val(link).select();
        document.execCommand("copy");
        $temp.remove();
        alert("Copy to Clipboard successful.");
      }
    });
  }

  /**
   * 로컬 스트림 핸들링
   * @param stream
   */
  function onLocalStream(stream) {
    $videoWrap.prepend('<video id="local-video" muted="muted" autoplay />');
    const localVideo = document.querySelector("#local-video");
    mediaHandler.setVideoStream({
      type: "local",
      el: localVideo,
      stream: stream
    });

    $body.addClass("room wait");

    if (isMobile && isSafari) {
      mediaHandler.playForIOS(localVideo);
    }
  }

  /**
   * 상대방 스트림 핸들링
   * @param stream
   */
  function onRemoteStream(stream) {
    console.log("onRemoteStream", stream);

    $videoWrap.prepend('<video id="remote-video" autoplay />');
    const remoteVideo = document.querySelector("#remote-video");
    mediaHandler.setVideoStream({
      type: "remote",
      el: remoteVideo,
      stream: stream
    });

    $body.removeClass("wait").addClass("connected");

    if (isMobile && isSafari) {
      mediaHandler.playForIOS(remoteVideo);
    }
  }

  /**
   * 초기 설정
   */
  function initialize() {
    var res = window.location.pathname.match(/^\/chat\/(\w+)/);
    $link.text(location.href);
    if (!res) {
      return false;
    }
    roomId = res[1];
    console.log('roomId',roomId)
    userId = Math.round(Math.random() * 99999);
    setClipboard();

    // 소켓 관련 이벤트 바인딩
    socket.emit("enter", roomId, userId);
    socket.on("join", onJoin);
    socket.on("leave", onLeave);
    socket.on("message", onMessage);

    // Peer 관련 이벤트 바인딩
    peerHandler.on("addRemoteStream", onRemoteStream);

    $("#btn-start").click(function() {
      peerHandler.getUserMedia(mediaOption, onLocalStream);
    });

    $("#btn-camera").click(function() {
      const $this = $(this);
      $this.toggleClass("active");
      mediaHandler[$this.hasClass("active") ? "pauseVideo" : "resumeVideo"]();
    });

    $("#btn-mic").click(function() {
      const $this = $(this);
      $this.toggleClass("active");
      mediaHandler[$this.hasClass("active") ? "muteAudio" : "unmuteAudio"]();
    });
  }

  initialize();
});
