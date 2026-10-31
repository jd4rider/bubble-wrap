const { app, BrowserWindow, ipcMain, shell } = require('electron')
const path = require('node:path')
const { createJourneyStore } = require('./journey-db.cjs')

const isMac = process.platform === 'darwin'
let journeyStore = null

function createWindow() {
  const win = new BrowserWindow({
    width: 1040,
    height: 860,
    minWidth: 720,
    minHeight: 620,
    title: 'Bubble Wrap',
    backgroundColor: '#eef2ff',
    show: false,
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 20, y: 20 },
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      spellcheck: false,
      preload: path.join(__dirname, 'preload.cjs'),
    },
  })

  win.once('ready-to-show', () => win.show())
  win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'))

  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https://')) shell.openExternal(url)
    return { action: 'deny' }
  })
}

app.whenReady().then(() => {
  journeyStore = createJourneyStore(path.join(app.getPath('userData'), 'journey.sqlite'))
  ipcMain.handle('journey:load', () => journeyStore.load())
  ipcMain.handle('journey:save', (_event, state) => journeyStore.save(state))
  ipcMain.handle('journey:reset', () => journeyStore.reset())

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (!isMac) app.quit()
})
