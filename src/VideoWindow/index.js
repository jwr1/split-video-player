import './style.css';

const { ipcRenderer } = window.require('electron');

/**
 * @type {HTMLVideoElement}
 */
// @ts-ignore
const videoRef = document.getElementById('v');

videoRef.onloadedmetadata = () => {
  ipcRenderer.send('video:size', videoRef.videoWidth, videoRef.videoHeight);
  ipcRenderer.send('video:duration', videoRef.duration);
};

videoRef.ontimeupdate = () => {
  ipcRenderer.send('video:time', videoRef.currentTime);
};

videoRef.onplay = () => {
  ipcRenderer.send('video:playing', true);
};
videoRef.onpause = () => {
  ipcRenderer.send('video:playing', false);
};

ipcRenderer.on('control:playing', (e, isPlaying) => {
  if (isPlaying) {
    videoRef.play();
  } else {
    videoRef.pause();
  }
});

ipcRenderer.on('control:time', (e, time) => {
  videoRef.currentTime = time;
});

ipcRenderer.on('control:open', (e, file) => {
  videoRef.src = `file://${file}`;
  videoRef.load();
});
