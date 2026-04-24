import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import TrustBadge from '../components/TrustBadge'

export default function Profile() {
  const { user, refreshUser } = useAuth()
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ name: '', bio: '', skills: '' })

  useEffect(() => {
    if (user) setForm({ name: user.name || '', bio: user.bio || '', skills: (user.skills || []).join(', ') })
  }, [user])

  const handleSave = async (e) => {
    e.preventDefault()
    try {
      await api.patch('/users/me', { ...form, skills: form.skills.split(',').map(s => s.trim()).filter(Boolean) })
      await refreshUser()
      setEditing(false)
    } catch (err) { console.error(err) }
  }

  if (!user) return null

  const stats = [
    { value: '24', label: 'Events Organized', color: 'text-primary' },
    { value: '156', label: 'Events Joined', color: 'text-secondary' },
    { value: '12', label: 'Skills Shared', color: 'text-tertiary' },
    { value: '42', label: 'Resources Exchanged', color: 'text-primary-container' },
  ]

  const badges = user.badges || []
  const badgeIcons = { 'Super Volunteer': 'volunteer_activism', 'Skill Guru': 'school', 'Eco Warrior': 'eco', 'Community Pillar': 'handshake', 'First Step': 'flag', 'Pool Master': 'directions_car' }
  const badgeColors = { 'Super Volunteer': 'text-primary', 'Skill Guru': 'text-secondary', 'Eco Warrior': 'text-tertiary', 'Community Pillar': 'text-primary-container', 'First Step': 'text-secondary', 'Pool Master': 'text-tertiary' }

  return (
    <div className="max-w-6xl mx-auto -mt-8">
      {/* Hero */}
      <section className="relative">
        <div className="h-48 md:h-64 w-full overflow-hidden rounded-3xl">
          <img className="w-full h-full object-cover" src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1200" alt="Cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#271902]/60 to-transparent rounded-3xl"></div>
        </div>
        <div className="relative max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-end gap-6 -mt-16">
            <div className="relative p-1 bg-surface rounded-[2.5rem]">
              <img className="w-32 h-32 md:w-40 md:h-40 rounded-[2rem] border-4 border-surface shadow-xl object-cover" src={user.avatar_url || 'https://ui-avatars.com/api/?name=U&background=e8e0d8&color=3c4948&bold=true&size=128'} alt={user.name} />
              {user.verified && (
                <div className="absolute -bottom-2 -right-2 bg-secondary text-white p-2 rounded-full border-4 border-surface shadow-lg">
                  <span className="material-symbols-outlined text-2xl material-fill">verified</span>
                </div>
              )}
            </div>
            <div className="flex-1 pb-4 text-center md:text-left">
              <h1 className="text-3xl md:text-5xl font-black text-on-surface tracking-tighter mb-2">{user.name}</h1>
              <div className="mb-2">
                <TrustBadge trust_score={user.trust_score} trust_level={user.trust_level} size="lg" />
              </div>
              <div className="flex flex-wrap justify-center md:justify-start items-center gap-4 text-on-surface-variant font-label text-sm uppercase tracking-wider">
                {user.location?.city && (
                  <span className="flex items-center gap-1"><span className="material-symbols-outlined text-primary text-lg">location_on</span> {user.location.city}</span>
                )}
                <span className="w-1 h-1 bg-outline-variant rounded-full"></span>
                <span className="flex items-center gap-1"><span className="material-symbols-outlined text-primary text-lg">calendar_today</span> Joined {new Date(user.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
              </div>
            </div>
            <div className="flex gap-3 pb-4">
              <button onClick={() => setEditing(!editing)} className="bg-surface-container-highest hover:bg-surface-container text-on-surface px-6 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">edit</span> Edit Profile
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Edit Form */}
      {editing && (
        <div className="mt-8 bg-surface-container-low rounded-3xl p-8 shadow-sm">
          <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <input type="text" placeholder="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="bg-surface-container rounded-xl px-4 py-3 text-sm border-none focus:ring-2 focus:ring-primary/30 outline-none" />
            <input type="text" placeholder="Skills (comma separated)" value={form.skills} onChange={e => setForm({ ...form, skills: e.target.value })} className="bg-surface-container rounded-xl px-4 py-3 text-sm border-none focus:ring-2 focus:ring-primary/30 outline-none" />
            <textarea placeholder="Bio" value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} className="md:col-span-2 bg-surface-container rounded-xl px-4 py-3 text-sm border-none focus:ring-2 focus:ring-primary/30 outline-none resize-none h-24" />
            <div className="md:col-span-2 flex gap-3">
              <button type="submit" className="primary-gradient text-white px-8 py-3 rounded-xl font-bold shadow-lg">Save</button>
              <button type="button" onClick={() => setEditing(false)} className="bg-surface-container text-on-surface-variant px-6 py-3 rounded-xl font-bold">Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="mt-12 space-y-12">
        {/* Impact Stats */}
        <section>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {stats.map((s, i) => (
              <div key={i} className="bg-surface-container-low p-6 rounded-3xl text-center flex flex-col items-center hover:bg-surface-container transition-colors">
                <span className={`text-4xl font-black ${s.color} mb-1`}>{s.value}</span>
                <span className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant">{s.label}</span>
              </div>
            ))}
            <div className="col-span-2 md:col-span-1 primary-gradient p-6 rounded-3xl text-center flex flex-col items-center shadow-lg shadow-primary/20">
              <span className="text-4xl font-black text-white mb-1">{(user.community_points || 0).toLocaleString()}</span>
              <span className="font-label text-[10px] uppercase tracking-widest text-white/80">Community Points</span>
            </div>
          </div>
        </section>

        {/* Badges */}
        <section>
          <h2 className="text-2xl font-black tracking-tight mb-6">Hearth Achievements</h2>
          <div className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar">
            {badges.length > 0 ? badges.map((badge, i) => (
              <div key={i} className="min-w-[140px] flex-shrink-0 bg-surface-container p-6 rounded-[2rem] flex flex-col items-center gap-3 border-2 border-transparent hover:border-primary/20 transition-all">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-inner">
                  <span className={`material-symbols-outlined ${badgeColors[badge.name] || 'text-primary'} text-4xl material-fill`}>{badgeIcons[badge.name] || 'military_tech'}</span>
                </div>
                <span className="font-bold text-xs text-center leading-tight">{badge.name}</span>
              </div>
            )) : (
              <div className="text-on-surface-variant text-sm py-6">No badges yet — keep participating!</div>
            )}
          </div>
        </section>

        {/* Bio */}
        {user.bio && (
          <section className="bg-surface-container-low p-8 rounded-3xl">
            <h2 className="text-xl font-black mb-4">About</h2>
            <p className="text-on-surface-variant leading-relaxed">{user.bio}</p>
            {user.skills?.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {user.skills.map((s, i) => (
                  <span key={i} className="bg-surface-container px-3 py-1 rounded-full text-xs font-bold text-on-surface-variant">{s}</span>
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  )
}
