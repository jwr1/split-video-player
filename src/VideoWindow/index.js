import { useEffect, useRef } from 'react';
import { render } from 'react-dom';

const { ipcRenderer } = window.require('electron');

const App = () => {
  /**
   * @type {React.MutableRefObject<HTMLVideoElement>}
   */
  const videoRef = useRef();

  useEffect(() => {
    // set video size
    videoRef.current.onloadedmetadata = () => {
      ipcRenderer.send('video:size', videoRef.current.videoWidth, videoRef.current.videoHeight);
      ipcRenderer.send('video:duration', videoRef.current.duration);
    };

    videoRef.current.ontimeupdate = () => {
      ipcRenderer.send('video:time', videoRef.current.currentTime);
    };

    videoRef.current.onplay = () => {
      ipcRenderer.send('video:play');
    };
    videoRef.current.onpause = () => {
      ipcRenderer.send('video:pause');
    };

    ipcRenderer.on('control:play', () => {
      videoRef.current.play();
    });
    ipcRenderer.on('control:pause', () => {
      videoRef.current.pause();
    });

    ipcRenderer.on('control:time', (e, time) => {
      videoRef.current.currentTime = time;
    });

    ipcRenderer.on('control:open', (e, file) => {
      videoRef.current.src = `file://${file}`;
      videoRef.current.load();
    });
  }, []);

  return <video ref={videoRef} />;
};

render(<App />, document.getElementById('root'));
