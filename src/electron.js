const { app, BrowserWindow, dialog, ipcMain, Menu, nativeImage, shell } = require('electron');
const { autoUpdater } = require('electron-updater');

/**
 * @type {BrowserWindow}
 */
let controlWindow;
/**
 * @type {BrowserWindow}
 */
let videoWindow;

if (app.requestSingleInstanceLock()) {
  autoUpdater.checkForUpdatesAndNotify();

  const videoHeights = {
    s: 480,
    sh: 720,
    fh: 1080,
    uh: 2160,
  };
  const videoHeightsKeys = Object.keys(videoHeights);
  const videoHeightsKeysLength = videoHeightsKeys.length;

  let currentVideoSize = [720, videoHeights.s];

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
    videoWindow.setContentSize(width, height);
    currentVideoSize = [width, height];

    for (let i = 0; i < videoHeightsKeysLength; i += 1) {
      Menu.getApplicationMenu().getMenuItemById(videoHeightsKeys[i]).enabled =
        currentVideoSize[1] >= videoHeights[videoHeightsKeys[i]];
    }
  });

  ipcMain.on('video:duration', (e, duration) => {
    controlWindow.webContents.send('video:duration', duration);
  });

  ipcMain.on('control:playing', (e, isPlaying) => {
    videoWindow.webContents.send('control:playing', isPlaying);
  });

  ipcMain.on('video:playing', (e, isPlaying) => {
    controlWindow.webContents.send('video:playing', isPlaying);
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
    /**
     * @param {Electron.MenuItem} menuItem
     */
    const setResolutionFunc = (menuItem) => {
      if (menuItem.id === 'o') {
        videoWindow.setContentSize(currentVideoSize[0], currentVideoSize[1]);
      } else {
        videoWindow.setContentSize(
          Math.round((videoHeights[menuItem.id] / currentVideoSize[1]) * currentVideoSize[0]),
          videoHeights[menuItem.id],
        );
      }
    };
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
        {
          label: 'View',
          submenu: [
            {
              label: 'Toggle Fullscreen',
              accelerator: process.platform === 'darwin' ? 'Ctrl+Cmd+F' : 'F11',
              click: () => videoWindow.setFullScreen(!videoWindow.fullScreen),
            },
            {
              label: 'Set Resolution',
              submenu: [
                { label: 'Original', id: 'o', click: setResolutionFunc },
                { label: 'SD', id: 's', click: setResolutionFunc, enabled: false },
                { label: 'Standard HD', id: 'sh', click: setResolutionFunc, enabled: false },
                { label: 'Full HD', id: 'fh', click: setResolutionFunc, enabled: false },
                { label: 'UHD', id: 'uh', click: setResolutionFunc, enabled: false },
              ],
            },
          ],
        },
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
      useContentSize: true,
      width: 500,
      height: 64,
      minWidth: 250,
      minHeight: 64,
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
      useContentSize: true,
      width: currentVideoSize[0],
      height: currentVideoSize[1],
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

    if (typeof PRODUCTION !== 'undefined') videoWindow.removeMenu();

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
