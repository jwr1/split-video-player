import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { IconButton, Slider } from '@material-ui/core';
import { PlayArrow, Pause } from '@material-ui/icons';

const { ipcRenderer } = window.require('electron');

const zero = (v) => `${v < 10 ? '0' : ''}${v}`;

const App = () => {
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    ipcRenderer.on('video:time', (e, newTime) => setTime(newTime));
    ipcRenderer.on('video:duration', (e, newDuration) => setDuration(newDuration));
    ipcRenderer.on('video:play', () => setPlaying(true));
    ipcRenderer.on('video:pause', () => setPlaying(false));
  }, []);

  useEffect(() => {
    ipcRenderer.send(`control:${playing ? 'play' : 'pause'}`);
  }, [playing]);

  return (
    <>
      <div
        style={{
          width: '100vw',
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <IconButton
          edge="start"
          color="inherit"
          onClick={() => setPlaying(!playing)}
          disabled={duration === 0}
          style={{ margin: 8 }}
        >
          {playing ? <Pause /> : <PlayArrow />}
        </IconButton>
        <Slider
          style={{
            flexGrow: 1,
            maxWidth: '100%',
            flexBasis: 0,
            margin: 8,
          }}
          value={time}
          max={duration}
          onChange={(e, newValue) => {
            setTime(newValue);
            ipcRenderer.send('control:time', newValue);
          }}
          disabled={duration === 0}
        />
        <span style={{ margin: 8 }}>
          {zero(Math.floor(time / 60))}:{zero(Math.round(time % 60))} /{' '}
          {zero(Math.floor(duration / 60))}:{zero(Math.round(duration % 60))}
        </span>
      </div>
    </>
  );
};

ReactDOM.render(<App />, document.getElementById('root'));
