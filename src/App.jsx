import { useState, useEffect } from 'react'
import Setup from './screens/Setup'

function App() {
  const [firstLaunch, setFirstLaunch] = useState(null) // null = not yet checked

  useEffect(() => {
    const done = localStorage.getItem('lecturescribe_setup_complete')
    setFirstLaunch(!done)
  }, [])

  function handleSetupComplete(config) {
    console.log('Setup complete:', config)
    // Phase 3 will persist this properly to backend settings.
    // For now, just mark first-launch as done.
    localStorage.setItem('lecturescribe_setup_complete', 'true')
    setFirstLaunch(false)
  }

  if (firstLaunch === null) return null // brief loading state

  if (firstLaunch) {
    return <Setup onComplete={handleSetupComplete} />
  }

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif', color: '#e5e5e5', backgroundColor: '#0f0f14', height: '100vh' }}>
      <h1>LectureScribe Desktop</h1>
      <p>Setup complete. Home dashboard comes in Phase 3.</p>
      <button onClick={() => { localStorage.removeItem('lecturescribe_setup_complete'); window.location.reload() }}>
        Reset setup (dev only)
      </button>
    </div>
  )
}

export default App