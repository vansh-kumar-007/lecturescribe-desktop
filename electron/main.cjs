const { app, BrowserWindow } = require('electron')
const path = require('path')
const { startPythonBackend, waitForBackend } = require('./python_bridge.cjs')
let mainWindow
let pythonProcess

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false, // wait until backend is ready
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  // Phase 1: load the Vite dev server directly.
  // Later phases will load dist/index.html when packaged.
  mainWindow.loadURL('http://localhost:5173')

  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
  })
}

app.whenReady().then(async () => {
  console.log('Starting Python backend...')
  pythonProcess = startPythonBackend()

  try {
    await waitForBackend()
    console.log('Backend is ready.')
  } catch (err) {
    console.error('Backend failed to start:', err)
  }

  createWindow()
})

app.on('window-all-closed', () => {
  if (pythonProcess) pythonProcess.kill()
  if (process.platform !== 'darwin') app.quit()
})

app.on('quit', () => {
  if (pythonProcess) pythonProcess.kill()
})