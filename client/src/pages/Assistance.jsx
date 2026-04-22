import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'

const categoryFilters = ['all', 'errand', 'tutoring', 'delivery', 'transport', 'eldercare', 'petcare', 'other']
const urgencyColors = { low: 'bg-secondary-container text-on-secondary-container', medium: 'bg-tertiary-fixed text-on-tertiary-fixed', urgent: 'bg-error-container text-on-error-container' }

export default function Assistance() {
  const navigate = useNavigate()
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState('all')
  const [search, setSearch] = useState('')
  const [urgencyFilter, setUrgencyFilter] = useState('')
  const [postTypeFilter, setPostTypeFilter] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ title: '', description: '', category: 'errand', post_type: 'requesting', urgency: 'low' })

  const fetchPosts = async ({ q = '', category = '', urgency = '', post_type = '' } = {}) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (q) params.append('q', q)
      if (category && category !== 'all') params.append('category', category)
      if (urgency) params.append('urgency', urgency)
      if (post_type) params.append('post_type', post_type)
      const { data } = await api.get(`/assistance?${params.toString()}`)
      setPosts(data.data || [])
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPosts({ q: search, category: activeCategory, urgency: urgencyFilter, post_type: postTypeFilter })
    }, 400)
    return () => clearTimeout(timer)
  }, [search, activeCategory, urgencyFilter, postTypeFilter])

  const handleCreate = async (e) => {
    e.preventDefault()
    try {
      await api.post('/assistance', form)
      setShowCreate(false)
      setForm({ title: '', description: '', category: 'errand', post_type: 'requesting', urgency: 'low' })
      fetchPosts({ q: search, category: activeCategory, urgency: urgencyFilter, post_type: postTypeFilter })
    } catch (err) { console.error(err) }
  }

  const handleRespond = async (postId) => {
    const msg = prompt('Leave a message for the poster:')
    if (!msg) return
    try {
      await api.post(`/assistance/${postId}/respond`, { message: msg })
      fetchPosts({ q: search, category: activeCategory, urgency: urgencyFilter, post_type: postTypeFilter })
    } catch (err) { alert(err.response?.data?.message || 'Failed') }
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-baseline mb-10 gap-4">
        <div>
          <h1 className="text-4xl md:text-5xl font-headline font-extrabold tracking-tighter mb-2">Community Help</h1>
          <div className="h-1 w-24 bg-primary rounded-full"></div>
          <p className="text-on-surface-variant mt-3">Request or offer help — neighbors helping neighbors.</p>
        </div>
        <button onClick={() => setShowCreate(!showCreate)} className="primary-gradient text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg active:scale-95 transition-transform flex items-center gap-2 shrink-0">
          <span className="material-symbols-outlined text-sm">add</span> Post
        </button>
      </div>

      {/* Search Bar */}
      <div className="flex flex-col md:flex-row gap-3 mb-4">
        <input
          type="text"
          placeholder="Search assistance e.g. grocery delivery, tutoring..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 bg-surface-container rounded-xl px-4 py-3 text-sm border-none focus:ring-2 focus:ring-primary/30 outline-none"
        />
        <select
          value={urgencyFilter}
          onChange={e => setUrgencyFilter(e.target.value)}
          className="bg-surface-container rounded-xl px-4 py-3 text-sm border-none focus:ring-2 focus:ring-primary/30 outline-none"
        >
          <option value="">All Urgency</option>
          <option value="urgent">Urgent</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <select
          value={postTypeFilter}
          onChange={e => setPostTypeFilter(e.target.value)}
          className="bg-surface-container rounded-xl px-4 py-3 text-sm border-none focus:ring-2 focus:ring-primary/30 outline-none"
        >
          <option value="">Offering & Requesting</option>
          <option value="offering">Offering</option>
          <option value="requesting">Requesting</option>
        </select>
      </div>

      <div className="flex gap-2 mb-8 overflow-x-auto hide-scrollbar pb-2">
        {categoryFilters.map(c => (
          <button key={c} onClick={() => setActiveCategory(c)} className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all ${activeCategory === c ? 'primary-gradient text-white shadow-lg' : 'bg-surface-container text-on-surface-variant'}`}>{c}</button>
        ))}
      </div>

      {showCreate && (
        <div className="bg-surface-container-low rounded-3xl p-8 mb-10 shadow-sm">
          <h2 className="text-xl font-bold mb-6">Post a Request or Offer</h2>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <input type="text" placeholder="Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required className="bg-surface-container rounded-xl px-4 py-3 text-sm border-none focus:ring-2 focus:ring-primary/30 outline-none" />
            <select value={form.post_type} onChange={e => setForm({ ...form, post_type: e.target.value })} className="bg-surface-container rounded-xl px-4 py-3 text-sm border-none focus:ring-2 focus:ring-primary/30 outline-none">
              <option value="requesting">Requesting Help</option>
              <option value="offering">Offering Help</option>
            </select>
            <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="bg-surface-container rounded-xl px-4 py-3 text-sm border-none focus:ring-2 focus:ring-primary/30 outline-none">
              {categoryFilters.filter(c => c !== 'all').map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select value={form.urgency} onChange={e => setForm({ ...form, urgency: e.target.value })} className="bg-surface-container rounded-xl px-4 py-3 text-sm border-none focus:ring-2 focus:ring-primary/30 outline-none">
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="urgent">Urgent</option>
            </select>
            <textarea placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="md:col-span-2 bg-surface-container rounded-xl px-4 py-3 text-sm border-none focus:ring-2 focus:ring-primary/30 outline-none resize-none h-24" />
            <div className="md:col-span-2 flex gap-3">
              <button type="submit" className="primary-gradient text-white px-8 py-3 rounded-xl font-bold shadow-lg">Post</button>
              <button type="button" onClick={() => setShowCreate(false)} className="bg-surface-container text-on-surface-variant px-6 py-3 rounded-xl font-bold">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20"><span className="material-symbols-outlined text-primary text-5xl animate-spin">progress_activity</span></div>
      ) : posts.length === 0 ? (
        <div className="text-center py-20"><span className="material-symbols-outlined text-surface-container-highest text-8xl">volunteer_activism</span><h3 className="text-xl font-bold mt-4">No assistance posts yet</h3></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map(post => (
            <div key={post._id} onClick={() => navigate(`/assistance/${post._id}`)} className={`bg-surface-container-low rounded-3xl p-6 hover:shadow-md transition-all border-l-4 cursor-pointer ${post.urgency === 'urgent' ? 'border-error' : post.urgency === 'medium' ? 'border-tertiary' : 'border-secondary'}`}>
              <div className="flex items-center gap-2 mb-3">
                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${post.post_type === 'requesting' ? 'bg-primary-fixed text-primary' : 'bg-secondary-container text-on-secondary-container'}`}>{post.post_type === 'requesting' ? 'Needs Help' : 'Offering Help'}</span>
                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${urgencyColors[post.urgency]}`}>{post.urgency}</span>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant">{post.category}</span>
              </div>
              <h3 className="font-bold text-lg mb-2">{post.title}</h3>
              <p className="text-on-surface-variant text-sm line-clamp-3 mb-4">{post.description}</p>
              <div className="flex items-center justify-between pt-4 border-t border-outline-variant/10">
                <div className="flex items-center gap-2">
                  <img src={post.poster?.avatar_url || 'https://randomuser.me/api/portraits/lego/1.jpg'} alt="" className="w-6 h-6 rounded-full" />
                  <span className="text-xs font-medium">{post.poster?.name}</span>
                </div>
                <button onClick={(e) => { e.stopPropagation(); handleRespond(post._id) }} className="text-xs font-bold text-primary bg-primary-fixed px-4 py-1.5 rounded-full hover:bg-primary hover:text-white transition-all">
                  {post.post_type === 'requesting' ? 'I Can Help' : 'Request Help'}
                </button>
              </div>
              {post.responses?.length > 0 && (
                <div className="mt-3 text-xs text-on-surface-variant">{post.responses.length} response{post.responses.length > 1 ? 's' : ''}</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
