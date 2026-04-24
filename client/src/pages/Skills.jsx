import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import LegalNoticeModal from '../components/LegalNoticeModal'
import TrustBadge from '../components/TrustBadge'

const categoryFilters = ['all', 'tech', 'languages', 'arts_music', 'life_skills', 'fitness', 'academic', 'trades']
const modeFilters = ['all', 'online', 'in_person', 'both']
const exchangeFilters = ['all', 'free', 'paid', 'barter']

export default function Skills() {
  const navigate = useNavigate()
  const [showLegal, setShowLegal] = useState(() => !sessionStorage.getItem('legal_noticed_skills'))
  const [skills, setSkills] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ category: 'all', mode: 'all', exchange_type: 'all' })
  const [search, setSearch] = useState('')
  const [listingType, setListingType] = useState('all')
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ skill_name: '', skill_category: 'tech', listing_type: 'offering', description: '', proficiency_level: 'intermediate', mode: 'both', exchange_type: 'free', what_i_offer_in_return: '' })

  const fetchSkills = async ({ q = '', category = 'all', mode = 'all', exchange_type = 'all', listing_type = 'all' } = {}) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (q) params.append('q', q)
      if (category !== 'all') params.append('category', category)
      if (mode !== 'all') params.append('mode', mode)
      if (exchange_type !== 'all') params.append('exchange_type', exchange_type)
      if (listing_type !== 'all') params.append('listing_type', listing_type)
      const { data } = await api.get(`/skills?${params.toString()}`)
      setSkills(data.data || [])
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSkills({ q: search, ...filters, listing_type: listingType })
    }, 400)
    return () => clearTimeout(timer)
  }, [search, filters, listingType])

  const handleCreate = async (e) => {
    e.preventDefault()
    try {
      await api.post('/skills', form)
      setShowCreate(false)
      fetchSkills({ q: search, ...filters, listing_type: listingType })
    } catch (err) { console.error(err) }
  }

  const categoryIcons = { tech: 'code', languages: 'translate', arts_music: 'palette', life_skills: 'self_improvement', fitness: 'fitness_center', academic: 'school', trades: 'construction', other: 'interests' }

  return (
    <div className="max-w-7xl mx-auto">
      {showLegal && <LegalNoticeModal pageName="skills" onDismiss={() => setShowLegal(false)} />}
      <div className="flex flex-col md:flex-row justify-between items-baseline mb-10 gap-4">
        <div>
          <h1 className="text-4xl md:text-5xl font-headline font-extrabold tracking-tighter mb-2">Skill Exchange</h1>
          <div className="h-1 w-24 bg-tertiary rounded-full"></div>
          <p className="text-on-surface-variant mt-3">Trade skills and learn something new from your community.</p>
        </div>
        <button onClick={() => setShowCreate(!showCreate)} className="primary-gradient text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg active:scale-95 transition-transform flex items-center gap-2 shrink-0">
          <span className="material-symbols-outlined text-sm">add</span> List Skill
        </button>
      </div>

      {/* Search Bar */}
      <div className="flex flex-col md:flex-row gap-3 mb-4">
        <input
          type="text"
          placeholder="Search skills e.g. Python, Guitar, Assembly..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 bg-surface-container rounded-xl px-4 py-3 text-sm border-none focus:ring-2 focus:ring-primary/30 outline-none"
        />
        <select
          value={listingType}
          onChange={e => setListingType(e.target.value)}
          className="bg-surface-container rounded-xl px-4 py-3 text-sm border-none focus:ring-2 focus:ring-primary/30 outline-none"
        >
          <option value="all">Offering & Seeking</option>
          <option value="offering">Offering</option>
          <option value="seeking">Seeking</option>
        </select>
      </div>

      {/* Filters */}
      <div className="space-y-3 mb-8">
        <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
          {categoryFilters.map(c => (
            <button key={c} onClick={() => setFilters({ ...filters, category: c })} className={`px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-wider whitespace-nowrap transition-all ${filters.category === c ? 'bg-tertiary text-on-tertiary shadow-lg' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'}`}>
              {c === 'arts_music' ? 'Arts & Music' : c === 'life_skills' ? 'Life Skills' : c}
            </button>
          ))}
        </div>
        <div className="flex gap-2 overflow-x-auto hide-scrollbar">
          {modeFilters.map(m => (
            <button key={m} onClick={() => setFilters({ ...filters, mode: m })} className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase whitespace-nowrap transition-all ${filters.mode === m ? 'bg-secondary text-on-secondary' : 'bg-surface-container text-on-surface-variant'}`}>
              {m === 'in_person' ? 'In Person' : m}
            </button>
          ))}
          <span className="w-px bg-outline-variant/30 mx-1"></span>
          {exchangeFilters.map(e => (
            <button key={e} onClick={() => setFilters({ ...filters, exchange_type: e })} className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase whitespace-nowrap transition-all ${filters.exchange_type === e ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant'}`}>
              {e}
            </button>
          ))}
        </div>
      </div>

      {/* Create Form */}
      {showCreate && (
        <div className="bg-surface-container-low rounded-3xl p-8 mb-10 shadow-sm">
          <h2 className="text-xl font-bold mb-6">List a Skill</h2>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <input type="text" placeholder="Skill name" value={form.skill_name} onChange={e => setForm({ ...form, skill_name: e.target.value })} required className="bg-surface-container rounded-xl px-4 py-3 text-sm border-none focus:ring-2 focus:ring-primary/30 outline-none" />
            <select value={form.skill_category} onChange={e => setForm({ ...form, skill_category: e.target.value })} className="bg-surface-container rounded-xl px-4 py-3 text-sm border-none focus:ring-2 focus:ring-primary/30 outline-none">
              {categoryFilters.filter(c => c !== 'all').map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select value={form.listing_type} onChange={e => setForm({ ...form, listing_type: e.target.value })} className="bg-surface-container rounded-xl px-4 py-3 text-sm border-none focus:ring-2 focus:ring-primary/30 outline-none">
              <option value="offering">Offering</option>
              <option value="seeking">Seeking</option>
            </select>
            <select value={form.exchange_type} onChange={e => setForm({ ...form, exchange_type: e.target.value })} className="bg-surface-container rounded-xl px-4 py-3 text-sm border-none focus:ring-2 focus:ring-primary/30 outline-none">
              <option value="free">Free</option>
              <option value="paid">Paid</option>
              <option value="barter">Barter</option>
            </select>
            <textarea placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="md:col-span-2 bg-surface-container rounded-xl px-4 py-3 text-sm border-none focus:ring-2 focus:ring-primary/30 outline-none resize-none h-24" />
            <div className="md:col-span-2 flex gap-3">
              <button type="submit" className="primary-gradient text-white px-8 py-3 rounded-xl font-bold shadow-lg">Publish Listing</button>
              <button type="button" onClick={() => setShowCreate(false)} className="bg-surface-container text-on-surface-variant px-6 py-3 rounded-xl font-bold">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div className="flex justify-center py-20"><span className="material-symbols-outlined text-primary text-5xl animate-spin">progress_activity</span></div>
      ) : skills.length === 0 ? (
        <div className="text-center py-20">
          <span className="material-symbols-outlined text-surface-container-highest text-8xl">psychology</span>
          <h3 className="text-xl font-bold mt-4">No skills listed yet</h3>
          <p className="text-on-surface-variant mt-2">Share your expertise!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {skills.map(skill => (
            <div key={skill._id} onClick={() => navigate(`/skills/${skill._id}`)} className="bg-surface-container-low rounded-3xl p-6 hover:shadow-md transition-all group cursor-pointer">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-inner">
                  <span className="material-symbols-outlined text-tertiary text-2xl">{categoryIcons[skill.skill_category] || 'interests'}</span>
                </div>
                <div className="flex-1">
                  <h3 className="font-bold">{skill.skill_name}</h3>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${skill.listing_type === 'offering' ? 'bg-secondary-container text-on-secondary-container' : 'bg-primary-fixed text-primary'}`}>{skill.listing_type}</span>
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant">{skill.mode === 'in_person' ? 'In Person' : skill.mode}</span>
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${skill.exchange_type === 'free' ? 'bg-secondary-fixed text-on-secondary-fixed' : skill.exchange_type === 'barter' ? 'bg-tertiary-fixed text-on-tertiary-fixed' : 'bg-primary-fixed text-primary'}`}>{skill.exchange_type}</span>
                  </div>
                </div>
              </div>
              <p className="text-on-surface-variant text-sm line-clamp-3 mb-4">{skill.description}</p>
              {skill.what_i_offer_in_return && (
                <p className="text-xs text-tertiary font-medium mb-4">↔ {skill.what_i_offer_in_return}</p>
              )}
              <div className="flex items-center justify-between pt-4 border-t border-outline-variant/10">
                <div className="flex items-center gap-2 flex-wrap">
                  <img src={skill.user?.avatar_url || 'https://ui-avatars.com/api/?name=U&background=e8e0d8&color=3c4948&bold=true&size=128'} alt="" className="w-7 h-7 rounded-full" />
                  <div>
                    <span className="text-xs font-bold">{skill.user?.name}</span>
                    {skill.user?.verified && <span className="material-symbols-outlined text-secondary text-[10px] ml-1 material-fill">verified</span>}
                  </div>
                  <TrustBadge trust_score={skill.user?.trust_score} trust_level={skill.user?.trust_level} size="sm" />
                </div>
                <button onClick={(e) => { e.stopPropagation(); navigate(`/skills/${skill._id}`) }} className="text-xs text-primary font-bold bg-primary-fixed px-4 py-1.5 rounded-full hover:bg-primary hover:text-white transition-all">Connect</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
