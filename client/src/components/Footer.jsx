import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="bg-[#271902] w-full py-12 px-8 border-t border-stone-800">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8 max-w-7xl mx-auto">
        <div className="col-span-1 md:col-span-1">
          <span className="text-[#fff8f3] font-bold text-xl block mb-4">CommunityCollab</span>
          <p className="font-label text-xs tracking-wide text-stone-400 leading-relaxed mb-6">Building the Kinetic Hearth where every shared skill and every shared ride creates a tighter, stronger neighborhood.</p>
          <div className="flex gap-4">
            <a className="text-[#ff602e] hover:text-[#03A6A1] transition-colors" href="#"><span className="material-symbols-outlined">share</span></a>
            <a className="text-[#ff602e] hover:text-[#03A6A1] transition-colors" href="#"><span className="material-symbols-outlined">public</span></a>
            <a className="text-[#ff602e] hover:text-[#03A6A1] transition-colors" href="#"><span className="material-symbols-outlined">alternate_email</span></a>
          </div>
        </div>
        <div>
          <h4 className="text-white font-bold mb-6 text-sm">Quick Links</h4>
          <ul className="space-y-3 text-xs">
            <li><a className="text-stone-400 hover:text-[#03A6A1] transition-colors" href="#">Privacy Policy</a></li>
            <li><a className="text-stone-400 hover:text-[#03A6A1] transition-colors" href="#">Terms of Service</a></li>
            <li><a className="text-stone-400 hover:text-[#03A6A1] transition-colors" href="#">Community Guidelines</a></li>
            <li><a className="text-stone-400 hover:text-[#03A6A1] transition-colors" href="#">Contact Us</a></li>
          </ul>
        </div>
        <div>
          <h4 className="text-white font-bold mb-6 text-sm">Community</h4>
          <ul className="space-y-3 text-xs">
            <li><Link className="text-stone-400 hover:text-[#03A6A1] transition-colors" to="/events">Find Events</Link></li>
            <li><Link className="text-stone-400 hover:text-[#03A6A1] transition-colors" to="/skills">Skill Swap</Link></li>
            <li><Link className="text-stone-400 hover:text-[#03A6A1] transition-colors" to="/resources">Resource Bank</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-white font-bold mb-6 text-sm">Newsletter</h4>
          <p className="text-[10px] mb-4 text-stone-400 uppercase tracking-widest font-bold">Stay updated on the hearth</p>
          <form className="flex flex-col gap-2" onSubmit={e => e.preventDefault()}>
            <input className="bg-stone-800 border-none rounded-lg text-xs py-3 px-4 focus:ring-1 focus:ring-primary text-white" placeholder="email@example.com" type="email" />
            <button className="bg-primary text-white font-bold text-xs py-3 rounded-lg hover:opacity-90 transition-opacity" type="submit">Subscribe</button>
          </form>
        </div>
      </div>
      <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-stone-800 flex flex-col md:flex-row justify-between items-center gap-4">
        <p className="text-[10px] tracking-widest uppercase text-stone-400">© 2024 CommunityCollab. Built for the Kinetic Hearth.</p>
        <div className="flex gap-6 text-[10px] font-bold">
          <span className="text-[#ff602e]">SYSTEM STATUS: OPTIMAL</span>
          <span className="text-stone-500">v2.4.0</span>
        </div>
      </div>
    </footer>
  )
}
