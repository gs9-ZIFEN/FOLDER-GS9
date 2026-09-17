const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const fsp = fs.promises;

const HUB_DIR = path.join(app.getPath('appData'), 'disk-hub', 'HubFiles');
const INTERNAL_ICONS_DIR = path.join(__dirname, 'icons');

function createWindow() {
  const win = new BrowserWindow({
    width: 900,
    height: 600,
    frame: false,
    transparent: true,
    minWidth: 400,
    minHeight: 300,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  win.loadFile('index.html');

  win.once('ready-to-show', () => {
    win.show();
  });

  if (!fs.existsSync(HUB_DIR)) {
    fs.mkdirSync(HUB_DIR, { recursive: true });
  }
}

ipcMain.on('window-minimize', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win) win.minimize();
});

ipcMain.on('window-close', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win) win.close();
});

ipcMain.handle('get-shortcuts', async () => {
  try {
    const files = await fsp.readdir(HUB_DIR);
    const items = files.filter(f => !f.match(/\.(png|jpg|jpeg|ico|json)$/i));
    
    let layout = [];
    try { 
      const layoutData = await fsp.readFile(path.join(HUB_DIR, 'layout.json'), 'utf-8');
      layout = JSON.parse(layoutData); 
    } catch(e) {}

    const imgExts = ['.png', '.jpg', '.jpeg', '.ico'];
    
    const shortcuts = await Promise.all(items.map(async (f) => {
      let baseName = path.parse(f).name;
      baseName = baseName.replace(/\.(exe|url|lnk|bat)$/i, '');
      const origName = path.parse(f).name;
      
      let iconData = 'default';
      let foundIconPath = null;

      const findIconInDir = async (dir) => {
        try {
          const dirFiles = await fsp.readdir(dir);
          const match = dirFiles.find(file => {
            const fileLower = file.toLowerCase();
            const nameLower = baseName.toLowerCase();
            const origLower = origName.toLowerCase();
            return imgExts.some(ext => fileLower === nameLower + ext || fileLower === origLower + ext);
          });
          return match ? path.join(dir, match) : null;
        } catch (e) { return null; }
      };

      foundIconPath = await findIconInDir(INTERNAL_ICONS_DIR);
      if (!foundIconPath) foundIconPath = await findIconInDir(HUB_DIR);

      if (!foundIconPath) {
        try {
          const dirFiles = await fsp.readdir(INTERNAL_ICONS_DIR);
          const defaultMatch = dirFiles.find(file => {
            const fLower = file.toLowerCase();
            return fLower === 'default.png' || fLower === 'default.jpg' || fLower === 'default.jpeg' || fLower === 'default.ico';
          });
          if (defaultMatch) foundIconPath = path.join(INTERNAL_ICONS_DIR, defaultMatch);
        } catch (e) {}
      }

      if (foundIconPath) {
        const ext = path.extname(foundIconPath).toLowerCase();
        const buffer = await fsp.readFile(foundIconPath);
        const base64 = buffer.toString('base64');
        let mime = 'image/png';
        if (ext === '.jpg' || ext === '.jpeg') mime = 'image/jpeg';
        if (ext === '.ico') mime = 'image/x-icon';
        iconData = `data:${mime};base64,${base64}`;
      }

      return {
        filename: f,
        name: baseName,
        path: path.join(HUB_DIR, f),
        icon: iconData
      };
    }));

    shortcuts.sort((a, b) => {
      let indexA = layout.indexOf(a.filename);
      let indexB = layout.indexOf(b.filename);
      if(indexA === -1) indexA = 999;
      if(indexB === -1) indexB = 999;
      return indexA - indexB;
    });

    return shortcuts;
  } catch(e) { return []; }
});

ipcMain.on('open-shortcut', (e, filepath) => shell.openPath(filepath));

ipcMain.on('delete-shortcut', async (e, filepath) => {
  try {
    const stat = await fsp.stat(filepath);
    if (stat.isDirectory()) {
      await fsp.rm(filepath, { recursive: true, force: true });
    } else {
      await fsp.unlink(filepath);
    }
  } catch (err) {}
});

ipcMain.on('save-layout', (e, layoutArray) => {
  fs.writeFile(path.join(HUB_DIR, 'layout.json'), JSON.stringify(layoutArray), () => {});
});

app.whenReady().then(createWindow);