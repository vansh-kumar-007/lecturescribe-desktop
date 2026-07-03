import { useState, useEffect } from 'react'
import Setup from './screens/Setup'

function App() {
  const [firstLaunch, setFirstLaunch] = useState(null) // null = not yet checked

  useEffect(() => {
  fetch('http://127.0.0.1:7823/settings')
    .then((res) => res.json())
    .then((data) => setFirstLaunch(!data.setup_complete))
    .catch(() => setFirstLaunch(true))
}, [])

  async function handleSetupComplete(config) {
  await fetch('http://127.0.0.1:7823/settings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      nvidia_api_key: config.nvidiaKey,
      telegram_bot_token: config.botToken || null,
      telegram_chat_id: config.chatId || null,
      setup_complete: true,
    }),
  })
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
      <button onClick={async () => {
  await fetch('http://127.0.0.1:7823/settings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ setup_complete: false }),
  })
  window.location.reload()
}}>
        Reset setup (dev only)
      </button>
    </div>
  )
}

export default App