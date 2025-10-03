import React, { useState, useEffect } from 'react'
import io from 'socket.io-client'
import axios from 'axios'
import Board from './components/Board'
import BoardList from './components/BoardList'
import NotificationCenter from './components/NotificationCenter'
import './App.css'

// Backend API base URL
const API_BASE = import.meta.env.VITE_WS_URL || 'http://localhost:3001'

// Socket connection
const socket = io("/", { transports: ['websocket', 'polling'] }) // relative path

function App() {
  const [boards, setBoards] = useState([])
  const [currentBoardId, setCurrentBoardId] = useState(() => localStorage.getItem('currentBoardId') || null)
  const [notifications, setNotifications] = useState([])
  const [showNotifications, setShowNotifications] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('kanbanUser')
    if (savedUser) return JSON.parse(savedUser)

    const newUser = {
      id: `user_${Date.now()}`,
      name: `User${Math.floor(Math.random() * 1000)}`
    }
    localStorage.setItem('kanbanUser', JSON.stringify(newUser))
    return newUser
  })

  // Fetch boards and notifications on initial load
  useEffect(() => {
    fetchBoards()
    fetchNotifications()
  }, [])

  // Socket event listeners
  useEffect(() => {
    socket.on('connect', () => console.log('✅ Socket connected'))
    socket.on('disconnect', () => console.log('❌ Socket disconnected'))
    socket.on('connect_error', err => {
      console.error('❌ Socket error', err)
      setError('Socket connection error.')
    })

    socket.on('card-created', card => {
      setBoards(prev => prev.map(board =>
        board.id === card.boardId
          ? { ...board, Cards: [...(board.Cards || []), card] }
          : board
      ))
    })

    socket.on('card-updated', card => {
      setBoards(prev => prev.map(board =>
        board.id === card.boardId
          ? { ...board, Cards: (board.Cards || []).map(c => c.id === card.id ? card : c) }
          : board
      ))
    })

    socket.on('card-moved', data => {
      setBoards(prev => prev.map(board =>
        board.id === data.boardId
          ? { ...board, Cards: (board.Cards || []).map(c => c.id === data.cardId ? { ...c, column: data.newColumn, position: data.position } : c) }
          : board
      ))
    })

    socket.on('card-deleted', data => {
      setBoards(prev => prev.map(board =>
        board.id === data.boardId
          ? { ...board, Cards: (board.Cards || []).filter(c => c.id !== data.cardId) }
          : board
      ))
    })

    socket.on('notification', notification => {
      if (notification.userId === user.id) {
        setNotifications(prev => [notification, ...prev])
      }
    })

    return () => {
      socket.off()
    }
  }, [user.id])

useEffect(() => {
  if (!currentBoardId) return;

  const joinBoardRoom = () => {
    console.log('🔔 [APP] emitting join-board for', currentBoardId, { userId: user.id, userName: user.name })
    socket.emit('join-board', { boardId: currentBoardId, userId: user.id, userName: user.name })
  }

  // If socket already connected, join immediately; otherwise join on connect
  if (socket && socket.connected) {
    joinBoardRoom()
  } else {
    const onConnect = () => joinBoardRoom()
    socket.on('connect', onConnect)
    return () => socket.off('connect', onConnect)
  }

  // leave room when currentBoardId changes/unmounts
  return () => {
    if (socket && socket.connected) {
      console.log('🔔 [APP] emitting leave-board for', currentBoardId)
      socket.emit('leave-board', { boardId: currentBoardId, userId: user.id })
    }
  }
}, [currentBoardId, socket, user.id, user.name])


  // Fetch boards from backend
  const fetchBoards = async () => {
  try {
    setLoading(true)
    setError('')
    const res = await axios.get(`/api/boards`) // relative URL
    setBoards(res.data)
  } catch (err) {
    console.error(err)
    setError('Failed to fetch boards.')
  } finally {
    setLoading(false)
  }
}

const fetchNotifications = async () => {
  try {
    const res = await axios.get(`/api/notifications/${user.id}`) // relative URL
    setNotifications(res.data)
  } catch (err) {
    console.error(err)
  }
}

const createBoard = async (name) => {
  try {
    const res = await axios.post(`/api/boards`, { name }) // relative URL
    setBoards(prev => [...prev, res.data])
    return res.data
  } catch (err) {
    console.error(err)
    setError('Failed to create board.')
    throw err
  }
}

  // Join a board
  const joinBoard = (boardId) => {
    localStorage.setItem('currentBoardId', boardId)
    setCurrentBoardId(boardId)
    socket.emit('join-board', { boardId, userId: user.id, userName: user.name })
  }

  // Leave current board
  const leaveBoard = () => {
    if (!currentBoardId) return
    socket.emit('leave-board', { boardId: currentBoardId, userId: user.id })
    setCurrentBoardId(null)
    localStorage.removeItem('currentBoardId')
  }

  const currentBoard = boards.find(b => b.id === currentBoardId) || null

  return (
    <div className="app">
      <header className="app-header">
        <h1>Collaborative Kanban</h1>
        <div className="user-info">
          <span>Hello, {user.name}</span>
          <button onClick={() => setShowNotifications(!showNotifications)} className="notification-btn">
            Notifications ({notifications.filter(n => !n.read).length})
          </button>
          {currentBoard && <button onClick={leaveBoard} className="leave-btn">Leave Board</button>}
        </div>
      </header>

      {error && (
        <div className="error-message">
          {error}
          <button onClick={() => setError('')} className="error-close">×</button>
        </div>
      )}

      {showNotifications && (
        <NotificationCenter
          notifications={notifications}
          onClose={() => setShowNotifications(false)}
          onMarkRead={async (id) => {
            await axios.put(`${API_BASE}/api/notifications/${id}/read`)
            fetchNotifications()
          }}
        />
      )}

      <main className="app-main">
        {loading ? (
          <div className="loading">Loading boards...</div>
        ) : currentBoard ? (
          <Board board={currentBoard} socket={socket} user={user} onBackToBoards={leaveBoard} />
        ) : (
          <BoardList boards={boards} onCreateBoard={createBoard} onJoinBoard={joinBoard} />
        )}
      </main>
    </div>
  )
}

export default App
