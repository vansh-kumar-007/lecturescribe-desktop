import { useState } from 'react'
import { FolderOpen, ArrowRight, Loader2 } from 'lucide-react'

function NewJob({ onCancel, onCreated }) {
  const [folderPath, setFolderPath] = useState('')
  const [title, setTitle] = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')

  async function pickFolder() {
    const path = await window.api.openFolder()
    if (path) setFolderPath(path)
  }

  async function handleCreate() {
    setError('')
    setCreating(true)
    try {
      const res = await fetch('http://127.0.0.1:7823/jobs/new', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folder_path: folderPath, title: title || null }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.detail || 'Failed to create job')
        setCreating(false)
        return
      }
      onCreated(data)
    } catch (err) {
      setError('Could not reach backend.')
      setCreating(false)
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2>New Job</h2>
        <p style={styles.subtext}>Select a folder containing your lecture video.</p>

        <button style={styles.folderBtn} onClick={pickFolder}>
          <FolderOpen size={18} />
          {folderPath ? folderPath : 'Choose folder...'}
        </button>

        <input
          style={styles.input}
          type="text"
          placeholder="Job title (optional)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        {error && <div style={styles.errorText}>{error}</div>}

        <div style={styles.buttonRow}>
          <button style={styles.cancelBtn} onClick={onCancel}>
            Cancel
          </button>
          <button
            style={styles.primaryBtn}
            onClick={handleCreate}
            disabled={!folderPath || creating}
          >
            {creating ? <Loader2 className="spin" size={16} /> : (
              <>Create Job <ArrowRight size={16} /></>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

const styles = {
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    backgroundColor: '#0f0f14',
    color: '#e5e5e5',
    fontFamily: 'sans-serif',
  },
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
  folderBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 12px',
    borderRadius: '8px',
    border: '1px solid #333',
    backgroundColor: '#0f0f14',
    color: '#e5e5e5',
    cursor: 'pointer',
    fontSize: '14px',
    textAlign: 'left',
  },
  input: {
    padding: '10px 12px',
    borderRadius: '8px',
    border: '1px solid #333',
    backgroundColor: '#0f0f14',
    color: '#e5e5e5',
    fontSize: '14px',
  },
  errorText: { color: '#ef4444', fontSize: '13px' },
  buttonRow: { display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '8px' },
  cancelBtn: {
    padding: '10px 16px',
    borderRadius: '8px',
    border: '1px solid #333',
    backgroundColor: 'transparent',
    color: '#9ca3af',
    cursor: 'pointer',
    fontSize: '14px',
  },
  primaryBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 16px',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: '#6366f1',
    color: 'white',
    cursor: 'pointer',
    fontSize: '14px',
  },
}

export default NewJob