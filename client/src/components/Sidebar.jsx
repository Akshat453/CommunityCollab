import { Link, useLocation } from 'react-router-dom'

const navItems = [
  { to: '/dashboard', icon: 'home', label: 'Home' },
  { to: '/events', icon: 'event', label: 'Events' },
  { to: '/pools', icon: 'inventory_2', label: 'Pools' },
  { to: '/skills', icon: 'psychology', label: 'Skill Exchange' },
  { to: '/resources', icon: 'share_reviews', label: 'Resources' },
  { to: '/assistance', icon: 'volunteer_activism', label: 'Assistance' },
  { to: '/messages', icon: 'forum', label: 'Messages' },
  { to: '/notifications', icon: 'notifications', label: 'Notifications' },
  { to: '/leaderboard', icon: 'leaderboard', label: 'Leaderboard' },
]

export default function Sidebar() {
  const location = useLocation()

  return (
    <aside className="hidden md:flex h-screen w-64 fixed left-0 top-0 bg-[#fff8f3] flex-col gap-y-2 py-8 pr-4 pt-24 z-40">
      <div className="px-6 mb-8">
        <h2 className="text-[#af3000] font-black uppercase tracking-widest text-xs">CoCo</h2>
        <p className="text-xs text-[#3c4948] font-medium">Collaborative Hub</p>
      </div>
      <nav className="flex-1 flex flex-col gap-1">
        {navItems.map(item => {
          const isActive = location.pathname === item.to || location.pathname.startsWith(item.to + '/')
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex items-center gap-3 px-6 py-3 transition-all font-medium text-sm ${isActive
                ? 'bg-[#ffebd1] text-[#271902] rounded-r-full font-bold shadow-sm'
                : 'text-[#3c4948] hover:translate-x-1 hover:text-[#af3000]'
                }`}
            >
              <span className={`material-symbols-outlined ${isActive ? 'material-fill' : ''}`}>{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
