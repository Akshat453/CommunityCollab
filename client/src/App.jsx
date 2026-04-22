import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { SocketProvider } from './context/SocketContext'
import Navbar from './components/Navbar'
import Sidebar from './components/Sidebar'
import Footer from './components/Footer'
import MobileNav from './components/MobileNav'
import ProtectedRoute from './components/ProtectedRoute'

import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Events from './pages/Events'
import Pools from './pages/Pools'
import Skills from './pages/Skills'
import Messages from './pages/Messages'
import Notifications from './pages/Notifications'
import Profile from './pages/Profile'
import Leaderboard from './pages/Leaderboard'
import Resources from './pages/Resources'
import Assistance from './pages/Assistance'
import EventDetail from './pages/EventDetail'
import PoolDetail from './pages/PoolDetail'
import SkillDetail from './pages/SkillDetail'
import ResourceDetail from './pages/ResourceDetail'
import AssistanceDetail from './pages/AssistanceDetail'

function AppLayout() {
  const location = useLocation()
  const publicPaths = ['/', '/login', '/register']
  const isPublic = publicPaths.includes(location.pathname)

  return (
    <div className="min-h-screen bg-surface font-body text-on-surface">
      <Navbar />
      {!isPublic && <Sidebar />}
      <div className={`flex flex-col min-h-screen ${!isPublic ? 'md:ml-64' : ''}`}>
        <main className={`flex-1 pt-24 pb-12 px-4 md:px-8`}>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/events" element={<ProtectedRoute><Events /></ProtectedRoute>} />
            <Route path="/pools" element={<ProtectedRoute><Pools /></ProtectedRoute>} />
            <Route path="/skills" element={<ProtectedRoute><Skills /></ProtectedRoute>} />
            <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
            <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/leaderboard" element={<ProtectedRoute><Leaderboard /></ProtectedRoute>} />
            <Route path="/resources" element={<ProtectedRoute><Resources /></ProtectedRoute>} />
            <Route path="/assistance" element={<ProtectedRoute><Assistance /></ProtectedRoute>} />
            <Route path="/events/:id" element={<ProtectedRoute><EventDetail /></ProtectedRoute>} />
            <Route path="/pools/:id" element={<ProtectedRoute><PoolDetail /></ProtectedRoute>} />
            <Route path="/skills/:id" element={<ProtectedRoute><SkillDetail /></ProtectedRoute>} />
            <Route path="/resources/:id" element={<ProtectedRoute><ResourceDetail /></ProtectedRoute>} />
            <Route path="/assistance/:id" element={<ProtectedRoute><AssistanceDetail /></ProtectedRoute>} />
          </Routes>
        </main>
        {!isPublic && <MobileNav />}
        <Footer />
      </div>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <AppLayout />
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
