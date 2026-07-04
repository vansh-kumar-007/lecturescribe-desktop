import { useState } from 'react'
import { CheckCircle2, FileText, Coffee, Heart } from 'lucide-react'

const DONATION_AMOUNTS = [
  { label: '☕ ₹50', value: 50 },
  { label: '🍕 ₹200', value: 200 },
  { label: '🚀 ₹500', value: 500 },
]

function Result({ jobTitle, pdfPath, onBackToHome }) {
  const [customAmount, setCustomAmount] = useState('')
  const [showQr, setShowQr] = useState(false)

  async function handleOpenPdf() {
    await fetch('http://127.0.0.1:7823/jobs/open-pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pdf_path: pdfPath }),
    })
  }

  function handleDonateClick() {
    setShowQr(true)
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <CheckCircle2 size={48} color="#22c55e" />
        <h2 style={styles.title}>Notes are ready!</h2>
        <p style={styles.subtitle}>{jobTitle}</p>

        <button style={styles.primaryBtn} onClick={handleOpenPdf}>
          <FileText size={16} /> Open PDF
        </button>

        <div style={styles.divider} />

        <div style={styles.donationBlock}>
          <Heart size={20} color="#ef4444" />
          <p style={styles.donationText}>
            LectureScribe saved you hours of note-taking. If it helped, consider
            buying us a coffee.
          </p>

          {!showQr && (
            <div style={styles.donationRow}>
              {DONATION_AMOUNTS.map((d) => (
                <button
                  key={d.value}
                  style={styles.donateBtn}
                  onClick={handleDonateClick}
                >
                  {d.label}
                </button>
              ))}
              <div style={styles.customRow}>
                <input
                  style={styles.customInput}
                  type="number"
                  placeholder="Custom ₹"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                />
                <button style={styles.donateBtn} onClick={handleDonateClick}>
                  Donate
                </button>
              </div>
            </div>
          )}

          {showQr && (
            <div style={styles.qrBox}>
              <div style={styles.qrPlaceholder}>
                <Coffee size={32} color="#6366f1" />
                <p style={styles.subtext}>UPI QR code coming soon</p>
              </div>
              <p style={styles.subtext}>Thank you for considering supporting LectureScribe! ❤️</p>
            </div>
          )}
        </div>

        <button style={styles.secondaryBtn} onClick={onBackToHome}>
          Back to Home
        </button>
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
    overflowY: 'auto',
    padding: '20px',
  },
  card: {
    width: '440px',
    padding: '32px',
    backgroundColor: '#1a1a22',
    borderRadius: '16px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '10px',
    textAlign: 'center',
  },
  title: { margin: '8px 0 0 0', fontSize: '20px' },
  subtitle: { margin: 0, color: '#9ca3af', fontSize: '14px' },
  primaryBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 20px',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: '#6366f1',
    color: 'white',
    cursor: 'pointer',
    fontSize: '14px',
    marginTop: '8px',
  },
  divider: { width: '100%', height: '1px', backgroundColor: '#27272e', margin: '16px 0' },
  donationBlock: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '10px',
    width: '100%',
  },
  donationText: { fontSize: '13px', color: '#9ca3af', margin: 0 },
  donationRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    justifyContent: 'center',
    marginTop: '4px',
  },
  donateBtn: {
    padding: '8px 14px',
    borderRadius: '8px',
    border: '1px solid #333',
    backgroundColor: '#0f0f14',
    color: '#e5e5e5',
    cursor: 'pointer',
    fontSize: '13px',
  },
  customRow: { display: 'flex', gap: '6px' },
  customInput: {
    width: '90px',
    padding: '8px 10px',
    borderRadius: '8px',
    border: '1px solid #333',
    backgroundColor: '#0f0f14',
    color: '#e5e5e5',
    fontSize: '13px',
  },
  qrBox: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
    padding: '20px',
    backgroundColor: '#0f0f14',
    borderRadius: '12px',
    width: '100%',
  },
  qrPlaceholder: {
    width: '140px',
    height: '140px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    border: '2px dashed #333',
    borderRadius: '8px',
  },
  subtext: { fontSize: '12px', color: '#9ca3af', margin: 0 },
  secondaryBtn: {
    padding: '10px 16px',
    borderRadius: '8px',
    border: '1px solid #333',
    backgroundColor: 'transparent',
    color: '#9ca3af',
    cursor: 'pointer',
    fontSize: '14px',
    marginTop: '8px',
  },
}

export default Result