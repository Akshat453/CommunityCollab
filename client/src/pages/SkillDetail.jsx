import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'
import TrustBadge from '../components/TrustBadge'

const categoryIcons = { tech: 'code', languages: 'translate', arts_music: 'palette', life_skills: 'self_improvement', fitness: 'fitness_center', academic: 'school', trades: 'construction', other: 'interests' }

export default function SkillDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [skill, setSkill] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [connection, setConnection] = useState(null)
  const [connecting, setConnecting] = useState(false)

  // UPI states
  const [upiId, setUpiId] = useState('')
  const [upiName, setUpiName] = useState('')
  const [settingUpi, setSettingUpi] = useState(false)
  const [utrInput, setUtrInput] = useState('')
  const [submittingUtr, setSubmittingUtr] = useState(false)
  const [confirmingPayment, setConfirmingPayment] = useState(false)
  const [completingSession, setCompletingSession] = useState(false)

  const fetchConnection = async () => {
    if (!user) return
    try {
      const { data } = await api.get(`/skills/connections?listing=${id}`)
      // Fix pre-existing bug: data.data is an array, not a single object
      setConnection(data.data?.[0] || null)
    } catch { /* no active connection */ }
  }

  useEffect(() => {
    const fetchSkill = async () => {
      setLoading(true)
      setError(null)
      try {
        const { data } = await api.get(`/skills/${id}`)
        setSkill(data.data)
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load skill')
      } finally {
        setLoading(false)
      }
    }
    fetchSkill()
    fetchConnection()
  }, [id])

  const handleConnect = async () => {
    setConnecting(true)
    try {
      const { data } = await api.post(`/skills/${id}/connect`)
      setConnection(data.data)
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to send connection request')
    } finally {
      setConnecting(false)
    }
  }

  const handleSetUpi = async () => {
    if (!upiId.trim()) { alert('Please enter a UPI ID'); return }
    setSettingUpi(true)
    try {
      await api.post(`/skills/connections/${connection._id}/set-upi`, {
        teacher_upi_id: upiId.trim(),
        teacher_upi_name: upiName.trim() || undefined
      })
      setUpiId(''); setUpiName('')
      fetchConnection()
    } catch (err) { alert(err.response?.data?.message || 'Failed to set UPI details') }
    finally { setSettingUpi(false) }
  }

  const handleSubmitUtr = async () => {
    if (!utrInput.trim()) { alert('Please enter a UTR number'); return }
    setSubmittingUtr(true)
    try {
      await api.post(`/skills/connections/${connection._id}/submit-utr`, { utr_number: utrInput.trim() })
      setUtrInput('')
      fetchConnection()
    } catch (err) { alert(err.response?.data?.message || 'Failed to submit UTR') }
    finally { setSubmittingUtr(false) }
  }

  const handleConfirmPayment = async () => {
    setConfirmingPayment(true)
    try {
      await api.patch(`/skills/connections/${connection._id}/confirm-payment`)
      fetchConnection()
    } catch (err) { alert(err.response?.data?.message || 'Failed to confirm payment') }
    finally { setConfirmingPayment(false) }
  }

  const handleCompleteSession = async () => {
    setCompletingSession(true)
    try {
      await api.patch(`/skills/connections/${connection._id}/complete`)
      fetchConnection()
    } catch (err) { alert(err.response?.data?.message || 'Failed to mark as complete') }
    finally { setCompletingSession(false) }
  }

  const isOwnListing = skill && user && (skill.user?._id || skill.user) === user._id
  const isTeacher = connection && isOwnListing
  const isLearner = connection && !isOwnListing

  if (loading) return (
    <div className="max-w-4xl mx-auto flex justify-center py-32">
      <span className="material-symbols-outlined text-primary text-5xl animate-spin">progress_activity</span>
    </div>
  )

  if (error) return (
    <div className="max-w-4xl mx-auto text-center py-32">
      <span className="material-symbols-outlined text-error text-6xl mb-4">error</span>
      <h2 className="text-xl font-bold mb-2">Something went wrong</h2>
      <p className="text-on-surface-variant mb-6">{error}</p>
      <button onClick={() => navigate('/skills')} className="primary-gradient text-white px-6 py-2.5 rounded-xl font-bold shadow-lg">Back to Skills</button>
    </div>
  )

  if (!skill) return null

  // Determine completion status
  const myComplete = isTeacher ? connection?.teacher_completed : connection?.learner_completed
  const otherComplete = isTeacher ? connection?.learner_completed : connection?.teacher_completed

  return (
    <div className="max-w-4xl mx-auto">
      {/* Back */}
      <button onClick={() => navigate('/skills')} className="flex items-center gap-1 text-on-surface-variant hover:text-on-surface text-sm font-medium mb-6 group">
        <span className="material-symbols-outlined text-lg group-hover:-translate-x-1 transition-transform">arrow_back</span>
        Back to Skills
      </button>

      {/* Warning Banner */}
      <div className="rounded-xl px-4 py-2.5 mb-4 flex items-center gap-2" style={{ background: '#FFF8E1', border: '1px solid #FFD54F' }}>
        <span className="material-symbols-outlined text-sm" style={{ color: '#F57F17' }}>warning</span>
        <p className="text-xs font-medium" style={{ color: '#F57F17' }}>
          All transactions are logged. Fraudulent activity will result in account suspension and legal action.
        </p>
      </div>

      {/* Header */}
      <div className="bg-surface-container-low rounded-3xl p-8 mb-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-inner">
            <span className="material-symbols-outlined text-tertiary text-3xl">{categoryIcons[skill.skill_category] || 'interests'}</span>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${skill.listing_type === 'offering' ? 'bg-secondary-container text-on-secondary-container' : 'bg-primary-fixed text-primary'}`}>{skill.listing_type}</span>
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant">{skill.mode === 'in_person' ? 'In Person' : skill.mode}</span>
              <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${skill.exchange_type === 'free' ? 'bg-secondary-fixed text-on-secondary-fixed' : skill.exchange_type === 'barter' ? 'bg-tertiary-fixed text-on-tertiary-fixed' : 'bg-primary-fixed text-primary'}`}>{skill.exchange_type}</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-headline font-extrabold tracking-tighter">{skill.skill_name}</h1>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-surface-container-low rounded-3xl p-6">
            <h2 className="font-bold text-lg mb-3">Description</h2>
            <p className="text-on-surface-variant leading-relaxed whitespace-pre-wrap">{skill.description || 'No description provided.'}</p>
          </div>

          {/* Details */}
          <div className="bg-surface-container-low rounded-3xl p-6 space-y-4">
            <h2 className="font-bold text-lg mb-1">Details</h2>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-tertiary-fixed rounded-xl flex items-center justify-center">
                <span className="material-symbols-outlined text-tertiary material-fill">category</span>
              </div>
              <div>
                <p className="text-sm font-bold capitalize">{skill.skill_category?.replace('_', ' & ')}</p>
                <p className="text-xs text-on-surface-variant">Category</p>
              </div>
            </div>
            {skill.proficiency_level && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-secondary-container rounded-xl flex items-center justify-center">
                  <span className="material-symbols-outlined text-on-secondary-container material-fill">military_tech</span>
                </div>
                <div>
                  <p className="text-sm font-bold capitalize">{skill.proficiency_level}</p>
                  <p className="text-xs text-on-surface-variant">Proficiency Level</p>
                </div>
              </div>
            )}
            {skill.price_per_hour && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-fixed rounded-xl flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary material-fill">payments</span>
                </div>
                <div>
                  <p className="text-sm font-bold">₹{skill.price_per_hour}/hour</p>
                  <p className="text-xs text-on-surface-variant">Rate</p>
                </div>
              </div>
            )}
            {skill.what_i_offer_in_return && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-tertiary-fixed rounded-xl flex items-center justify-center">
                  <span className="material-symbols-outlined text-tertiary material-fill">swap_horiz</span>
                </div>
                <div>
                  <p className="text-sm font-bold">{skill.what_i_offer_in_return}</p>
                  <p className="text-xs text-on-surface-variant">Offer in return</p>
                </div>
              </div>
            )}
          </div>

          {/* Session Completion Section */}
          {connection && connection.status === 'accepted' && (
            <div className="bg-surface-container-low rounded-3xl p-6">
              <h2 className="font-bold text-lg mb-4">📋 Session Status</h2>
              <div className="space-y-3">
                {/* Completion progress */}
                <div className="flex items-center gap-3">
                  <span className={`material-symbols-outlined ${myComplete ? 'text-green-600' : 'text-on-surface-variant'}`}>
                    {myComplete ? 'check_circle' : 'radio_button_unchecked'}
                  </span>
                  <span className="text-sm font-medium">You: {myComplete ? 'Marked complete ✓' : 'Not marked yet'}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`material-symbols-outlined ${otherComplete ? 'text-green-600' : 'text-on-surface-variant'}`}>
                    {otherComplete ? 'check_circle' : 'radio_button_unchecked'}
                  </span>
                  <span className="text-sm font-medium">
                    {isTeacher ? 'Learner' : 'Teacher'}: {otherComplete ? 'Marked complete ✓' : 'Not marked yet'}
                  </span>
                </div>
                {!myComplete && (
                  <button onClick={handleCompleteSession} disabled={completingSession}
                    className="px-6 py-2.5 rounded-xl font-bold text-white text-sm shadow-lg active:scale-95 transition-transform disabled:opacity-50 mt-2" style={{ background: '#03A6A1' }}>
                    {completingSession ? 'Marking...' : '✅ Mark Session Complete'}
                  </button>
                )}
                {myComplete && !otherComplete && (
                  <p className="text-xs text-on-surface-variant mt-1">Waiting for the other party to confirm completion...</p>
                )}
              </div>
            </div>
          )}

          {/* Session completed */}
          {connection && connection.status === 'completed' && (
            <div className="rounded-3xl p-6 text-center" style={{ background: '#E8F5E9' }}>
              <span className="material-symbols-outlined text-4xl" style={{ color: '#2E7D32' }}>celebration</span>
              <h3 className="font-bold text-lg mt-2" style={{ color: '#2E7D32' }}>Session Completed!</h3>
              <p className="text-sm text-on-surface-variant mt-1">Both parties marked this session as complete.</p>
            </div>
          )}

          {/* UPI Payment Section — for paid connections */}
          {connection && connection.exchange_type === 'paid' && (connection.status === 'accepted' || connection.status === 'completed') && (
            <div className="bg-surface-container-low rounded-3xl p-6">
              <h2 className="font-bold text-lg mb-4">💳 Payment</h2>

              {/* Teacher: Set UPI details */}
              {isTeacher && !connection.teacher_upi_id && (
                <div className="space-y-3">
                  <p className="text-sm text-on-surface-variant mb-2">Share your UPI details so the learner can pay you.</p>
                  <input type="text" placeholder="Your UPI ID (e.g. name@paytm)" value={upiId} onChange={e => setUpiId(e.target.value)}
                    className="w-full bg-surface-container rounded-xl px-4 py-3 text-sm border-none focus:ring-2 focus:ring-primary/30 outline-none" />
                  <input type="text" placeholder="Name on UPI account" value={upiName} onChange={e => setUpiName(e.target.value)}
                    className="w-full bg-surface-container rounded-xl px-4 py-3 text-sm border-none focus:ring-2 focus:ring-primary/30 outline-none" />
                  <button onClick={handleSetUpi} disabled={settingUpi}
                    className="px-6 py-2.5 rounded-xl font-bold text-white text-sm shadow-lg active:scale-95 transition-transform disabled:opacity-50" style={{ background: '#03A6A1' }}>
                    {settingUpi ? 'Saving...' : 'Set UPI Details'}
                  </button>
                </div>
              )}

              {/* Teacher: UPI set, show status */}
              {isTeacher && connection.teacher_upi_id && (
                <div className="space-y-3">
                  <div className="rounded-xl p-3" style={{ background: '#E8F5E9' }}>
                    <p className="text-xs font-bold mb-1" style={{ color: '#2E7D32' }}>Your UPI ID shared</p>
                    <p className="text-sm font-bold">{connection.teacher_upi_id}</p>
                  </div>
                  {connection.payment_status === 'utr_submitted' && (
                    <div className="space-y-2">
                      <div className="rounded-xl p-3" style={{ background: '#E3F2FD' }}>
                        <p className="text-xs font-bold" style={{ color: '#1565C0' }}>UTR received from learner</p>
                        <p className="text-sm font-bold mt-1">{connection.utr_number}</p>
                      </div>
                      <button onClick={handleConfirmPayment} disabled={confirmingPayment}
                        className="w-full py-2.5 rounded-xl font-bold text-white text-sm shadow-lg active:scale-95 transition-transform disabled:opacity-50" style={{ background: '#03A6A1' }}>
                        {confirmingPayment ? 'Confirming...' : '✓ Confirm Payment Received'}
                      </button>
                    </div>
                  )}
                  {connection.payment_status === 'paid' && (
                    <div className="rounded-xl p-4 text-center" style={{ background: '#E8F5E9' }}>
                      <span className="material-symbols-outlined text-3xl" style={{ color: '#2E7D32' }}>check_circle</span>
                      <p className="font-bold text-sm mt-1" style={{ color: '#2E7D32' }}>Payment Confirmed ✓</p>
                    </div>
                  )}
                </div>
              )}

              {/* Learner: Waiting for UPI */}
              {isLearner && !connection.teacher_upi_id && (
                <div className="rounded-xl p-4 text-center" style={{ background: '#FFF8E1' }}>
                  <span className="material-symbols-outlined text-3xl mb-2" style={{ color: '#F57F17' }}>hourglass_top</span>
                  <p className="font-bold text-sm" style={{ color: '#F57F17' }}>Waiting for teacher to share UPI details</p>
                </div>
              )}

              {/* Learner: UPI available, submit UTR */}
              {isLearner && connection.teacher_upi_id && connection.payment_status === 'unpaid' && (
                <div className="space-y-3">
                  <div className="rounded-xl p-4" style={{ background: '#E3F2FD' }}>
                    <p className="text-xs font-bold mb-1" style={{ color: '#1565C0' }}>Pay the teacher via UPI</p>
                    <p className="text-lg font-bold" style={{ color: '#1565C0' }}>{connection.teacher_upi_id}</p>
                    {connection.teacher_upi_name && <p className="text-xs text-on-surface-variant">Name: {connection.teacher_upi_name}</p>}
                    <p className="text-sm font-bold mt-2" style={{ color: '#FF4F0F' }}>Amount: ₹{skill.price_per_hour}</p>
                  </div>
                  <input type="text" placeholder="Enter UTR / Transaction Reference Number" value={utrInput} onChange={e => setUtrInput(e.target.value)}
                    className="w-full bg-surface-container rounded-xl px-4 py-3 text-sm border-none focus:ring-2 focus:ring-primary/30 outline-none" />
                  <button onClick={handleSubmitUtr} disabled={submittingUtr}
                    className="px-6 py-2.5 rounded-xl font-bold text-white text-sm shadow-lg active:scale-95 transition-transform disabled:opacity-50" style={{ background: '#03A6A1' }}>
                    {submittingUtr ? 'Submitting...' : 'Submit Payment'}
                  </button>
                </div>
              )}

              {/* Learner: UTR submitted */}
              {isLearner && connection.payment_status === 'utr_submitted' && (
                <div className="rounded-xl p-4 text-center" style={{ background: '#E3F2FD' }}>
                  <span className="material-symbols-outlined text-3xl mb-2" style={{ color: '#1565C0' }}>hourglass_top</span>
                  <p className="font-bold text-sm" style={{ color: '#1565C0' }}>Awaiting payment confirmation from teacher</p>
                  <p className="text-xs text-on-surface-variant mt-1">UTR: {connection.utr_number}</p>
                </div>
              )}

              {/* Learner: Payment confirmed */}
              {isLearner && connection.payment_status === 'paid' && (
                <div className="rounded-xl p-4 text-center" style={{ background: '#E8F5E9' }}>
                  <span className="material-symbols-outlined text-3xl mb-2" style={{ color: '#2E7D32' }}>check_circle</span>
                  <p className="font-bold text-sm" style={{ color: '#2E7D32' }}>Payment Confirmed ✓</p>
                </div>
              )}
            </div>
          )}

          {/* Tags */}
          {skill.tags?.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {skill.tags.map((tag, i) => (
                <span key={i} className="bg-surface-container text-on-surface-variant text-xs font-bold px-3 py-1 rounded-full">#{tag}</span>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* User Profile */}
          <div className="bg-surface-container-low rounded-3xl p-6">
            <h3 className="text-xs font-bold uppercase text-on-surface-variant tracking-wider mb-4">{skill.listing_type === 'offering' ? 'Instructor' : 'Learner'}</h3>
            <div className="flex items-center gap-3 mb-3">
              <img src={skill.user?.avatar_url || 'https://ui-avatars.com/api/?name=U&background=e8e0d8&color=3c4948&bold=true&size=128'} alt="" className="w-12 h-12 rounded-2xl border-2 border-outline-variant/20" />
              <div>
                <p className="font-bold">{skill.user?.name}</p>
                {skill.user?.verified && <span className="material-symbols-outlined text-secondary text-sm material-fill">verified</span>}
              </div>
            </div>
            <TrustBadge trust_score={skill.user?.trust_score} trust_level={skill.user?.trust_level} size="md" />
            {skill.user?.bio && <p className="text-xs text-on-surface-variant line-clamp-3 mb-3 mt-3">{skill.user.bio}</p>}
            {skill.user?.rating && (
              <div className="flex items-center gap-1">
                <span className="material-symbols-outlined text-yellow-500 text-sm material-fill">star</span>
                <span className="text-sm font-bold">{skill.user.rating.toFixed(1)}</span>
              </div>
            )}
          </div>

          {/* Location */}
          {skill.user?.location?.city && (
            <div className="bg-surface-container-low rounded-3xl p-6">
              <h3 className="text-xs font-bold uppercase text-on-surface-variant tracking-wider mb-3">Location</h3>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-on-surface-variant text-lg">location_on</span>
                <span className="text-sm">{skill.user.location.city}</span>
              </div>
            </div>
          )}

          {/* CTA */}
          <div className="bg-surface-container-low rounded-3xl p-6">
            {isOwnListing ? (
              <div className="text-center py-3 rounded-xl bg-surface-container text-on-surface-variant font-bold">Your Listing</div>
            ) : connection ? (
              <div className="space-y-3">
                {connection.status === 'pending' && (
                  <div className="text-center py-3 rounded-xl bg-tertiary-fixed text-tertiary font-bold text-sm">Request Sent — Pending</div>
                )}
                {connection.status === 'accepted' && (
                  <div className="flex items-center gap-2 justify-center py-3 rounded-xl font-bold text-sm" style={{ color: '#03A6A1', border: '2px solid #03A6A1' }}>
                    <span className="material-symbols-outlined text-base">check_circle</span>
                    Connected
                  </div>
                )}
                {connection.status === 'completed' && (
                  <div className="flex items-center gap-2 justify-center py-3 rounded-xl font-bold text-sm" style={{ color: '#2E7D32', background: '#E8F5E9' }}>
                    <span className="material-symbols-outlined text-base">check_circle</span>
                    Session Completed
                  </div>
                )}
                {connection.status === 'rejected' && (
                  <div className="text-center py-3 rounded-xl bg-error-container text-on-error-container font-bold text-sm">Request Declined</div>
                )}
                <button onClick={() => navigate('/messages')} className="w-full py-2.5 rounded-xl border-2 border-outline-variant/30 text-on-surface font-bold text-sm hover:bg-surface-container transition-all">
                  Open Messages
                </button>
              </div>
            ) : (
              <>
                <button onClick={handleConnect} disabled={connecting} className="w-full py-3 rounded-xl primary-gradient text-white font-bold text-base shadow-lg active:scale-95 transition-transform disabled:opacity-50">
                  {connecting ? 'Sending...' : 'Connect Now'}
                </button>
                <p className="text-xs text-center text-on-surface-variant mt-3">Send a connection request to get started</p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
