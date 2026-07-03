const { spawn } = require('child_process')
const path = require('path')
const http = require('http')

function getPythonPath() {
  // Phase 1: use the conda env's python directly (dev mode)
  // Later phases will bundle a portable Python for the installer
  return 'python'
}

function startPythonBackend() {
  const pythonPath = getPythonPath()
  const serverPath = path.join(__dirname, '../backend/server.py')

  const proc = spawn(pythonPath, [serverPath], {
    env: { ...process.env, LECTURESCRIBE_PORT: '7823' },
    cwd: path.join(__dirname, '../backend'),
  })

  proc.stdout.on('data', (data) => console.log('[Python]', data.toString()))
  proc.stderr.on('data', (data) => console.error('[Python]', data.toString()))
  proc.on('close', (code) => console.log(`[Python] process exited with code ${code}`))

  return proc
}

function waitForBackend(maxWait = 30000) {
  const start = Date.now()
  return new Promise((resolve, reject) => {
    const check = () => {
      http.get('http://127.0.0.1:7823/health', (res) => {
        if (res.statusCode === 200) {
          resolve(true)
        } else {
          retry()
        }
      }).on('error', retry)
    }
    const retry = () => {
      if (Date.now() - start > maxWait) {
        reject(new Error('Backend did not respond within timeout'))
      } else {
        setTimeout(check, 500)
      }
    }
    check()
  })
}

module.exports = { startPythonBackend, waitForBackend }