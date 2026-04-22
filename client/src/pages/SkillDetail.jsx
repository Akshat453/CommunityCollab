import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'

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

  const fetchConnection = async () => {
    if (!user) return
    try {
      const { data } = await api.get(`/skills/connections?listing=${id}`)
      setConnection(data.data || null)
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

  const handlePaySession = async () => {
    try {
      const { data } = await api.post(`/skills/connections/${connection._id}/create-payment-order`)
      const options = {
        key: data.key,
        amount: data.amount,
        currency: data.currency,
        name: 'CommunityCollab',
        description: `Skill: ${skill.skill_name}`,
        order_id: data.order_id,
        handler: async (response) => {
          try {
            await api.post(`/skills/connections/${connection._id}/verify-payment`, {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            })
            fetchConnection()
          } catch {
            alert('Payment verification failed. Contact support.')
          }
        },
        prefill: { name: user?.name, email: user?.email },
        theme: { color: '#03A6A1' },
      }
      const rzp = new window.Razorpay(options)
      rzp.open()
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to initiate payment')
    }
  }

  const isOwnListing = skill && user && (skill.user?._id || skill.user) === user._id

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

  return (
    <div className="max-w-4xl mx-auto">
      {/* Back */}
      <button onClick={() => navigate('/skills')} className="flex items-center gap-1 text-on-surface-variant hover:text-on-surface text-sm font-medium mb-6 group">
        <span className="material-symbols-outlined text-lg group-hover:-translate-x-1 transition-transform">arrow_back</span>
        Back to Skills
      </button>

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
                  <p className="text-sm font-bold">${skill.price_per_hour}/hour</p>
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
              <img src={skill.user?.avatar_url || 'https://randomuser.me/api/portraits/lego/1.jpg'} alt="" className="w-12 h-12 rounded-2xl border-2 border-outline-variant/20" />
              <div>
                <p className="font-bold">{skill.user?.name}</p>
                {skill.user?.verified && <span className="material-symbols-outlined text-secondary text-sm material-fill">verified</span>}
              </div>
            </div>
            {skill.user?.bio && <p className="text-xs text-on-surface-variant line-clamp-3 mb-3">{skill.user.bio}</p>}
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
                {connection.status === 'accepted' && connection.exchange_type === 'paid' && connection.payment_status !== 'paid' && (
                  <div className="rounded-2xl p-4" style={{ background: '#FFE3BB' }}>
                    <h3 className="font-bold text-sm mb-1" style={{ color: '#03A6A1' }}>Session Rate</h3>
                    <p className="text-2xl font-extrabold mb-0.5" style={{ color: '#FF4F0F' }}>₹{skill.price_per_hour}/hr</p>
                    <p className="text-xs text-on-surface-variant mb-3">Connection accepted — pay to confirm session</p>
                    <button onClick={handlePaySession} className="w-full py-3 rounded-xl font-bold text-white text-sm active:scale-95 transition-transform" style={{ background: '#FF4F0F' }}>
                      Pay ₹{skill.price_per_hour} Now
                    </button>
                  </div>
                )}
                {connection.status === 'accepted' && (connection.exchange_type !== 'paid' || connection.payment_status === 'paid') && (
                  <div className="flex items-center gap-2 justify-center py-3 rounded-xl font-bold text-sm" style={{ color: '#03A6A1', border: '2px solid #03A6A1' }}>
                    <span className="material-symbols-outlined text-base">check_circle</span>
                    {connection.payment_status === 'paid' ? 'Payment confirmed' : 'Connected'}
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
