import React, { useState, useEffect } from 'react'
import Column from './Column'

function Board({ board, socket, user, onBackToBoards }) {
  const [onlineUsers, setOnlineUsers] = useState({})
  const columns = ['Todo', 'In Progress', 'Done']
  const [cards, setCards] = useState(board?.Cards || [])

  // Sync cards when board changes
  useEffect(() => {
    setCards(board?.Cards || [])
  }, [board?.id, board?.Cards])

  useEffect(() => {
    if (!socket || !board?.id || !user) return

    console.log("🔗 Joining board room:", board.id, "as", user.username)

    // Join board room
    socket.emit("join-board", { boardId: board.id, userId: user.id, username: user.username })

    // Presence updates
    const handlePresence = (users) => {
      console.log("📥 Presence update:", users)
      if (users) setOnlineUsers(users)
    }

    // Card created
    const handleCreated = (newCard) => {
      if (!newCard || newCard.BoardId !== board.id) return
      setCards(prev => {
        if (prev.some(c => c.id === newCard.id)) return prev
        return [...prev, newCard]
      })
    }

    // Card updated
    const handleUpdated = (updatedCard) => {
      if (!updatedCard || updatedCard.BoardId !== board.id) return
      setCards(prev => prev.map(c => (c.id === updatedCard.id ? updatedCard : c)))
    }

    // Card moved
    // Card moved
const handleMoved = (updatedCard) => {
  console.log('📥 [BOARD] card-moved event received:', updatedCard);
  if (!updatedCard || updatedCard.BoardId !== board.id) return;

  setCards(prev => {
    // If card exists → update column + position
    const exists = prev.some(c => c.id === updatedCard.id);
    if (exists) {
      return prev.map(c => (c.id === updatedCard.id ? updatedCard : c));
    }
    return [...prev, updatedCard]; // fallback in case card not in state
  });
};


    // Card deleted
    const handleDeleted = (deletedCard) => {
      if (!deletedCard || deletedCard.boardId !== board.id) return
      setCards(prev => prev.filter(c => c.id !== deletedCard.id))
    }

    // Attach socket listeners
    socket.on('presence-update', handlePresence)
    socket.on('card-created', handleCreated)
    socket.on('card-updated', handleUpdated)
    socket.on('card-moved', handleMoved)
    socket.on('card-deleted', handleDeleted)

    // Leave board room on unmount
    return () => {
      console.log("🔌 Leaving board room:", board.id)
      socket.emit("leave-board", { boardId: board.id, userId: user.id })
      socket.off('presence-update', handlePresence)
      socket.off('card-created', handleCreated)
      socket.off('card-updated', handleUpdated)
      socket.off('card-moved', handleMoved)
      socket.off('card-deleted', handleDeleted)
    }
  }, [socket, board?.id, user])

  // Emit events
  const handleCreateCard = (column, cardData) => {
    if (!cardData?.title?.trim()) return
    socket.emit('create-card', {
      ...cardData,
      column,
      boardId: board.id,
      userId: user.id
    })
  }

  const handleMoveCard = (cardId, newColumn, position) => {
    socket.emit('move-card', { cardId, newColumn, position, boardId: board.id, userId: user.id })
  }

  const handleUpdateCard = (cardId, updates) => {
    socket.emit('update-card', { id: cardId, ...updates, boardId: board.id, userId: user.id })
  }

  const handleDeleteCard = (cardId) => {
    socket.emit('delete-card', { cardId, boardId: board.id, userId: user.id })
  }

  if (!board) return <div>Loading board...</div>

  return (
    <div className="board">
      <button onClick={onBackToBoards} style={{ marginBottom: '1rem' }}>⬅ Back to Boards</button>

      <div className="board-header">
        <h2>{board.name}</h2>
        <div className="presence-indicators">
          {Object.entries(onlineUsers).map(([userId, userName]) => (
            <div key={userId} className="presence-indicator">
              🟢 {userName}
            </div>
          ))}
        </div>
      </div>

      <div className="columns-container">
        {columns.map(column => (
          <Column
            key={column}
            title={column}
            cards={cards.filter(card => card.column === column)}
            onCreateCard={(cardData) => handleCreateCard(column, cardData)}
            onMoveCard={handleMoveCard}
            onUpdateCard={handleUpdateCard}
            onDeleteCard={handleDeleteCard}
            socket={socket}
            boardId={board.id}
            user={user}
          />
        ))}
      </div>
    </div>
  )
}

export default Board
