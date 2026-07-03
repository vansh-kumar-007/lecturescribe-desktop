import { useState } from 'react'
import { Cpu, Key, Send, CheckCircle2, XCircle, Loader2, ArrowRight, SkipForward } from 'lucide-react'

const STEPS = ['gpu', 'nvidia', 'telegram']

function Setup({ onComplete }) {
  const [stepIndex, setStepIndex] = useState(0)
  const [gpuResult, setGpuResult] = useState(null)
  const [gpuChecking, setGpuChecking] = useState(false)

  const [nvidiaKey, setNvidiaKey] = useState('')
  const [nvidiaResult, setNvidiaResult] = useState(null)
  const [nvidiaChecking, setNvidiaChecking] = useState(false)

  const [botToken, setBotToken] = useState('')
  const [chatId, setChatId] = useState('')
  const [telegramResult, setTelegramResult] = useState(null)
  const [telegramChecking, setTelegramChecking] = useState(false)

  const step = STEPS[stepIndex]

  function goNext() {
    if (stepIndex < STEPS.length - 1) {
      setStepIndex(stepIndex + 1)
    } else {
      onComplete({ nvidiaKey, botToken, chatId })
    }
  }

  async function runGpuCheck() {
    setGpuChecking(true)
    setGpuResult(null)
    try {
      const res = await fetch('http://127.0.0.1:7823/system/gpu')
      const data = await res.json()
      setGpuResult(data)
      setGpuChecking(false)
      // Auto-advance after a short pause so the user sees the result
      setTimeout(() => goNext(), 1200)
    } catch (err) {
      setGpuResult({ gpu_detected: false, reason: 'Could not reach backend.' })
      setGpuChecking(false)
    }
  }

  async function runNvidiaCheck() {
    setNvidiaChecking(true)
    setNvidiaResult(null)
    try {
      const res = await fetch('http://127.0.0.1:7823/validate/nvidia-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ api_key: nvidiaKey }),
      })
      const data = await res.json()
      setNvidiaResult(data)
    } catch (err) {
      setNvidiaResult({ valid: false, message: 'Could not reach backend.' })
    }
    setNvidiaChecking(false)
  }

  async function runTelegramCheck() {
    setTelegramChecking(true)
    setTelegramResult(null)
    try {
      const res = await fetch('http://127.0.0.1:7823/validate/telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bot_token: botToken, chat_id: chatId }),
      })
      const data = await res.json()
      setTelegramResult(data)
    } catch (err) {
      setTelegramResult({ valid: false, message: 'Could not reach backend.' })
    }
    setTelegramChecking(false)
  }

  return (
    <div style={styles.container}>
      <div style={styles.stepDots}>
        {STEPS.map((s, i) => (
          <div
            key={s}
            style={{
              ...styles.dot,
              backgroundColor: i <= stepIndex ? '#6366f1' : '#333',
            }}
          />
        ))}
      </div>

      {step === 'gpu' && (
        <div style={styles.card}>
          <Cpu size={32} color="#6366f1" />
          <h2>GPU Detection</h2>
          <p style={styles.subtext}>
            LectureScribe uses your GPU to transcribe lectures with Whisper.
          </p>

          {!gpuResult && !gpuChecking && (
            <button style={styles.primaryBtn} onClick={runGpuCheck}>
              Detect GPU <ArrowRight size={16} />
            </button>
          )}

          {gpuChecking && (
            <div style={styles.statusRow}>
              <Loader2 className="spin" size={18} /> Checking for NVIDIA GPU...
            </div>
          )}

          {gpuResult && gpuResult.gpu_detected && (
            <div style={styles.successBox}>
              <CheckCircle2 size={18} color="#22c55e" />
              <div>
                <strong>{gpuResult.gpu_name}</strong>
                <div style={styles.subtext}>{gpuResult.vram_total_gb} GB VRAM detected</div>
              </div>
            </div>
          )}

          {gpuResult && !gpuResult.gpu_detected && (
            <div style={styles.errorBox}>
              <XCircle size={18} color="#ef4444" />
              <div>
                <strong>No compatible GPU found</strong>
                <div style={styles.subtext}>{gpuResult.reason}</div>
                <div style={styles.subtext}>
                  You can still continue — transcription will run on CPU (slower).
                </div>
              </div>
            </div>
          )}

          {gpuResult && !gpuResult.gpu_detected && (
            <button style={styles.primaryBtn} onClick={goNext}>
              Continue anyway <ArrowRight size={16} />
            </button>
          )}
        </div>
      )}

      {step === 'nvidia' && (
        <div style={styles.card}>
          <Key size={32} color="#6366f1" />
          <h2>NVIDIA API Key</h2>
          <p style={styles.subtext}>
            Required for AI-generated notes. Get a free key at build.nvidia.com.
          </p>

          <input
            style={styles.input}
            type="password"
            placeholder="nvapi-..."
            value={nvidiaKey}
            onChange={(e) => setNvidiaKey(e.target.value)}
          />

          <button
            style={styles.primaryBtn}
            onClick={runNvidiaCheck}
            disabled={!nvidiaKey || nvidiaChecking}
          >
            {nvidiaChecking ? <Loader2 className="spin" size={16} /> : 'Validate Key'}
          </button>

          {nvidiaResult && nvidiaResult.valid && (
            <div style={styles.successBox}>
              <CheckCircle2 size={18} color="#22c55e" />
              <span>{nvidiaResult.message}</span>
            </div>
          )}

          {nvidiaResult && !nvidiaResult.valid && (
            <div style={styles.errorBox}>
              <XCircle size={18} color="#ef4444" />
              <span>{nvidiaResult.message}</span>
            </div>
          )}

          {nvidiaResult && nvidiaResult.valid && (
            <button style={styles.primaryBtn} onClick={goNext}>
              Continue <ArrowRight size={16} />
            </button>
          )}
        </div>
      )}

      {step === 'telegram' && (
        <div style={styles.card}>
          <Send size={32} color="#6366f1" />
          <h2>Telegram Delivery (Optional)</h2>
          <p style={styles.subtext}>
            Get your finished PDF notes sent straight to Telegram. Skip if you'd rather
            just open them from the app.
          </p>

          <input
            style={styles.input}
            type="text"
            placeholder="Bot Token"
            value={botToken}
            onChange={(e) => setBotToken(e.target.value)}
          />
          <input
            style={styles.input}
            type="text"
            placeholder="Chat ID"
            value={chatId}
            onChange={(e) => setChatId(e.target.value)}
          />

          <button
            style={styles.primaryBtn}
            onClick={runTelegramCheck}
            disabled={!botToken || !chatId || telegramChecking}
          >
            {telegramChecking ? <Loader2 className="spin" size={16} /> : 'Validate & Send Test'}
          </button>

          {telegramResult && telegramResult.valid && (
            <div style={styles.successBox}>
              <CheckCircle2 size={18} color="#22c55e" />
              <span>{telegramResult.message}</span>
            </div>
          )}

          {telegramResult && !telegramResult.valid && (
            <div style={styles.errorBox}>
              <XCircle size={18} color="#ef4444" />
              <span>{telegramResult.message}</span>
            </div>
          )}

          <div style={styles.buttonRow}>
            <button style={styles.skipBtn} onClick={goNext}>
              <SkipForward size={16} /> Skip
            </button>
            {telegramResult && telegramResult.valid && (
              <button style={styles.primaryBtn} onClick={goNext}>
                Finish <ArrowRight size={16} />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    backgroundColor: '#0f0f14',
    color: '#e5e5e5',
    fontFamily: 'sans-serif',
  },
  stepDots: { display: 'flex', gap: '8px', marginBottom: '24px' },
  dot: { width: '10px', height: '10px', borderRadius: '50%' },
  card: {
    width: '420px',
    padding: '32px',
    backgroundColor: '#1a1a22',
    borderRadius: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  subtext: { color: '#9ca3af', fontSize: '13px', margin: 0 },
  input: {
    padding: '10px 12px',
    borderRadius: '8px',
    border: '1px solid #333',
    backgroundColor: '#0f0f14',
    color: '#e5e5e5',
    fontSize: '14px',
  },
  primaryBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '10px 16px',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: '#6366f1',
    color: 'white',
    cursor: 'pointer',
    fontSize: '14px',
  },
  skipBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '10px 16px',
    borderRadius: '8px',
    border: '1px solid #333',
    backgroundColor: 'transparent',
    color: '#9ca3af',
    cursor: 'pointer',
    fontSize: '14px',
  },
  buttonRow: { display: 'flex', gap: '8px', justifyContent: 'space-between' },
  statusRow: { display: 'flex', alignItems: 'center', gap: '8px', color: '#9ca3af' },
  successBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px',
    backgroundColor: '#052e1a',
    borderRadius: '8px',
  },
  errorBox: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px',
    padding: '10px',
    backgroundColor: '#2e0505',
    borderRadius: '8px',
  },
}

export default Setup