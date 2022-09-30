import { SendVideo } from "./sendvideo.js";
import { getServerConfig } from "../../js/config.js";
import { createDisplayStringArray } from "../../js/stats.js";

const defaultStreamWidth = 1280;
const defaultStreamHeight = 720;
const streamSizeList =
  [
    { width: 640, height: 360 },
    { width: 1280, height: 720 },
    { width: 1920, height: 1080 },
    { width: 2560, height: 1440 },
    { width: 3840, height: 2160 },
    { width: 360, height: 640 },
    { width: 720, height: 1280 },
    { width: 1080, height: 1920 },
    { width: 1440, height: 2560 },
    { width: 2160, height: 3840 },
  ];

// // canvas configuration (added)
// var c = document.getElementById("localCanvas");
// var ctx = c.getContext("2d");
// // Create gradient
// var grd = ctx.createLinearGradient(0,0,200,0);
// grd.addColorStop(0,"red");
// grd.addColorStop(1,"white");
// // Fill with gradient
// ctx.fillStyle = grd;
// // ctx.fillRect(10,10,150,80);

const localVideo = document.getElementById('localVideo');
const localCanvas = document.getElementById('localCanvas'); // added
// const remoteVideo = document.getElementById('remoteVideo');
// const localVideoStatsDiv = document.getElementById('localVideoStats');
// const remoteVideoStatsDiv = document.getElementById('remoteVideoStats');
const textForConnectionId = document.getElementById('textForConnectionId');
textForConnectionId.value = getRandom();
// const videoSelect = document.querySelector('select#videoSource');
var cameraId; // added
// const audioSelect = document.querySelector('select#audioSource');
// const videoResolutionSelect = document.querySelector('select#videoResolution');
// const cameraWidthInput = document.querySelector('input#cameraWidth');
// const cameraHeightInput = document.querySelector('input#cameraHeight');

const codecPreferences = document.getElementById('codecPreferences');
const supportsSetCodecPreferences = window.RTCRtpTransceiver &&
  'setCodecPreferences' in window.RTCRtpTransceiver.prototype;
const messageDiv = document.getElementById('message');
messageDiv.style.display = 'none';

// let useCustomResolution = false;

setUpInputSelect();
showCodecSelect();

let sendVideo = new SendVideo();
sendVideo.ondisconnect = async (message) => {
  await hangUp();

  if (message) {
    messageDiv.style.display = 'block';
    messageDiv.innerText = message;
  }
};

let useWebSocket;
let connectionId;

const startButton = document.getElementById('startVideoButton');
startButton.addEventListener('click', startVideo);
const setupButton = document.getElementById('setUpButton');
setupButton.addEventListener('click', setUp);
const hangUpButton = document.getElementById('hangUpButton');
hangUpButton.addEventListener('click', hangUp);

window.addEventListener('beforeunload', async () => {
  await sendVideo.stop();
}, true);

setupConfig();

async function setupConfig() {
  const res = await getServerConfig();
  useWebSocket = res.useWebSocket;
  showWarningIfNeeded(res.startupMode);
}

function showWarningIfNeeded(startupMode) {
  const warningDiv = document.getElementById("warning");
  if (startupMode == "public") {
    warningDiv.innerHTML = "<h4>Warning</h4> This sample is not working on Public Mode.";
    warningDiv.hidden = false;
  }
}

async function startVideo() {
  // videoSelect.disabled = true;
  // audioSelect.disabled = true;
  // videoResolutionSelect.disabled = true;
  // cameraWidthInput.disabled = true;
  // cameraHeightInput.disabled = true;
  startButton.disabled = true;
  setupButton.disabled = false;

  let width = 0;
  let height = 0;
  // if (useCustomResolution) {
    // width = cameraWidthInput.value ? cameraWidthInput.value : defaultStreamWidth;
    // height = cameraHeightInput.value ? cameraHeightInput.value : defaultStreamHeight;
  // } else {
    // const size = streamSizeList[videoResolutionSelect.value];
    const size = streamSizeList[1]; // hard coded to 1280 x 720
    width = size.width;
    height = size.height;
  // }

  // await sendVideo.startVideo(localVideo, cameraId, audioSelect.value, width, height);
  // await sendVideo.startVideo(localVideo, localCanvas);
  await sendVideo.startVideo(localVideo, cameraId, width, height);
}

