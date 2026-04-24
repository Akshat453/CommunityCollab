import { useState, useEffect } from 'react'

export default function LegalNoticeModal({ pageName, onDismiss }) {
  const [disabled, setDisabled] = useState(true)
  const [countdown, setCountdown] = useState(4)

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) {
          clearInterval(timer)
          setDisabled(false)
          return 0
        }
        return c - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const handleDismiss = () => {
    sessionStorage.setItem(`legal_noticed_${pageName}`, 'true')
    onDismiss()
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(39,25,2,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div style={{ background: '#fff8f3', borderRadius: '24px', maxWidth: '560px', width: '100%', padding: '32px', boxShadow: '0 24px 64px rgba(39,25,2,0.18)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#ffebd1', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span className="material-symbols-outlined" style={{ color: '#af3000', fontSize: '20px' }}>gavel</span>
          </div>
          <h2 style={{ fontWeight: 900, fontSize: '18px', color: '#271902', margin: 0 }}>Community Agreement</h2>
        </div>

        <p style={{ fontSize: '13px', lineHeight: '1.7', color: '#3c4948', marginBottom: '24px' }}>
          By participating in any activity on CommunityCollab — including pool orders, skill sessions, resource sharing, or assistance — you agree that all transactions are between individual users. CommunityCollab is a platform facilitating connections only.
          <br /><br />
          Any attempt to defraud, deceive, or harm another user — including placing fake orders, misrepresenting skills or resources, failing to deliver items paid for, or refusing to pay after receiving goods or services — may result in <strong>permanent account suspension</strong> and may be subject to legal action under applicable Indian law including the <strong>Information Technology Act 2000</strong> and Indian Penal Code sections related to fraud and cheating.
          <br /><br />
          Your activity is logged and timestamped. Your verified phone number and account details are on record.
        </p>

        <button
          onClick={handleDismiss}
          disabled={disabled}
          style={{
            width: '100%',
            padding: '14px',
            borderRadius: '14px',
            background: disabled ? '#e0e0e0' : 'linear-gradient(135deg, #FF4F0F, #af3000)',
            color: disabled ? '#9e9e9e' : '#fff',
            fontWeight: 700,
            fontSize: '14px',
            border: 'none',
            cursor: disabled ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s'
          }}
        >
          {disabled ? `I Understand and Agree (${countdown}s)` : 'I Understand and Agree'}
        </button>
      </div>
    </div>
  )
}
