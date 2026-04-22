import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { io } from 'socket.io-client'
import { useAuth } from './AuthContext'

const SocketContext = createContext()

export const useSocket = () => useContext(SocketContext)

export function SocketProvider({ children }) {
  const { user } = useAuth()
  const socketRef = useRef(null)
  const [connected, setConnected] = useState(false)

  // Track which rooms this client has intentionally joined.
  // On reconnect, every room in this set is re-joined automatically.
  const joinedRoomsRef = useRef(new Set())

  // Stable event-handler registry: Map<event, Set<handler>>
  // Handlers registered here survive socket replacement and reconnects.
  const handlersRef = useRef(new Map())

  useEffect(() => {
    if (!user) {
      socketRef.current?.disconnect()
      socketRef.current = null
      joinedRoomsRef.current.clear()
      setConnected(false)
      return
    }

    const token = localStorage.getItem('cc_token')
    if (!token) return

    const socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5001', {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000
    })

    socketRef.current = socket

    socket.on('connect', () => {
      console.log('[Socket] Connected:', socket.id)
      setConnected(true)

      // Re-register all tracked event handlers on the (re)connected socket
      handlersRef.current.forEach((handlers, event) => {
        handlers.forEach(handler => {
          socket.off(event, handler) // prevent duplicates
          socket.on(event, handler)
        })
      })

      // Re-join every room the user was in before the disconnect
      if (joinedRoomsRef.current.size > 0) {
        console.log('[Socket] Rejoining rooms after reconnect:', [...joinedRoomsRef.current])
        joinedRoomsRef.current.forEach(room => socket.emit('join_room', { room }))
      }
    })

    socket.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected:', reason)
      setConnected(false)
      // If server closed the connection, socket.io won't auto-reconnect.
      // Force reconnect so we stay online.
      if (reason === 'io server disconnect') {
        socket.connect()
      }
    })

    socket.on('connect_error', (err) => {
      console.error('[Socket] Connection error:', err.message)
    })

    return () => {
      socket.disconnect()
      socketRef.current = null
    }
  }, [user])

  // ─── Public API ──────────────────────────────────────────────────────────

  const joinRoom = (room) => {
    if (!room) return
    joinedRoomsRef.current.add(room)
    socketRef.current?.emit('join_room', { room })
  }

  const leaveRoom = (room) => {
    if (!room) return
    joinedRoomsRef.current.delete(room)
    socketRef.current?.emit('leave_room', { room })
  }

  const sendMessage = (room, content, type = 'text', card_data = null) => {
    if (!socketRef.current?.connected) {
      console.warn('[Socket] sendMessage called but socket is not connected')
      return
    }
    socketRef.current.emit('send_message', { room, content, type, card_data })
  }

  const startTyping = (room) => socketRef.current?.emit('typing_start', { room })
  const stopTyping = (room) => socketRef.current?.emit('typing_stop', { room })

  // Stable onEvent: registers handler in the central registry AND on the
  // live socket. On reconnect, all registry handlers are re-bound (see connect handler above).
  const onEvent = (event, handler) => {
    if (!event || !handler) return
    if (!handlersRef.current.has(event)) {
      handlersRef.current.set(event, new Set())
    }
    handlersRef.current.get(event).add(handler)
    socketRef.current?.on(event, handler)
  }

  // Removes handler from registry AND from live socket.
  const offEvent = (event, handler) => {
    if (!event || !handler) return
    handlersRef.current.get(event)?.delete(handler)
    socketRef.current?.off(event, handler)
  }

  return (
    <SocketContext.Provider value={{
      socket: socketRef.current,
      connected,
      joinRoom,
      leaveRoom,
      sendMessage,
      startTyping,
      stopTyping,
      onEvent,
      offEvent
    }}>
      {children}
    </SocketContext.Provider>
  )
}
