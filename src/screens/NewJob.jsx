import { useState } from 'react'
import { FolderOpen, Link2, ArrowRight, Loader2 } from 'lucide-react'

function NewJob({ onCancel, onCreated }) {
  const [mode, setMode] = useState('folder') // 'folder' | 'url'
  const [folderPath, setFolderPath] = useState('')
  const [url, setUrl] = useState('')
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
      const body =
        mode === 'folder'
          ? { folder_path: folderPath, title: title || null }
          : { url: url.trim(), title: title || null }

      const res = await fetch('http://127.0.0.1:7823/jobs/new', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.detail || 'Failed to create job')
        setCreating(false)
        return
      }

      await fetch(`http://127.0.0.1:7823/jobs/${data.id}/start`, { method: 'POST' })

      onCreated(data)
    } catch (err) {
      setError('Could not reach backend.')
      setCreating(false)
    }
  }

  const canCreate = mode === 'folder' ? !!folderPath : !!url.trim()

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2>New Job</h2>

        <div style={styles.tabRow}>
          <button
            style={{ ...styles.tab, ...(mode === 'folder' ? styles.tabActive : {}) }}
            onClick={() => setMode('folder')}
          >
            <FolderOpen size={14} /> Folder
          </button>
          <button
  style={{ ...styles.tab, ...(mode === 'url' ? styles.tabActive : {}) }}
  onClick={() => setMode('url')}
>
  <Link2 size={14} /> URL / Playlist (Beta)
</button>
        </div>

        {mode === 'folder' && (
          <>
            <p style={styles.subtext}>Select a folder containing your lecture video.</p>
            <button style={styles.folderBtn} onClick={pickFolder}>
              <FolderOpen size={18} />
              {folderPath ? folderPath : 'Choose folder...'}
            </button>
          </>
        )}

        {mode === 'url' && (
  <>
    <p style={styles.subtext}>
      Paste a YouTube video or playlist URL. Playlists will be merged into one PDF.
    </p>
    <input
      style={styles.input}
      type="text"
      placeholder="https://youtube.com/watch?v=..."
      value={url}
      onChange={(e) => setUrl(e.target.value)}
    />
    <p style={styles.betaWarning}>
      ⚠ Beta feature — less tested than folder mode. If it fails, try folder mode instead.
    </p>
  </>
)}

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
          <button style={styles.primaryBtn} onClick={handleCreate} disabled={!canCreate || creating}>
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
    width: '440px',
    padding: '32px',
    backgroundColor: '#1a1a22',
    borderRadius: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  tabRow: { display: 'flex', gap: '8px', marginBottom: '4px' },
  tab: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    padding: '8px',
    borderRadius: '8px',
    border: '1px solid #333',
    backgroundColor: 'transparent',
    color: '#9ca3af',
    cursor: 'pointer',
    fontSize: '13px',
  },
  tabActive: {
    backgroundColor: '#6366f1',
    color: 'white',
    borderColor: '#6366f1',
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
  betaWarning: {
  fontSize: '12px',
  color: '#f59e0b',
  margin: 0,
},
}

export default NewJob