async function setUp() {
  setupButton.disabled = true;
  hangUpButton.disabled = false;
  connectionId = textForConnectionId.value;

  let selectedCodecs = null;
  if (supportsSetCodecPreferences) {
    const preferredCodec = codecPreferences.options[codecPreferences.selectedIndex];
    if (preferredCodec.value !== '') {
      const [mimeType, sdpFmtpLine] = preferredCodec.value.split(' ');
      const { codecs } = RTCRtpSender.getCapabilities('video');
      const selectedCodecIndex = codecs.findIndex(c => c.mimeType === mimeType && c.sdpFmtpLine === sdpFmtpLine);
      const selectCodec = codecs[selectedCodecIndex];
      selectedCodecs = [selectCodec];
    }
  }
  codecPreferences.disabled = true;

  // await sendVideo.setupConnection(remoteVideo, connectionId, useWebSocket, selectedCodecs);
  await sendVideo.setupConnection(connectionId, useWebSocket, selectedCodecs);
  showStatsMessage();
}

async function hangUp() {
  clearStatsMessage();
  hangUpButton.disabled = true;
  setupButton.disabled = false;
  await sendVideo.hangUp(connectionId);
  textForConnectionId.value = getRandom();
  connectionId = null;
  if (supportsSetCodecPreferences) {
    codecPreferences.disabled = false;
  }
}

function getRandom() {
  const max = 99999;
  const length = String(max).length;
  const number = Math.floor(Math.random() * max);
  return (Array(length).join('0') + number).slice(-length);
}

async function setUpInputSelect() {
  const deviceInfos = await navigator.mediaDevices.enumerateDevices();

  for (let i = 0; i !== deviceInfos.length; ++i) {
    const deviceInfo = deviceInfos[i];
    if (deviceInfo.kind === 'videoinput') {
      // const option = document.createElement('option');
      cameraId = deviceInfo.deviceId;
      // option.text = deviceInfo.label || `camera ${videoSelect.length + 1}`;
      // videoSelect.appendChild(option);
    } // else if (deviceInfo.kind === 'audioinput') {
    //   const option = document.createElement('option');
    //   option.value = deviceInfo.deviceId;
    //   option.text = deviceInfo.label || `mic ${audioSelect.length + 1}`;
    //   audioSelect.appendChild(option);
    // }
  }

  // for (let i = 0; i < streamSizeList.length; i++) {
  //   const streamSize = streamSizeList[i];
  //   const option = document.createElement('option');
  //   option.value = i;
  //   option.text = `${streamSize.width} x ${streamSize.height}`;
  //   videoResolutionSelect.appendChild(option);
  // }

  // const option = document.createElement('option');
  // option.value = streamSizeList.length;
  // option.text = 'Custom';
  // videoResolutionSelect.appendChild(option);
  // videoResolutionSelect.value = 1; // default select index (1280 x 720)

  // videoResolutionSelect.addEventListener('change', (event) => {
  //   const isCustom = event.target.value >= streamSizeList.length;
  //   cameraWidthInput.disabled = !isCustom;
  //   cameraHeightInput.disabled = !isCustom;
  //   useCustomResolution = isCustom;
  // });
}

function showCodecSelect() {
  if (!supportsSetCodecPreferences) {
    messageDiv.style.display = 'block';
    messageDiv.innerHTML = `Current Browser does not support <a href="https://developer.mozilla.org/en-US/docs/Web/API/RTCRtpTransceiver/setCodecPreferences">RTCRtpTransceiver.setCodecPreferences</a>.`;
    return;
  }

  const codecs = RTCRtpSender.getCapabilities('video').codecs;
  codecs.forEach(codec => {
    if (['video/red', 'video/ulpfec', 'video/rtx'].includes(codec.mimeType)) {
      return;
    }
    const option = document.createElement('option');
    option.value = (codec.mimeType + ' ' + (codec.sdpFmtpLine || '')).trim();
    option.innerText = option.value;
    codecPreferences.appendChild(option);
  });
  codecPreferences.disabled = false;
}

let lastStats;
let intervalId;

function showStatsMessage() {
  intervalId = setInterval(async () => {
    // if (localVideo.videoWidth) {
    //   localVideoStatsDiv.innerHTML = `<strong>Sending resolution:</strong> ${localVideo.videoWidth} x ${localVideo.videoHeight} px`;
    // }
    // if (remoteVideo.videoWidth) {
    //   remoteVideoStatsDiv.innerHTML = `<strong>Receiving resolution:</strong> ${remoteVideo.videoWidth} x ${remoteVideo.videoHeight} px`;
    // }

    if (sendVideo == null || connectionId == null) {
      return;
    }

    const stats = await sendVideo.getStats(connectionId);
    if (stats == null) {
      return;
    }

    const array = createDisplayStringArray(stats, lastStats);
    if (array.length) {
      messageDiv.style.display = 'block';
      messageDiv.innerHTML = array.join('<br>');
    }
    lastStats = stats;
  }, 1000);
}

function clearStatsMessage() {
  if (intervalId) {
    clearInterval(intervalId);
  }
  lastStats = null;
  intervalId = null;
  // localVideoStatsDiv.innerHTML = '';
  // remoteVideoStatsDiv.innerHTML = '';
  messageDiv.style.display = 'none';
  messageDiv.innerHTML = '';
}