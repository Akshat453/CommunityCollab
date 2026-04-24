import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import LegalNoticeModal from '../components/LegalNoticeModal'
import TrustBadge from '../components/TrustBadge'

const typeFilters = ['all', 'tool', 'workspace', 'vehicle', 'meal', 'other']

export default function Resources() {
  const navigate = useNavigate()
  const [showLegal, setShowLegal] = useState(() => !sessionStorage.getItem('legal_noticed_resources'))
  const [resources, setResources] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeType, setActiveType] = useState('all')
  const [search, setSearch] = useState('')
  const [isFree, setIsFree] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ title: '', description: '', type: 'tool', condition: 'good', is_free: true, price_per_day: 0 })

  const fetchResources = async ({ q = '', type = '', isFree: free = '' } = {}) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (q) params.append('q', q)
      if (type && type !== 'all') params.append('type', type)
      if (free !== '') params.append('isFree', free)
      const { data } = await api.get(`/resources?${params.toString()}`)
      setResources(data.data || [])
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchResources({ q: search, type: activeType, isFree })
    }, 400)
    return () => clearTimeout(timer)
  }, [search, activeType, isFree])

  const handleCreate = async (e) => {
    e.preventDefault()
    try {
      await api.post('/resources', form)
      setShowCreate(false)
      setForm({ title: '', description: '', type: 'tool', condition: 'good', is_free: true, price_per_day: 0 })
      fetchResources({ q: search, type: activeType, isFree })
    } catch (err) { console.error(err) }
  }

  const typeIcons = { tool: 'build', workspace: 'meeting_room', vehicle: 'directions_car', meal: 'restaurant', groceries: 'shopping_cart', other: 'category' }

  return (
    <div className="max-w-7xl mx-auto">
      {showLegal && <LegalNoticeModal pageName="resources" onDismiss={() => setShowLegal(false)} />}
      <div className="flex flex-col md:flex-row justify-between items-baseline mb-10 gap-4">
        <div>
          <h1 className="text-4xl md:text-5xl font-headline font-extrabold tracking-tighter mb-2">Resource Sharing</h1>
          <div className="h-1 w-24 bg-secondary rounded-full"></div>
          <p className="text-on-surface-variant mt-3">Borrow tools, share workspaces, and reduce waste together.</p>
        </div>
        <button onClick={() => setShowCreate(!showCreate)} className="primary-gradient text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg active:scale-95 transition-transform flex items-center gap-2 shrink-0">
          <span className="material-symbols-outlined text-sm">add</span> Share Resource
        </button>
      </div>

      {/* Search Bar */}
      <div className="flex flex-col md:flex-row gap-3 mb-4">
        <input
          type="text"
          placeholder="Search resources e.g. drill, study room, car..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 bg-surface-container rounded-xl px-4 py-3 text-sm border-none focus:ring-2 focus:ring-primary/30 outline-none"
        />
        <select
          value={isFree}
          onChange={e => setIsFree(e.target.value)}
          className="bg-surface-container rounded-xl px-4 py-3 text-sm border-none focus:ring-2 focus:ring-primary/30 outline-none"
        >
          <option value="">Free & Paid</option>
          <option value="true">Free Only</option>
          <option value="false">Paid Only</option>
        </select>
      </div>

      <div className="flex gap-2 mb-8 overflow-x-auto hide-scrollbar pb-2">
        {typeFilters.map(t => (
          <button key={t} onClick={() => setActiveType(t)} className={`px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all ${activeType === t ? 'bg-secondary text-on-secondary shadow-lg' : 'bg-surface-container text-on-surface-variant'}`}>{t}</button>
        ))}
      </div>

      {showCreate && (
        <div className="bg-surface-container-low rounded-3xl p-8 mb-10 shadow-sm">
          <h2 className="text-xl font-bold mb-6">Share a Resource</h2>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <input type="text" placeholder="Resource name" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required className="bg-surface-container rounded-xl px-4 py-3 text-sm border-none focus:ring-2 focus:ring-primary/30 outline-none" />
            <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className="bg-surface-container rounded-xl px-4 py-3 text-sm border-none focus:ring-2 focus:ring-primary/30 outline-none">
              {typeFilters.filter(t => t !== 'all').map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <textarea placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="md:col-span-2 bg-surface-container rounded-xl px-4 py-3 text-sm border-none focus:ring-2 focus:ring-primary/30 outline-none resize-none h-24" />
            <div className="md:col-span-2 flex gap-3">
              <button type="submit" className="primary-gradient text-white px-8 py-3 rounded-xl font-bold shadow-lg">Publish</button>
              <button type="button" onClick={() => setShowCreate(false)} className="bg-surface-container text-on-surface-variant px-6 py-3 rounded-xl font-bold">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20"><span className="material-symbols-outlined text-primary text-5xl animate-spin">progress_activity</span></div>
      ) : resources.length === 0 ? (
        <div className="text-center py-20"><span className="material-symbols-outlined text-surface-container-highest text-8xl">share_reviews</span><h3 className="text-xl font-bold mt-4">No resources yet</h3></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {resources.map(res => (
            <div key={res._id} onClick={() => navigate(`/resources/${res._id}`)} className="bg-surface-container-low rounded-3xl p-6 hover:shadow-md transition-all cursor-pointer">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-secondary-container rounded-2xl flex items-center justify-center">
                  <span className="material-symbols-outlined text-on-secondary-container material-fill">{typeIcons[res.type] || 'category'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed">{res.type}</span>
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${res.status === 'available' ? 'bg-secondary-container text-on-secondary-container' : 'bg-error-container text-on-error-container'}`}>{res.status}</span>
                </div>
              </div>
              <h3 className="font-bold text-lg mb-2">{res.title}</h3>
              <p className="text-on-surface-variant text-sm line-clamp-2 mb-4">{res.description}</p>
              <div className="flex items-center justify-between pt-4 border-t border-outline-variant/10">
                <div className="flex items-center gap-2 flex-wrap">
                  <img src={res.owner?.avatar_url || 'https://ui-avatars.com/api/?name=U&background=e8e0d8&color=3c4948&bold=true&size=128'} alt="" className="w-6 h-6 rounded-full" />
                  <span className="text-xs font-medium">{res.owner?.name}</span>
                  <TrustBadge trust_score={res.owner?.trust_score} trust_level={res.owner?.trust_level} size="sm" />
                </div>
                <span className={`text-sm font-bold ${res.is_free ? 'text-secondary' : 'text-primary'}`}>{res.is_free ? 'Free' : `$${res.price_per_day}/day`}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
