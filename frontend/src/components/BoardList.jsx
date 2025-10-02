import React, { useState } from 'react'

function BoardList({ boards, onCreateBoard, onJoinBoard }) {
  const [newBoardName, setNewBoardName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleCreateBoard = async (e) => {
  e.preventDefault()
  console.log('🎯 Create board button clicked')
  
  if (!newBoardName.trim()) {
    setError('Board name cannot be empty')
    return
  }
  
  setLoading(true)
  setError('')
  
  try {
    console.log('📤 Calling onCreateBoard with:', newBoardName)
    
    // Call the parent's createBoard function and wait for it to complete
    const board = await onCreateBoard(newBoardName)
    console.log('✅ onCreateBoard completed, returned:', board)
    
    if (board && board.id) {
      setNewBoardName('')
      console.log('🎯 Now joining board:', board.id)
      
      // Wait a brief moment for state to update, then join the board
      setTimeout(() => {
        onJoinBoard(board.id)
      }, 100)
    } else {
      console.log('❌ Board creation failed - no board ID returned')
      setError('Board was created but could not be accessed. Please refresh the page.')
    }
  } catch (error) {
    console.error('❌ Failed to create board:', error)
    setError(`Failed to create board: ${error.message}`)
  } finally {
    setLoading(false)
  }
}

  console.log('📋 Current boards in BoardList:', boards)
  console.log('📋 Number of boards:', boards.length)

  return (
    <div className="board-list">
      <h2>Your Boards</h2>
      
      {error && (
        <div className="error-message">
          {error}
          <button onClick={() => setError('')} className="error-close">×</button>
        </div>
      )}
      
      <form onSubmit={handleCreateBoard} className="create-board-form">
        <input
          type="text"
          placeholder="Enter board name..."
          value={newBoardName}
          onChange={(e) => setNewBoardName(e.target.value)}
          disabled={loading}
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Creating...' : 'Create New Board'}
        </button>
      </form>

      <div className="boards-grid">
        {boards.map(board => (
          <div 
            key={board.id} 
            className="board-card"
            onClick={() => {
              console.log('🎯 Clicked board:', board.id, board.name)
              onJoinBoard(board.id)
            }}
          >
            <h3>{board.name}</h3>
            <p>{board.Cards?.length || 0} cards</p>
            <p>Created: {new Date(board.createdAt).toLocaleDateString()}</p>
          </div>
        ))}
        
        {boards.length === 0 && (
          <p>No boards yet. Create your first board to get started!</p>
        )}
      </div>
    </div>
  )
}

export default BoardList