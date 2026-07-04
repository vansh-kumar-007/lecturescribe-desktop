import { useState, useEffect } from 'react'
import { ArrowLeft, Key, Send, CheckCircle2, XCircle, Loader2, Save } from 'lucide-react'

function Settings({ onBack }) {
  const [loading, setLoading] = useState(true)
  const [nvidiaKey, setNvidiaKey] = useState('')
  const [botToken, setBotToken] = useState('')
  const [chatId, setChatId] = useState('')

  const [nvidiaResult, setNvidiaResult] = useState(null)
  const [nvidiaChecking, setNvidiaChecking] = useState(false)
  const [telegramResult, setTelegramResult] = useState(null)
  const [telegramChecking, setTelegramChecking] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetch('http://127.0.0.1:7823/settings')
      .then((res) => res.json())
      .then((data) => {
        setNvidiaKey(data.nvidia_api_key || '')
        setBotToken(data.telegram_bot_token || '')
        setChatId(data.telegram_chat_id || '')
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  async function validateNvidia() {
    setNvidiaChecking(true)
    setNvidiaResult(null)
    try {
      const res = await fetch('http://127.0.0.1:7823/validate/nvidia-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ api_key: nvidiaKey }),
      })
      setNvidiaResult(await res.json())
    } catch {
      setNvidiaResult({ valid: false, message: 'Could not reach backend.' })
    }
    setNvidiaChecking(false)
  }

  async function validateTelegram() {
    setTelegramChecking(true)
    setTelegramResult(null)
    try {
      const res = await fetch('http://127.0.0.1:7823/validate/telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bot_token: botToken, chat_id: chatId }),
      })
      setTelegramResult(await res.json())
    } catch {
      setTelegramResult({ valid: false, message: 'Could not reach backend.' })
    }
    setTelegramChecking(false)
  }

  async function handleSave() {
    setSaved(false)
    await fetch('http://127.0.0.1:7823/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nvidia_api_key: nvidiaKey || null,
        telegram_bot_token: botToken || null,
        telegram_chat_id: chatId || null,
      }),
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  if (loading) {
    return (
      <div style={styles.container}>
        <Loader2 className="spin" size={24} color="#6366f1" />
      </div>
    )
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button style={styles.backBtn} onClick={onBack}>
          <ArrowLeft size={16} /> Back
        </button>
        <h1 style={styles.title}>Settings</h1>
      </div>

      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <Key size={18} color="#6366f1" />
          <h3 style={styles.sectionTitle}>NVIDIA API Key</h3>
        </div>
        <input
          style={styles.input}
          type="password"
          placeholder="nvapi-..."
          value={nvidiaKey}
          onChange={(e) => setNvidiaKey(e.target.value)}
        />
        <div style={styles.rowBtns}>
          <button style={styles.secondaryBtn} onClick={validateNvidia} disabled={!nvidiaKey || nvidiaChecking}>
            {nvidiaChecking ? <Loader2 className="spin" size={14} /> : 'Test Key'}
          </button>
        </div>
        {nvidiaResult && (
          <div style={nvidiaResult.valid ? styles.successBox : styles.errorBox}>
            {nvidiaResult.valid ? <CheckCircle2 size={16} color="#22c55e" /> : <XCircle size={16} color="#ef4444" />}
            <span>{nvidiaResult.message}</span>
          </div>
        )}
      </div>

      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <Send size={18} color="#6366f1" />
          <h3 style={styles.sectionTitle}>Telegram Delivery (Optional)</h3>
        </div>
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
        <div style={styles.rowBtns}>
          <button
            style={styles.secondaryBtn}
            onClick={validateTelegram}
            disabled={!botToken || !chatId || telegramChecking}
          >
            {telegramChecking ? <Loader2 className="spin" size={14} /> : 'Test & Send Message'}
          </button>
        </div>
        {telegramResult && (
          <div style={telegramResult.valid ? styles.successBox : styles.errorBox}>
            {telegramResult.valid ? <CheckCircle2 size={16} color="#22c55e" /> : <XCircle size={16} color="#ef4444" />}
            <span>{telegramResult.message}</span>
          </div>
        )}
      </div>

      <div style={styles.saveRow}>
        <button style={styles.primaryBtn} onClick={handleSave}>
          <Save size={16} /> Save Settings
        </button>
        {saved && <span style={styles.savedText}>Saved!</span>}
      </div>
    </div>
  )
}

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#0f0f14',
    color: '#e5e5e5',
    fontFamily: 'sans-serif',
    padding: '32px',
  },
  header: { display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '28px' },
  backBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 12px',
    borderRadius: '8px',
    border: '1px solid #333',
    backgroundColor: 'transparent',
    color: '#9ca3af',
    cursor: 'pointer',
    fontSize: '13px',
  },
  title: { margin: 0, fontSize: '22px' },
  section: {
    backgroundColor: '#1a1a22',
    borderRadius: '12px',
    padding: '20px',
    marginBottom: '16px',
    maxWidth: '480px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  sectionHeader: { display: 'flex', alignItems: 'center', gap: '8px' },
  sectionTitle: { margin: 0, fontSize: '15px' },
  input: {
    padding: '10px 12px',
    borderRadius: '8px',
    border: '1px solid #333',
    backgroundColor: '#0f0f14',
    color: '#e5e5e5',
    fontSize: '14px',
  },
  rowBtns: { display: 'flex', gap: '8px' },
  secondaryBtn: {
    padding: '8px 14px',
    borderRadius: '8px',
    border: '1px solid #333',
    backgroundColor: 'transparent',
    color: '#e5e5e5',
    cursor: 'pointer',
    fontSize: '13px',
  },
  successBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 10px',
    backgroundColor: '#052e1a',
    borderRadius: '8px',
    fontSize: '13px',
  },
  errorBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 10px',
    backgroundColor: '#2e0505',
    borderRadius: '8px',
    fontSize: '13px',
  },
  saveRow: { display: 'flex', alignItems: 'center', gap: '12px', maxWidth: '480px' },
  primaryBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 18px',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: '#6366f1',
    color: 'white',
    cursor: 'pointer',
    fontSize: '14px',
  },
  savedText: { color: '#22c55e', fontSize: '13px' },
}

export default Settings