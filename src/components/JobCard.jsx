import { FileText, Clock, CheckCircle2, XCircle, Loader2 } from 'lucide-react'

function JobCard({ job }) {
  async function handleOpen() {
    if (!job.pdf_path) return
    await fetch('http://127.0.0.1:7823/jobs/open-pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pdf_path: job.pdf_path }),
    })
  }

  const statusIcon = {
    done: <CheckCircle2 size={16} color="#22c55e" />,
    failed: <XCircle size={16} color="#ef4444" />,
    processing: <Loader2 size={16} className="spin" color="#6366f1" />,
  }[job.status] || <Clock size={16} color="#9ca3af" />

  return (
    <div style={styles.card} onClick={handleOpen}>
      <div style={styles.iconRow}>
        <FileText size={20} color="#6366f1" />
        {statusIcon}
      </div>
      <h4 style={styles.title}>{job.title || 'Untitled job'}</h4>
      <p style={styles.meta}>{job.created_at || ''}</p>
    </div>
  )
}

const styles = {
  card: {
    backgroundColor: '#1a1a22',
    borderRadius: '12px',
    padding: '16px',
    cursor: 'pointer',
    border: '1px solid #27272e',
  },
  iconRow: { display: 'flex', justifyContent: 'space-between', marginBottom: '10px' },
  title: { margin: '0 0 4px 0', fontSize: '15px' },
  meta: { margin: 0, fontSize: '12px', color: '#9ca3af' },
}

export default JobCard