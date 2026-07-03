import { useState, useEffect } from 'react'

function App() {
  const [status, setStatus] = useState('checking...')

  useEffect(() => {
    fetch('http://127.0.0.1:7823/health')
      .then((res) => res.json())
      .then((data) => setStatus(data.status))
      .catch(() => setStatus('unreachable'))
  }, [])

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>LectureScribe Desktop</h1>
      <p>Backend status: <strong>{status}</strong></p>
    </div>
  )
}

export default App