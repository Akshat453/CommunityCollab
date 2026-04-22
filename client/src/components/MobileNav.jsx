import { Link, useLocation } from 'react-router-dom'

const tabs = [
  { to: '/dashboard', icon: 'home', label: 'Home' },
  { to: '/events', icon: 'explore', label: 'Explore' },
  { to: '/messages', icon: 'forum', label: 'Chat' },
  { to: '/notifications', icon: 'notifications', label: 'Activity' },
  { to: '/profile', icon: 'account_circle', label: 'Profile' },
]

export default function MobileNav() {
  const location = useLocation()

  return (
    <div className="md:hidden fixed bottom-0 left-0 w-full bg-[#fff8f3]/90 backdrop-blur-md flex justify-around py-3 px-2 z-50 shadow-[0_-10px_20px_rgba(0,0,0,0.05)]">
      {tabs.map(tab => {
        const isActive = location.pathname === tab.to || location.pathname.startsWith(tab.to + '/')
        return (
          <Link key={tab.to} to={tab.to} className={`flex flex-col items-center gap-1 ${isActive ? 'text-[#af3000]' : 'text-[#3c4948]'}`}>
            <span className={`material-symbols-outlined ${isActive ? 'material-fill' : ''}`}>{tab.icon}</span>
            <span className="text-[10px] font-bold">{tab.label}</span>
          </Link>
        )
      })}
    </div>
  )
}
