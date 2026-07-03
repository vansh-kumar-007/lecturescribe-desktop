import { useState, useEffect } from 'react'
import { Plus, FileText, Clock, Loader2 } from 'lucide-react'
import JobCard from '../components/JobCard'

function Home({ onNewJob }) {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchJobs()
  }, [])

  async function fetchJobs() {
    setLoading(true)
    try {
      const res = await fetch('http://127.0.0.1:7823/jobs')
      const data = await res.json()
      setJobs(data)
    } catch (err) {
      console.error('Failed to fetch jobs:', err)
      setJobs([])
    }
    setLoading(false)
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Your Jobs</h1>
          <p style={styles.subtitle}>Lecture videos converted into notes</p>
        </div>
        <button style={styles.newJobBtn} onClick={onNewJob}>
          <Plus size={16} /> New Job
        </button>
        <button
          style={{ ...styles.newJobBtn, backgroundColor: '#3f3f46', marginLeft: '8px' }}
          onClick={async () => {
          await fetch('http://127.0.0.1:7823/jobs/dev-seed', { method: 'POST' })
          fetchJobs()
                }}
             >
          + Seed test job (dev)
        </button>                
      </div>

      {loading && (
        <div style={styles.emptyState}>
          <Loader2 className="spin" size={24} />
        </div>
      )}

      {!loading && jobs.length === 0 && (
        <div style={styles.emptyState}>
          <FileText size={48} color="#3f3f46" />
          <h3 style={styles.emptyTitle}>No jobs yet</h3>
          <p style={styles.subtitle}>
            Convert your first lecture video into structured notes.
          </p>
          <button style={styles.newJobBtn} onClick={onNewJob}>
            <Plus size={16} /> Create your first job
          </button>
        </div>
      )}

      {!loading && jobs.length > 0 && (
        <div style={styles.jobGrid}>
          {jobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      )}
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
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '32px',
  },
  title: { margin: 0, fontSize: '24px' },
  subtitle: { margin: '4px 0 0 0', color: '#9ca3af', fontSize: '14px' },
  newJobBtn: {
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
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    padding: '80px 20px',
    textAlign: 'center',
  },
  emptyTitle: { margin: 0 },
  jobGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '16px',
  },
}

export default Home