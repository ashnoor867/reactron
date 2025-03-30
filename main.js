require('dotenv').config();
const { app, BrowserWindow, ipcMain, Menu } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  // Remove default menu
  Menu.setApplicationMenu(null);
  console.log('Default application menu removed');

  win.loadFile('index.html');
}

app.whenReady().then(() => {
  createWindow();
  console.log('Application window created');
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
