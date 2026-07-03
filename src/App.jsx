import { useState, useEffect } from 'react'
import Setup from './screens/Setup'
import Home from './screens/Home'

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
  <Home
    onNewJob={() => alert('New Job screen coming in Phase 4')}
  />
)
}

export default App