const { app, BrowserWindow, dialog, ipcMain, Menu, nativeImage, shell } = require('electron');

/**
 * @type {BrowserWindow}
 */
let controlWindow;
/**
 * @type {BrowserWindow}
 */
let videoWindow;

if (app.requestSingleInstanceLock()) {
  /**
   * @param {string} file
   */
  const openVideo = (file) => videoWindow.webContents.send('control:open', file);

  app.on('second-instance', (e, argv) => {
    if (typeof PRODUCTION !== 'undefined' && argv.length >= 2) {
      openVideo(argv[1]);
    }
  });

  ipcMain.on('video:size', (e, width, height) => {
    videoWindow.setBounds({ width, height });
  });

  ipcMain.on('video:duration', (e, duration) => {
    controlWindow.webContents.send('video:duration', duration);
  });

  ipcMain.on('control:play', () => {
    videoWindow.webContents.send('control:play');
  });
  ipcMain.on('control:pause', () => {
    videoWindow.webContents.send('control:pause');
  });

  ipcMain.on('video:play', () => {
    controlWindow.webContents.send('video:play');
  });
  ipcMain.on('video:pause', () => {
    controlWindow.webContents.send('video:pause');
  });

  ipcMain.on('video:time', (e, time) => {
    controlWindow.webContents.send('video:time', time);
  });

  ipcMain.on('control:time', (e, time) => {
    videoWindow.webContents.send('control:time', time);
  });

  const appIcon = nativeImage.createFromPath(
    typeof PRODUCTION === 'undefined' ? `${__dirname}/../assets/icon.png` : `${__dirname}/icon.png`,
  );

  app.whenReady().then(() => {
    Menu.setApplicationMenu(
      Menu.buildFromTemplate([
        {
          label: 'File',
          submenu: [
            {
              label: 'Open Video',
              accelerator: 'CommandOrControl+O',
              click: () => {
                dialog
                  .showOpenDialog({
                    properties: ['openFile'],
                    filters: [{ name: 'mp4', extensions: ['mp4'] }],
                  })
                  .then((file) => {
                    if (!file.canceled) openVideo(file.filePaths[0]);
                  });
              },
            },
            { type: 'separator' },
            { role: 'quit' },
          ],
        },
        { role: 'windowMenu' },
        {
          role: 'help',
          submenu: [
            {
              label: 'GitHub',
              click: () => shell.openExternal('https://github.com/jwr12135/split-video-player'),
            },
            {
              label: 'Report Issue',
              click: () =>
                shell.openExternal('https://github.com/jwr12135/split-video-player/issues'),
            },
            {
              type: 'separator',
            },
            {
              role: 'toggleDevTools',
            },
          ],
        },
      ]),
    );

    controlWindow = new BrowserWindow({
      width: 500,
      height: 90,
      minWidth: 250,
      minHeight: 90,
      webPreferences: {
        contextIsolation: false,
        nodeIntegration: true,
        webSecurity: false,
      },
      title: 'control - Split Video Player',
      icon: appIcon,
      show: false,
    });
    videoWindow = new BrowserWindow({
      webPreferences: {
        contextIsolation: false,
        nodeIntegration: true,
        webSecurity: false,
      },
      resizable: false,
      title: 'video - Split Video Player',
      icon: appIcon,
      backgroundColor: '#000000',
      show: false,
    });

    videoWindow.removeMenu();

    if (typeof PRODUCTION === 'undefined') {
      controlWindow.loadURL('http://localhost:8080/control.html');
      videoWindow.loadURL('http://localhost:8080/video.html');
    } else {
      controlWindow.loadFile(`${__dirname}/control.html`);
      videoWindow.loadFile(`${__dirname}/video.html`);
    }

    controlWindow.on('close', app.quit);
    videoWindow.on('close', app.quit);

    videoWindow.webContents.on('did-finish-load', () => {
      videoWindow.show();
      controlWindow.show();
    });

    videoWindow.webContents.once('dom-ready', () => {
      if (typeof PRODUCTION !== 'undefined' && process.argv.length >= 2) {
        openVideo(process.argv[1]);
      }
    });
  });
} else app.quit();
