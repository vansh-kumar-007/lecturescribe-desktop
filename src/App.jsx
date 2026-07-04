import { useState, useEffect } from 'react'
import Setup from './screens/Setup'
import Home from './screens/Home'
import NewJob from './screens/NewJob'
import Processing from './screens/Processing'
import Result from './screens/Result'

function App() {
  const [firstLaunch, setFirstLaunch] = useState(null) // null = not yet checked
  const [screen, setScreen] = useState('home') // 'home' | 'newJob' | 'processing'
  const [activeJob, setActiveJob] = useState(null)
  const [finishedPdfPath, setFinishedPdfPath] = useState('')

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

  // Brief loading state while checking setup status
  if (firstLaunch === null) return null

  // First-time setup screen
  if (firstLaunch) {
    return <Setup onComplete={handleSetupComplete} />
  }

  // New Job screen
  if (screen === 'newJob') {
   return (
     <NewJob
       onCancel={() => setScreen('home')}
       onCreated={(job) => {
         setActiveJob(job)
         setScreen('processing')
       }}
     />
   )
  }

  if (screen === 'processing') {
  return (
    <Processing
      jobId={activeJob.id}
      jobTitle={activeJob.title}
      onDone={() => setScreen('home')}
      onFinished={({ pdfPath }) => {
        setFinishedPdfPath(pdfPath)
        setScreen('result')
      }}
    />
  )
}


  if (screen === 'result') {
  return (
    <Result
      jobTitle={activeJob.title}
      pdfPath={finishedPdfPath}
      onBackToHome={() => setScreen('home')}
    />
  )
}

  // Home screen
  return (
    <Home
      onNewJob={() => setScreen('newJob')}
    />
  )
}

export default App