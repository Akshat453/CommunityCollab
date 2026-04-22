import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { user, logout } = useAuth()

  return (
    <header className="fixed top-0 w-full z-50 bg-[#fff8f3]/80 backdrop-blur-xl shadow-[0_20px_40px_rgba(39,25,2,0.06)] flex justify-between items-center px-6 py-3">
      <div className="flex items-center gap-6">
        <Link to="/" className="text-2xl font-bold text-[#af3000] tracking-tighter">CommunityCollab</Link>
      </div>
      <div className="flex items-center gap-4">
        {user ? (
          <>
            <Link to="/notifications" className="p-2 rounded-full hover:bg-[#ffebd1] transition-colors active:scale-95 duration-200 text-[#af3000] relative">
              <span className="material-symbols-outlined">notifications</span>
              <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full"></span>
            </Link>
            <Link to="/messages" className="p-2 rounded-full hover:bg-[#ffebd1] transition-colors active:scale-95 duration-200 text-[#3c4948]">
              <span className="material-symbols-outlined">chat</span>
            </Link>
            <button onClick={logout} className="p-2 rounded-full hover:bg-[#ffebd1] transition-colors active:scale-95 duration-200 text-[#3c4948]" title="Logout">
              <span className="material-symbols-outlined">logout</span>
            </button>
            <Link to="/profile" className="relative">
              <img alt="User avatar" className="w-10 h-10 rounded-full object-cover border-2 border-primary-fixed" src={user.avatar_url || 'https://randomuser.me/api/portraits/lego/1.jpg'} />
              {user.verified && (
                <div className="absolute -bottom-1 -right-1 bg-secondary w-4 h-4 rounded-full flex items-center justify-center border-2 border-surface">
                  <span className="material-symbols-outlined text-[10px] text-white material-fill">check_circle</span>
                </div>
              )}
            </Link>
          </>
        ) : (
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-primary font-bold text-sm hover:opacity-80 transition-opacity">Log In</Link>
            <Link to="/register" className="primary-gradient text-white px-5 py-2 rounded-xl font-bold text-sm shadow-lg hover:shadow-primary/20 transition-all active:scale-95">Sign Up</Link>
          </div>
        )}
      </div>
    </header>
  )
}
