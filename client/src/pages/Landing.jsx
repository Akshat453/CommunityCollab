import { Link } from 'react-router-dom'

export default function Landing() {
  return (
    <div className="pt-20">
      {/* Hero Section */}
      <section className="relative px-6 py-20 lg:py-32 max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-12">
        <div className="lg:w-1/2 z-10">
          <span className="font-label text-primary font-bold tracking-widest uppercase text-xs mb-4 block">Kinetic Hearth Collaboration</span>
          <h1 className="text-5xl lg:text-7xl font-headline font-extrabold text-on-surface tracking-tight leading-[1.1] mb-6">
            Collaborate. <br />
            Share. Thrive <br />
            <span className="text-primary italic">Together.</span>
          </h1>
          <p className="text-lg text-on-surface-variant max-w-lg mb-10 leading-relaxed">
            Your all-in-one platform for community events, resource sharing, and skill exchange. Built for the modern collective.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link to="/register" className="primary-gradient text-white px-8 py-4 rounded-xl font-bold shadow-lg hover:shadow-primary/20 transition-all active:scale-95">
              Get Started
            </Link>
            <Link to="/events" className="border-2 border-secondary text-secondary px-8 py-4 rounded-xl font-bold hover:bg-secondary/5 transition-all active:scale-95">
              Explore Community
            </Link>
          </div>
        </div>
        <div className="lg:w-1/2 relative">
          <div className="relative rounded-[2rem] overflow-hidden aspect-[4/5] shadow-2xl rotate-2 hover:rotate-0 transition-transform duration-700">
            <img alt="Community gathering" className="w-full h-full object-cover" src="https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&q=80" />
          </div>
          <div className="absolute -bottom-10 -left-10 bg-surface-container-highest p-6 rounded-2xl shadow-xl max-w-xs -rotate-3 hover:rotate-0 transition-transform duration-500">
            <div className="flex items-center gap-4 mb-4">
              <div className="bg-secondary p-3 rounded-full text-on-secondary">
                <span className="material-symbols-outlined">volunteer_activism</span>
              </div>
              <div>
                <p className="font-headline font-bold text-on-surface">Skill Match Found!</p>
                <p className="text-xs text-on-surface-variant">Gardening for Web Design</p>
              </div>
            </div>
            <div className="w-full h-1 bg-outline-variant rounded-full overflow-hidden">
              <div className="w-3/4 h-full bg-tertiary"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="bg-surface-container-low py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: '2,400+', label: 'Members', color: 'text-primary' },
              { value: '580', label: 'Events', color: 'text-secondary' },
              { value: '1,200', label: 'Skills Shared', color: 'text-tertiary' },
              { value: '900', label: 'Resources', color: 'text-on-surface' },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className={`text-4xl font-headline font-extrabold ${stat.color} mb-1`}>{stat.value}</div>
                <div className="font-label text-xs uppercase tracking-widest text-on-surface-variant font-semibold">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Highlights */}
      <section className="py-24 px-6 max-w-7xl mx-auto">
        <div className="mb-16">
          <h2 className="text-4xl font-headline font-extrabold mb-4">Community Essentials</h2>
          <div className="w-24 h-1.5 bg-primary rounded-full"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { icon: 'calendar_month', title: 'Group Activities & Events', desc: 'From weekend hikes to local workshops, find your tribe and make memories that matter.', color: 'text-primary', link: '/events', linkText: 'See Events' },
            { icon: 'directions_car', title: 'Resource & Ride Sharing', desc: 'Reduce waste and costs by sharing tools, equipment, or even carpooling to city events.', color: 'text-secondary', link: '/pools', linkText: 'Find Resources' },
            { icon: 'psychology', title: 'Skill Exchange', desc: 'Trade your expertise in coding for cooking lessons. A circular economy of knowledge.', color: 'text-tertiary', link: '/skills', linkText: 'Browse Skills' },
          ].map((card, i) => (
            <div key={i} className="bg-surface-container p-8 rounded-2xl flex flex-col h-full hover:translate-y-[-8px] transition-transform duration-300">
              <div className="bg-white/50 w-16 h-16 rounded-2xl flex items-center justify-center mb-8 shadow-sm">
                <span className={`material-symbols-outlined ${card.color} text-4xl`}>{card.icon}</span>
              </div>
              <h3 className="text-2xl font-headline font-bold mb-4">{card.title}</h3>
              <p className="text-on-surface-variant leading-relaxed mb-8 flex-grow">{card.desc}</p>
              <Link className={`inline-flex items-center ${card.color} font-bold group`} to={card.link}>
                {card.linkText}
                <span className="material-symbols-outlined ml-2 group-hover:translate-x-1 transition-transform">arrow_forward</span>
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Events */}
      <section className="py-24 bg-surface-container-low overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 mb-12 flex justify-between items-end">
          <div>
            <h2 className="text-4xl font-headline font-extrabold mb-2">Happening Soon</h2>
            <p className="text-on-surface-variant">Don&apos;t miss out on these community favorites.</p>
          </div>
        </div>
        <div className="flex gap-8 px-6 max-w-7xl mx-auto pb-8 overflow-x-auto hide-scrollbar">
          {[
            { img: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=600', date: 'OCT 24', title: 'Rooftop Urban Gardening', spots: '15 spots left' },
            { img: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600', date: 'OCT 28', title: 'Creative Coding Basics', spots: '2 spots left' },
            { img: 'https://images.unsplash.com/photo-1529543544282-7a407e6539ae?w=600', date: 'NOV 02', title: 'Zero-Waste Community Potluck', spots: '45 people joined' },
          ].map((event, i) => (
            <div key={i} className="min-w-[350px] bg-white rounded-3xl overflow-hidden shadow-sm group">
              <div className="h-64 relative overflow-hidden">
                <img alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src={event.img} />
                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-3 py-1 rounded-lg text-xs font-bold text-on-surface shadow-sm">{event.date}</div>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-headline font-bold mb-2">{event.title}</h3>
                <div className="flex items-center gap-4 mb-6">
                  <div className="flex -space-x-2">
                    <div className="w-8 h-8 rounded-full bg-surface-container border-2 border-white flex items-center justify-center text-[10px] font-bold">+12</div>
                  </div>
                  <span className="text-sm font-label text-on-surface-variant italic">{event.spots}</span>
                </div>
                <Link to="/register" className="block w-full py-3 rounded-xl border-2 border-primary text-primary font-bold hover:bg-primary hover:text-white transition-all text-center">Join Event</Link>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
