import { useState, useEffect } from 'react'
import api from '../services/api'
import TrustBadge from '../components/TrustBadge'

export default function Leaderboard() {
  const [leaders, setLeaders] = useState([])
  const [period, setPeriod] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetch = async () => {
      setLoading(true)
      try {
        const params = period ? `?period=${period}` : ''
        const { data } = await api.get(`/leaderboard${params}`)
        setLeaders(data.data || [])
      } catch (err) { console.error(err) }
      finally { setLoading(false) }
    }
    fetch()
  }, [period])

  const medals = ['🥇', '🥈', '🥉']

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-baseline mb-10 gap-4">
        <div>
          <h1 className="text-4xl md:text-5xl font-headline font-extrabold tracking-tighter mb-2">Leaderboard</h1>
          <div className="h-1 w-24 bg-primary rounded-full"></div>
        </div>
        <div className="flex gap-2">
          {[{ k: '', l: 'All Time' }, { k: 'month', l: 'This Month' }, { k: 'week', l: 'This Week' }].map(f => (
            <button key={f.k} onClick={() => setPeriod(f.k)} className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${period === f.k ? 'primary-gradient text-white shadow-lg' : 'bg-surface-container text-on-surface-variant'}`}>{f.l}</button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><span className="material-symbols-outlined text-primary text-5xl animate-spin">progress_activity</span></div>
      ) : (
        <div className="space-y-3">
          {leaders.map((user, i) => (
            <div key={user._id} className={`flex items-center gap-4 p-5 rounded-2xl transition-all hover:shadow-sm ${i < 3 ? 'bg-surface-container-high' : 'bg-surface-container-low'} ${i === 0 ? 'scale-[1.02] shadow-md' : ''}`}>
              <div className="w-10 h-10 rounded-full flex items-center justify-center font-black text-lg shrink-0">
                {i < 3 ? <span className="text-2xl">{medals[i]}</span> : <span className="text-on-surface-variant">{i + 1}</span>}
              </div>
              <img src={user.avatar_url || 'https://ui-avatars.com/api/?name=U&background=e8e0d8&color=3c4948&bold=true&size=128'} alt={user.name} className="w-12 h-12 rounded-full border-2 border-outline-variant/20 shrink-0" />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold">{user.name}</h3>
                  {user.verified && <span className="material-symbols-outlined text-secondary text-sm material-fill">verified</span>}
                </div>
                <p className="text-xs text-on-surface-variant">{user.location?.city || 'Community Member'}</p>
              </div>
              <div className="flex items-center gap-2">
                {user.badges?.slice(0, 3).map((b, bi) => (
                  <span key={bi} className="text-sm" title={b.name}>{b.icon}</span>
                ))}
              </div>
              <TrustBadge trust_score={user.trust_score} trust_level={user.trust_level} size="sm" />
              <div className="text-right shrink-0">
                <div className="text-xl font-black text-primary">{(user.community_points || 0).toLocaleString()}</div>
                <div className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant">points</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
