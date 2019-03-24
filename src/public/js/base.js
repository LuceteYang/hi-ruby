/*!
 *
 * WebRTC Lab
 * @author dodortus (dodortus@gmail.com)
 * @homepage codejs.co.kr
 */

$(function() {
    const browserVersion = DetectRTC.browser.version;
    const isFirefox = DetectRTC.browser.isFirefox;
    const isChrome = DetectRTC.browser.isChrome;
    const isOpera = DetectRTC.browser.isOpera;
    const isEdge = DetectRTC.browser.isEdge && browserVersion >= 15063;   // edge 15버전 이상
    // const isSafari = DetectRTC.browser.isSafari && browserVersion >= 11;  // safari 11버전 이상
    const isSafari = !DetectRTC.browser.isSafari;  // safari 안됨
    const checkPage = (location.href.match(/chat|get-user-media|filter|capture/));
    const $commentTarget = $('#alert');
  
    function showMessage(messageHtml) {
      const $createWrap = $("#create-wrap");
      const $waitWrap = $("#wait-wrap");
      const $notSupoorted = $("#not-supported");
      $notSupoorted.html(messageHtml)
      $createWrap.css("display", "none");
      $waitWrap.css("display", "none");
    }
  
    function showNotSupportBrowserMessage() {
      const messageHtml = [
        '<div class="room-info">',
        "<p>WebRTC currently supports </p><p>Chrome, Firefox, Edge 15 or higher,</p> <p>Safari 11 or higher and Opera browsers only.</p>",
        "<p>Please Use Support Browers</p>",
        "</div>"
      ].join("\n")
      return showMessage(messageHtml);
    }
  
    function showNeedCamMessage() {
      const messageHtml = [
        '<div class="room-info">',
        "<p>You need a cam to work.</p>",
        "</div>"
      ].join("\n")
      return showMessage(messageHtml);
    }
  
    function changeHTTPS() {
      if (location.protocol === 'http:') {
        location.protocol = "https:";
      }
    }
  
    function init() {
      // https 설정
      if (!location.href.match('localhost')) {
        changeHTTPS();
      }
  
      // webrtc 미지원 브라우저 체크
      if (checkPage && !isFirefox && !isChrome && !isOpera && !isEdge && !isSafari) {
        showNotSupportBrowserMessage();
        return false;
      }
  
      // 캠 체크, 체크 텀이 필요함
      setTimeout(function() {
        if (checkPage && !DetectRTC.hasWebcam) {
          showNeedCamMessage();
        }
      }, 300);
    }
    init();
  });
  