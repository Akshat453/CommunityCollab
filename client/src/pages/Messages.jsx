import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { useSocket } from '../context/SocketContext'
import api from '../services/api'

export default function Messages() {
  const { user } = useAuth()
  const { joinRoom, leaveRoom, sendMessage, onEvent, offEvent, startTyping, stopTyping, connected } = useSocket()
  const [rooms, setRooms] = useState([])
  const [activeRoom, setActiveRoom] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loadingRooms, setLoadingRooms] = useState(true)
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [typingUsers, setTypingUsers] = useState([])    // [{ userId, name }]
  const [onlineUsers, setOnlineUsers] = useState([])    // [{ userId, name, avatar_url }]
  const [showNewChat, setShowNewChat] = useState(false)
  const [userSearch, setUserSearch] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searching, setSearching] = useState(false)
  const messagesEndRef = useRef(null)
  const typingTimer = useRef(null)

  // ─── Fetch room list ────────────────────────────────────────────────────
  const fetchRooms = async () => {
    try {
      const { data } = await api.get('/chat/rooms')
      setRooms(data.data || [])
    } catch (err) { console.error('[Messages] fetchRooms error:', err) }
    finally { setLoadingRooms(false) }
  }

  useEffect(() => { fetchRooms() }, [])

  // ─── Load history + join room when activeRoom changes ──────────────────
  useEffect(() => {
    if (!activeRoom) return
    setLoadingHistory(true)
    setMessages([])
    setTypingUsers([])
    setOnlineUsers([])
    joinRoom(activeRoom)

    api.get(`/chat/${encodeURIComponent(activeRoom)}`)
      .then(res => setMessages(res.data.data || []))
      .catch(console.error)
      .finally(() => setLoadingHistory(false))

    return () => leaveRoom(activeRoom)
  }, [activeRoom])

  // ─── Socket event listeners ─────────────────────────────────────────────
  useEffect(() => {
    const handleNewMessage = (msg) => {
      if (msg.room !== activeRoom) return
      setMessages(prev => {
        // Deduplicate: don't add if we already have this _id
        if (prev.some(m => m._id === msg._id)) return prev
        return [...prev, msg]
      })
      // Update last-message preview in sidebar
      setRooms(prev => prev.map(r =>
        r._id === msg.room
          ? { ...r, lastMessage: { ...r.lastMessage, content: msg.content, createdAt: msg.createdAt } }
          : r
      ))
    }

    const handleTyping = ({ userId, name }) => {
      if (userId === user?._id) return
      setTypingUsers(prev => {
        if (prev.some(u => u.userId === userId)) return prev
        return [...prev, { userId, name: name || 'Someone' }]
      })
    }

    const handleStopTyping = ({ userId }) => {
      setTypingUsers(prev => prev.filter(u => u.userId !== userId))
    }

    const handleRoomUsers = ({ room, users }) => {
      if (room === activeRoom) setOnlineUsers(users)
    }

    onEvent('new_message', handleNewMessage)
    onEvent('user_typing', handleTyping)
    onEvent('user_stopped_typing', handleStopTyping)
    onEvent('room_users', handleRoomUsers)

    return () => {
      offEvent('new_message', handleNewMessage)
      offEvent('user_typing', handleTyping)
      offEvent('user_stopped_typing', handleStopTyping)
      offEvent('room_users', handleRoomUsers)
    }
  }, [activeRoom, user])

  // ─── Auto scroll ────────────────────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // ─── User search for new DM ─────────────────────────────────────────────
  useEffect(() => {
    if (!userSearch.trim()) { setSearchResults([]); return }
    const timer = setTimeout(async () => {
      setSearching(true)
      try {
        const { data } = await api.get(`/users?q=${encodeURIComponent(userSearch)}&limit=8`)
        setSearchResults((data.data || []).filter(u => u._id !== user?._id))
      } catch { setSearchResults([]) }
      finally { setSearching(false) }
    }, 300)
    return () => clearTimeout(timer)
  }, [userSearch])

  // ─── Handlers ───────────────────────────────────────────────────────────
  const handleSend = (e) => {
    e.preventDefault()
    if (!input.trim() || !activeRoom) return
    sendMessage(activeRoom, input.trim())
    setInput('')
    stopTyping(activeRoom)
    clearTimeout(typingTimer.current)
  }

  const handleInputChange = (e) => {
    setInput(e.target.value)
    if (activeRoom) {
      startTyping(activeRoom)
      clearTimeout(typingTimer.current)
      typingTimer.current = setTimeout(() => stopTyping(activeRoom), 1500)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) handleSend(e)
  }

  const startDMWith = (partner) => {
    const ids = [user._id, partner._id].sort()
    const roomId = `dm:${ids[0]}_${ids[1]}`
    // Add to room list locally if not already there
    setRooms(prev => {
      if (prev.some(r => r._id === roomId)) return prev
      return [{ _id: roomId, partner, lastMessage: null, messageCount: 0 }, ...prev]
    })
    setActiveRoom(roomId)
    setShowNewChat(false)
    setUserSearch('')
    setSearchResults([])
  }

  const getRoomDisplayName = (room) => {
    if (room.partner) return room.partner.name
    if (room._id?.startsWith('pool:')) return `Pool Chat`
    if (room._id?.startsWith('event:')) return `Event Chat`
    if (room._id?.startsWith('skill:')) return `Skill Session`
    return room._id
  }

  const getRoomAvatar = (room) => {
    if (room.partner?.avatar_url) return room.partner.avatar_url
    return null  // will show icon instead
  }

  const activeRoomData = rooms.find(r => r._id === activeRoom)

  return (
    <div className="max-w-7xl mx-auto flex h-[calc(100vh-8rem)] gap-0 rounded-3xl overflow-hidden bg-surface-container-low">

      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <div className={`w-full md:w-80 flex-shrink-0 flex flex-col border-r border-outline-variant/10 ${activeRoom ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-headline font-extrabold">Messages</h2>
            <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-error'}`} title={connected ? 'Connected' : 'Disconnected'} />
          </div>
          <button onClick={() => setShowNewChat(v => !v)} className="p-2 rounded-full hover:bg-surface-container transition-colors" title="New message">
            <span className="material-symbols-outlined text-primary">edit_square</span>
          </button>
        </div>

        {/* New chat user search */}
        {showNewChat && (
          <div className="px-4 pb-3 border-b border-outline-variant/10">
            <input
              autoFocus
              type="text"
              value={userSearch}
              onChange={e => setUserSearch(e.target.value)}
              placeholder="Search by name or email..."
              className="w-full bg-surface-container rounded-xl px-4 py-2.5 text-sm border-none focus:ring-2 focus:ring-primary/30 outline-none"
            />
            {searching && <p className="text-xs text-on-surface-variant mt-2 px-1">Searching...</p>}
            {searchResults.length > 0 && (
              <div className="mt-2 space-y-1">
                {searchResults.map(u => (
                  <button key={u._id} onClick={() => startDMWith(u)}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-surface-container transition-all text-left">
                    <img src={u.avatar_url || 'https://randomuser.me/api/portraits/lego/1.jpg'} alt="" className="w-8 h-8 rounded-full" />
                    <div>
                      <p className="text-sm font-bold">{u.name}</p>
                      <p className="text-xs text-on-surface-variant">{u.email}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
            {userSearch && !searching && searchResults.length === 0 && (
              <p className="text-xs text-on-surface-variant mt-2 px-1">No users found</p>
            )}
          </div>
        )}

        <div className="flex-1 overflow-y-auto hide-scrollbar">
          {loadingRooms ? (
            <div className="flex justify-center py-10">
              <span className="material-symbols-outlined animate-spin text-primary">progress_activity</span>
            </div>
          ) : rooms.length === 0 ? (
            <div className="text-center py-10 px-6">
              <span className="material-symbols-outlined text-4xl text-surface-container-highest">forum</span>
              <p className="text-sm text-on-surface-variant mt-2">No conversations yet</p>
              <p className="text-xs text-on-surface-variant mt-1">Click the pencil icon to start one</p>
            </div>
          ) : (
            rooms.map(room => (
              <button key={room._id} onClick={() => setActiveRoom(room._id)}
                className={`w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-surface-container transition-all ${activeRoom === room._id ? 'bg-surface-container' : ''}`}>
                <div className="w-10 h-10 rounded-full overflow-hidden bg-primary-fixed flex items-center justify-center shrink-0">
                  {getRoomAvatar(room)
                    ? <img src={getRoomAvatar(room)} alt="" className="w-full h-full object-cover" />
                    : <span className="material-symbols-outlined text-primary text-sm">person</span>
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-sm truncate">{getRoomDisplayName(room)}</span>
                    {room.lastMessage?.createdAt && (
                      <span className="text-[10px] text-on-surface-variant shrink-0 ml-2">
                        {new Date(room.lastMessage.createdAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-on-surface-variant truncate mt-0.5">
                    {room.lastMessage?.content || 'No messages yet'}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* ── Chat Window ──────────────────────────────────────────────────── */}
      <div className={`flex-1 flex flex-col ${!activeRoom ? 'hidden md:flex' : 'flex'}`}>
        {!activeRoom ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <span className="material-symbols-outlined text-8xl text-surface-container-highest">chat_bubble</span>
            <h3 className="text-2xl font-headline font-bold mt-6">Select a Conversation</h3>
            <p className="text-on-surface-variant mt-2">Choose a chat from the sidebar or start a new one.</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="p-4 flex items-center gap-3 bg-surface-container/50 border-b border-outline-variant/10">
              <button onClick={() => setActiveRoom(null)} className="md:hidden p-2 rounded-full hover:bg-surface-container">
                <span className="material-symbols-outlined">arrow_back</span>
              </button>
              <div className="w-10 h-10 rounded-full overflow-hidden bg-primary-fixed flex items-center justify-center">
                {activeRoomData && getRoomAvatar(activeRoomData)
                  ? <img src={getRoomAvatar(activeRoomData)} alt="" className="w-full h-full object-cover" />
                  : <span className="material-symbols-outlined text-primary">person</span>
                }
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-sm">
                  {activeRoomData ? getRoomDisplayName(activeRoomData) : 'Chat Room'}
                </h3>
                {onlineUsers.length > 0 && (
                  <p className="text-[10px] text-green-500">
                    {onlineUsers.filter(u => u.userId !== user?._id).length > 0
                      ? `${onlineUsers.filter(u => u.userId !== user?._id).map(u => u.name).join(', ')} online`
                      : 'Online'
                    }
                  </p>
                )}
              </div>
              {!connected && (
                <span className="text-xs text-error font-bold bg-error-container px-2 py-1 rounded-full">Reconnecting...</span>
              )}
            </div>

            {/* Messages */}
            <div className="flex-1 p-6 overflow-y-auto hide-scrollbar space-y-4">
              {loadingHistory ? (
                <div className="flex justify-center py-10">
                  <span className="material-symbols-outlined animate-spin text-primary">progress_activity</span>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <span className="material-symbols-outlined text-5xl text-surface-container-highest">chat</span>
                  <p className="text-on-surface-variant text-sm mt-3">No messages yet. Say hello!</p>
                </div>
              ) : (
                messages.map((msg, i) => {
                  const isMine = (msg.sender?._id || msg.sender) === user?._id
                  return (
                    <div key={msg._id || i} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                      {!isMine && (
                        <img
                          src={msg.sender?.avatar_url || 'https://randomuser.me/api/portraits/lego/1.jpg'}
                          alt=""
                          className="w-7 h-7 rounded-full mr-2 mt-1 self-end flex-shrink-0"
                        />
                      )}
                      <div className={`max-w-[70%] px-4 py-3 rounded-2xl text-sm ${isMine ? 'primary-gradient text-white rounded-br-md' : 'bg-surface-container text-on-surface rounded-bl-md'}`}>
                        {!isMine && (
                          <p className="text-[10px] font-bold text-primary mb-1">{msg.sender?.name || 'User'}</p>
                        )}
                        <p className="leading-relaxed">{msg.content}</p>
                        <p className={`text-[10px] mt-1 ${isMine ? 'text-white/60' : 'text-on-surface-variant/60'}`}>
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  )
                })
              )}

              {/* Typing indicator */}
              {typingUsers.length > 0 && (
                <div className="flex justify-start items-end gap-2">
                  <div className="bg-surface-container px-4 py-2.5 rounded-2xl rounded-bl-md">
                    <p className="text-xs text-on-surface-variant italic">
                      {typingUsers.map(u => u.name).join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing
                    </p>
                    <div className="flex gap-1 mt-1">
                      <span className="w-1.5 h-1.5 bg-on-surface-variant/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 bg-on-surface-variant/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 bg-on-surface-variant/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSend} className="p-4 flex gap-3 bg-surface-container/30">
              <input
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                disabled={!connected}
                className="flex-1 bg-surface-container rounded-full px-5 py-3 text-sm border-none focus:ring-2 focus:ring-primary/30 outline-none disabled:opacity-50"
                placeholder={connected ? 'Type a message…' : 'Reconnecting…'}
              />
              <button
                type="submit"
                disabled={!input.trim() || !connected}
                className="w-12 h-12 primary-gradient rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-transform disabled:opacity-40"
              >
                <span className="material-symbols-outlined text-white">send</span>
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
