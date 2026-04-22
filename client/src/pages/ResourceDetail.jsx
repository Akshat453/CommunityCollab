import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'

const typeIcons = { tool: 'build', workspace: 'meeting_room', vehicle: 'directions_car', meal: 'restaurant', groceries: 'shopping_cart', other: 'category' }

export default function ResourceDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [resource, setResource] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [requesting, setRequesting] = useState(false)
  const [requestForm, setRequestForm] = useState({ message: '', start_date: '', end_date: '' })
  const [showRequestForm, setShowRequestForm] = useState(false)

  const fetchResource = async () => {
    setLoading(true)
    try {
      const { data } = await api.get(`/resources/${id}`)
      setResource(data.data)
    } catch (err) { setError(err.response?.data?.message || 'Failed to load resource') }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchResource() }, [id])

  const handleRequest = async (e) => {
    e.preventDefault()
    setRequesting(true)
    try {
      await api.post(`/resources/${id}/request`, requestForm)
      setShowRequestForm(false)
      fetchResource()
      alert('Request sent!')
    } catch (err) { alert(err.response?.data?.message || 'Failed') }
    finally { setRequesting(false) }
  }

  if (loading) return <div className="max-w-4xl mx-auto flex justify-center py-32"><span className="material-symbols-outlined text-primary text-5xl animate-spin">progress_activity</span></div>
  if (error) return <div className="max-w-4xl mx-auto text-center py-32"><span className="material-symbols-outlined text-error text-6xl mb-4">error</span><h2 className="text-xl font-bold mb-2">Error</h2><p className="text-on-surface-variant mb-6">{error}</p><button onClick={() => navigate('/resources')} className="primary-gradient text-white px-6 py-2.5 rounded-xl font-bold shadow-lg">Back</button></div>
  if (!resource) return null

  const isOwner = (resource.owner?._id || resource.owner) === user?._id

  return (
    <div className="max-w-4xl mx-auto">
      <button onClick={() => navigate('/resources')} className="flex items-center gap-1 text-on-surface-variant hover:text-on-surface text-sm font-medium mb-6 group">
        <span className="material-symbols-outlined text-lg group-hover:-translate-x-1 transition-transform">arrow_back</span> Back to Resources
      </button>

      <div className="bg-surface-container-low rounded-3xl p-8 mb-8">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 bg-secondary-container rounded-2xl flex items-center justify-center">
            <span className="material-symbols-outlined text-on-secondary-container material-fill text-3xl">{typeIcons[resource.type] || 'category'}</span>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed">{resource.type}</span>
              <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${resource.status === 'available' ? 'bg-secondary-container text-on-secondary-container' : 'bg-error-container text-on-error-container'}`}>{resource.status}</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-headline font-extrabold tracking-tighter">{resource.title}</h1>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          <div className="bg-surface-container-low rounded-3xl p-6">
            <h2 className="font-bold text-lg mb-3">Description</h2>
            <p className="text-on-surface-variant leading-relaxed whitespace-pre-wrap">{resource.description || 'No description provided.'}</p>
          </div>
          <div className="bg-surface-container-low rounded-3xl p-6 space-y-4">
            <h2 className="font-bold text-lg mb-1">Details</h2>
            <div className="flex items-center gap-3"><div className="w-10 h-10 bg-primary-fixed rounded-xl flex items-center justify-center"><span className="material-symbols-outlined text-primary material-fill">sell</span></div><div><p className="text-sm font-bold">{resource.is_free ? 'Free to borrow' : `$${resource.price_per_day}/day`}</p><p className="text-xs text-on-surface-variant">Pricing</p></div></div>
            {resource.condition && <div className="flex items-center gap-3"><div className="w-10 h-10 bg-secondary-container rounded-xl flex items-center justify-center"><span className="material-symbols-outlined text-on-secondary-container material-fill">verified</span></div><div><p className="text-sm font-bold capitalize">{resource.condition}</p><p className="text-xs text-on-surface-variant">Condition</p></div></div>}
            {resource.location?.city && <div className="flex items-center gap-3"><div className="w-10 h-10 bg-tertiary-fixed rounded-xl flex items-center justify-center"><span className="material-symbols-outlined text-tertiary material-fill">location_on</span></div><div><p className="text-sm font-bold">{resource.location.city}</p><p className="text-xs text-on-surface-variant">Location</p></div></div>}
          </div>
          {isOwner && resource.requests?.length > 0 && (
            <div className="bg-surface-container-low rounded-3xl p-6">
              <h2 className="font-bold text-lg mb-4">Borrow Requests ({resource.requests.length})</h2>
              <div className="space-y-3">{resource.requests.map((r, i) => (
                <div key={i} className="flex items-center justify-between bg-surface-container rounded-xl px-4 py-3">
                  <div className="flex items-center gap-3"><img src={r.requester?.avatar_url || 'https://randomuser.me/api/portraits/lego/1.jpg'} alt="" className="w-8 h-8 rounded-full" /><div><p className="text-sm font-bold">{r.requester?.name || 'User'}</p><p className="text-xs text-on-surface-variant">{r.message}</p></div></div>
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${r.status === 'pending' ? 'bg-tertiary-fixed text-on-tertiary-fixed' : r.status === 'approved' ? 'bg-secondary-container text-on-secondary-container' : 'bg-error-container text-on-error-container'}`}>{r.status}</span>
                </div>
              ))}</div>
            </div>
          )}
        </div>
        <div className="space-y-6">
          <div className="bg-surface-container-low rounded-3xl p-6">
            <h3 className="text-xs font-bold uppercase text-on-surface-variant tracking-wider mb-4">Shared by</h3>
            <div className="flex items-center gap-3"><img src={resource.owner?.avatar_url || 'https://randomuser.me/api/portraits/lego/1.jpg'} alt="" className="w-12 h-12 rounded-2xl border-2 border-outline-variant/20" /><div><p className="font-bold">{resource.owner?.name}</p>{resource.owner?.verified && <span className="material-symbols-outlined text-secondary text-sm material-fill">verified</span>}</div></div>
            {resource.owner?.bio && <p className="text-xs text-on-surface-variant line-clamp-3 mt-3">{resource.owner.bio}</p>}
          </div>
          <div className="bg-surface-container-low rounded-3xl p-6">
            {isOwner ? <div className="text-center py-3 rounded-xl bg-surface-container text-on-surface-variant font-bold">Your Resource</div>
            : resource.status !== 'available' ? <div className="text-center py-3 rounded-xl bg-error-container text-on-error-container font-bold">Unavailable</div>
            : !showRequestForm ? <button onClick={() => setShowRequestForm(true)} className="w-full py-3 rounded-xl primary-gradient text-white font-bold text-base shadow-lg active:scale-95 transition-transform">Request Access</button>
            : <form onSubmit={handleRequest} className="space-y-3">
                <input type="date" value={requestForm.start_date} onChange={e => setRequestForm({...requestForm, start_date: e.target.value})} required className="w-full bg-surface-container rounded-xl px-4 py-2.5 text-sm border-none focus:ring-2 focus:ring-primary/30 outline-none" />
                <input type="date" value={requestForm.end_date} onChange={e => setRequestForm({...requestForm, end_date: e.target.value})} required className="w-full bg-surface-container rounded-xl px-4 py-2.5 text-sm border-none focus:ring-2 focus:ring-primary/30 outline-none" />
                <textarea value={requestForm.message} onChange={e => setRequestForm({...requestForm, message: e.target.value})} placeholder="Message to owner..." className="w-full bg-surface-container rounded-xl px-4 py-2.5 text-sm border-none focus:ring-2 focus:ring-primary/30 outline-none resize-none h-20" />
                <button type="submit" disabled={requesting} className="w-full py-2.5 rounded-xl primary-gradient text-white font-bold text-sm shadow-lg disabled:opacity-50">{requesting ? 'Sending...' : 'Send Request'}</button>
                <button type="button" onClick={() => setShowRequestForm(false)} className="w-full py-2 rounded-xl bg-surface-container text-on-surface-variant font-bold text-sm">Cancel</button>
              </form>}
          </div>
        </div>
      </div>
    </div>
  )
}
