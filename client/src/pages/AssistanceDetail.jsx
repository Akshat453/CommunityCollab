import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'
import TrustBadge from '../components/TrustBadge'

const urgencyColors = { low: 'bg-secondary-container text-on-secondary-container', medium: 'bg-tertiary-fixed text-on-tertiary-fixed', urgent: 'bg-error-container text-on-error-container' }

export default function AssistanceDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [post, setPost] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [acceptingResponse, setAcceptingResponse] = useState(null)

  const fetchPost = async () => {
    setLoading(true)
    try {
      const { data } = await api.get(`/assistance/${id}`)
      setPost(data.data)
    } catch (err) { setError(err.response?.data?.message || 'Failed to load post') }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchPost() }, [id])

  const handleRespond = async () => {
    const msg = prompt('Leave a message:')
    if (!msg) return
    try {
      await api.post(`/assistance/${id}/respond`, { message: msg })
      fetchPost()
    } catch (err) { alert(err.response?.data?.message || 'Failed') }
  }

  const handleAcceptResponse = async (responseId) => {
    setAcceptingResponse(responseId)
    try {
      await api.patch(`/assistance/${id}/responses/${responseId}/accept`)
      fetchPost()
    } catch (err) { alert(err.response?.data?.message || 'Failed to accept response') }
    finally { setAcceptingResponse(null) }
  }

  if (loading) return <div className="max-w-4xl mx-auto flex justify-center py-32"><span className="material-symbols-outlined text-primary text-5xl animate-spin">progress_activity</span></div>
  if (error) return <div className="max-w-4xl mx-auto text-center py-32"><span className="material-symbols-outlined text-error text-6xl mb-4">error</span><h2 className="text-xl font-bold mb-2">Error</h2><p className="text-on-surface-variant mb-6">{error}</p><button onClick={() => navigate('/assistance')} className="primary-gradient text-white px-6 py-2.5 rounded-xl font-bold shadow-lg">Back</button></div>
  if (!post) return null

  const isPoster = (post.poster?._id || post.poster) === user?._id
  const hasResponded = post.responses?.some(r => (r.responder?._id || r.responder) === user?._id)

  return (
    <div className="max-w-4xl mx-auto">
      <button onClick={() => navigate('/assistance')} className="flex items-center gap-1 text-on-surface-variant hover:text-on-surface text-sm font-medium mb-6 group">
        <span className="material-symbols-outlined text-lg group-hover:-translate-x-1 transition-transform">arrow_back</span> Back to Assistance
      </button>

      {/* Warning Banner */}
      <div className="rounded-xl px-4 py-2.5 mb-4 flex items-center gap-2" style={{ background: '#FFF8E1', border: '1px solid #FFD54F' }}>
        <span className="material-symbols-outlined text-sm" style={{ color: '#F57F17' }}>warning</span>
        <p className="text-xs font-medium" style={{ color: '#F57F17' }}>
          All transactions are logged. Fraudulent activity will result in account suspension and legal action.
        </p>
      </div>

      <div className={`bg-surface-container-low rounded-3xl p-8 mb-8 border-l-4 ${post.urgency === 'urgent' ? 'border-error' : post.urgency === 'medium' ? 'border-tertiary' : 'border-secondary'}`}>
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${post.post_type === 'requesting' ? 'bg-primary-fixed text-primary' : 'bg-secondary-container text-on-secondary-container'}`}>{post.post_type === 'requesting' ? 'Needs Help' : 'Offering Help'}</span>
          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${urgencyColors[post.urgency]}`}>{post.urgency}</span>
          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant">{post.category}</span>
          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${post.status === 'open' ? 'bg-secondary-container text-on-secondary-container' : post.status === 'matched' ? 'bg-primary-fixed text-primary' : 'bg-surface-container text-on-surface-variant'}`}>{post.status}</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-headline font-extrabold tracking-tighter">{post.title}</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          <div className="bg-surface-container-low rounded-3xl p-6">
            <h2 className="font-bold text-lg mb-3">Description</h2>
            <p className="text-on-surface-variant leading-relaxed whitespace-pre-wrap">{post.description || 'No description provided.'}</p>
          </div>

          <div className="bg-surface-container-low rounded-3xl p-6 space-y-4">
            <h2 className="font-bold text-lg mb-1">Details</h2>
            {post.scheduled_at && (
              <div className="flex items-center gap-3"><div className="w-10 h-10 bg-primary-fixed rounded-xl flex items-center justify-center"><span className="material-symbols-outlined text-primary material-fill">schedule</span></div><div><p className="text-sm font-bold">{new Date(post.scheduled_at).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p><p className="text-xs text-on-surface-variant">Scheduled date</p></div></div>
            )}
            {post.location?.city && (
              <div className="flex items-center gap-3"><div className="w-10 h-10 bg-secondary-container rounded-xl flex items-center justify-center"><span className="material-symbols-outlined text-on-secondary-container material-fill">location_on</span></div><div><p className="text-sm font-bold">{post.location.city}</p><p className="text-xs text-on-surface-variant">Location</p></div></div>
            )}
            <div className="flex items-center gap-3"><div className="w-10 h-10 bg-tertiary-fixed rounded-xl flex items-center justify-center"><span className="material-symbols-outlined text-tertiary material-fill">forum</span></div><div><p className="text-sm font-bold">{post.responses?.length || 0} response{(post.responses?.length || 0) !== 1 ? 's' : ''}</p><p className="text-xs text-on-surface-variant">People have reached out</p></div></div>
          </div>

          {/* Responses */}
          {post.responses?.length > 0 && (
            <div className="bg-surface-container-low rounded-3xl p-6">
              <h2 className="font-bold text-lg mb-4">Responses</h2>
              <div className="space-y-3">{post.responses.map((r, i) => (
                <div key={r._id || i} className="bg-surface-container rounded-xl px-4 py-3 space-y-2">
                  <div className="flex items-start gap-3">
                    <img src={r.responder?.avatar_url || 'https://ui-avatars.com/api/?name=U&background=e8e0d8&color=3c4948&bold=true&size=128'} alt="" className="w-8 h-8 rounded-full mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold">{r.responder?.name || 'User'}</p>
                          <TrustBadge trust_score={r.responder?.trust_score} trust_level={r.responder?.trust_level} size="sm" />
                        </div>
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${r.status === 'accepted' ? 'bg-secondary-container text-on-secondary-container' : r.status === 'rejected' ? 'bg-error-container text-on-error-container' : 'bg-surface-container-high text-on-surface-variant'}`}>{r.status}</span>
                      </div>
                      <p className="text-sm text-on-surface-variant mt-1">{r.message}</p>
                    </div>
                  </div>
                  {/* Accept button for poster on pending responses */}
                  {isPoster && r.status === 'pending' && post.status !== 'matched' && (
                    <div className="flex justify-end pt-1">
                      <button
                        onClick={() => handleAcceptResponse(r._id)}
                        disabled={acceptingResponse === r._id}
                        className="px-4 py-1.5 rounded-lg font-bold text-white text-xs active:scale-95 transition-transform disabled:opacity-50"
                        style={{ background: '#03A6A1' }}
                      >
                        {acceptingResponse === r._id ? 'Accepting...' : '✓ Accept'}
                      </button>
                    </div>
                  )}
                </div>
              ))}</div>
            </div>
          )}

          {post.tags?.length > 0 && <div className="flex flex-wrap gap-2">{post.tags.map((tag, i) => <span key={i} className="bg-surface-container text-on-surface-variant text-xs font-bold px-3 py-1 rounded-full">#{tag}</span>)}</div>}
        </div>

        <div className="space-y-6">
          <div className="bg-surface-container-low rounded-3xl p-6">
            <h3 className="text-xs font-bold uppercase text-on-surface-variant tracking-wider mb-4">Posted by</h3>
            <div className="flex items-center gap-3">
              <img src={post.poster?.avatar_url || 'https://ui-avatars.com/api/?name=U&background=e8e0d8&color=3c4948&bold=true&size=128'} alt="" className="w-12 h-12 rounded-2xl border-2 border-outline-variant/20" />
              <div><p className="font-bold">{post.poster?.name}</p>{post.poster?.verified && <span className="material-symbols-outlined text-secondary text-sm material-fill">verified</span>}</div>
            </div>
            <div className="mt-2">
              <TrustBadge trust_score={post.poster?.trust_score} trust_level={post.poster?.trust_level} size="md" />
            </div>
            {post.poster?.bio && <p className="text-xs text-on-surface-variant line-clamp-3 mt-3">{post.poster.bio}</p>}
          </div>

          <div className="bg-surface-container-low rounded-3xl p-6">
            {isPoster ? <div className="text-center py-3 rounded-xl bg-surface-container text-on-surface-variant font-bold">Your Post</div>
            : hasResponded ? <div className="text-center py-3 rounded-xl bg-secondary-container text-on-secondary-container font-bold">Responded ✓</div>
            : <button onClick={handleRespond} className="w-full py-3 rounded-xl primary-gradient text-white font-bold text-base shadow-lg active:scale-95 transition-transform">
                {post.post_type === 'requesting' ? 'I Can Help' : 'Request Help'}
              </button>}
          </div>
        </div>
      </div>
    </div>
  )
}
