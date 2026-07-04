import { useState, useEffect, useRef } from 'react'
import { Loader2, CheckCircle2, XCircle, FileText } from 'lucide-react'

const STEP_LABELS = {
  transcription: 'Transcribing audio (Whisper)',
  nemotron: 'Generating notes (Nemotron AI)',
  diagrams: 'Rendering diagrams',
  pdf: 'Building PDF',
  complete: 'Done',
}

function Processing({ jobId, jobTitle, onDone, onFinished }) {
  const [status, setStatus] = useState('processing')
  const [step, setStep] = useState('transcription')
  const [progress, setProgress] = useState(5)
  const [pdfPath, setPdfPath] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const socketRef = useRef(null)

  useEffect(() => {
    const ws = new WebSocket(`ws://127.0.0.1:7823/jobs/ws/${jobId}`)
    socketRef.current = ws

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
      if (data.error) return

      setStatus(data.status)
      setStep(data.pipeline_step)
      setProgress(data.progress)
      if (data.pdf_path) setPdfPath(data.pdf_path)
      if (data.error_message) setErrorMessage(data.error_message)
    }

    ws.onerror = () => setErrorMessage('Lost connection to backend.')

    return () => ws.close()
  }, [jobId])

  async function handleOpenPdf() {
    await fetch('http://127.0.0.1:7823/jobs/open-pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pdf_path: pdfPath }),
    })
  }

  async function handleCancel() {
  await fetch(`http://127.0.0.1:7823/jobs/${jobId}/cancel`, { method: 'POST' })
  onDone()
}

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {status === 'processing' && (
  <>
    <Loader2 className="spin" size={40} color="#6366f1" />
    <h2 style={styles.title}>{jobTitle}</h2>
    <p style={styles.stepLabel}>{STEP_LABELS[step] || 'Starting...'}</p>

    <div style={styles.progressTrack}>
      <div style={{ ...styles.progressFill, width: `${progress}%` }} />
    </div>

    <button style={styles.secondaryBtn} onClick={handleCancel}>
      Cancel
    </button>
  </>
)}

        {useEffect(() => {
  if (status === 'done') {
    onFinished({ pdfPath })
  }
}, [status])&& (
          <>
            <CheckCircle2 size={40} color="#22c55e" />
            <h2 style={styles.title}>Notes ready!</h2>
            <p style={styles.stepLabel}>{jobTitle}</p>
            <div style={styles.buttonRow}>
              <button style={styles.primaryBtn} onClick={handleOpenPdf}>
                <FileText size={16} /> Open PDF
              </button>
              <button style={styles.secondaryBtn} onClick={onDone}>
                Back to Home
              </button>
            </div>
          </>
        )}

        {status === 'failed' && (
          <>
            <XCircle size={40} color="#ef4444" />
            <h2 style={styles.title}>Something went wrong</h2>
            <p style={styles.stepLabel}>{errorMessage || 'The job failed to process.'}</p>
            <button style={styles.secondaryBtn} onClick={onDone}>
              Back to Home
            </button>
          </>
        )}

        {status === 'cancelled' && (
  <>
    <XCircle size={40} color="#9ca3af" />
    <h2 style={styles.title}>Job cancelled</h2>
    <button style={styles.secondaryBtn} onClick={onDone}>
      Back to Home
    </button>
  </>
)}
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
    padding: '40px',
    backgroundColor: '#1a1a22',
    borderRadius: '16px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px',
    textAlign: 'center',
  },
  title: { margin: '8px 0 0 0', fontSize: '18px' },
  stepLabel: { margin: 0, color: '#9ca3af', fontSize: '14px' },
  progressTrack: {
    width: '100%',
    height: '8px',
    backgroundColor: '#0f0f14',
    borderRadius: '4px',
    overflow: 'hidden',
    marginTop: '8px',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#6366f1',
    transition: 'width 0.4s ease',
  },
  buttonRow: { display: 'flex', gap: '8px', marginTop: '8px' },
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
  secondaryBtn: {
    padding: '10px 16px',
    borderRadius: '8px',
    border: '1px solid #333',
    backgroundColor: 'transparent',
    color: '#9ca3af',
    cursor: 'pointer',
    fontSize: '14px',
  },
}

export default Processing