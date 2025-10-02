import React, { useState, useEffect, useRef } from 'react'
import Card from './Card'

function Column({ title, cards = [], onCreateCard, onMoveCard, onUpdateCard, onDeleteCard, socket, boardId, user }) {
  const [showAddForm, setShowAddForm] = useState(false)
  const [newCard, setNewCard] = useState({ title: '', description: '', assignee: '' })
  const [isCreating, setIsCreating] = useState(false)
  const titleInputRef = useRef(null)
  const dragOverCardIndex = useRef(null)

  useEffect(() => {
    if (showAddForm && titleInputRef.current) titleInputRef.current.focus()
  }, [showAddForm])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!newCard.title.trim() || isCreating) return
    setIsCreating(true)
    try {
      await onCreateCard(newCard)
      setNewCard({ title: '', description: '', assignee: '' })
      setShowAddForm(false)
    } catch (err) {
      console.error('Failed to create card', err)
    } finally {
      setIsCreating(false)
    }
  }

  // Drag-and-drop handlers
  const handleDragOver = (e, index) => {
    e.preventDefault()
    dragOverCardIndex.current = index
    e.currentTarget.style.backgroundColor = '#d5dbdb'
  }

  const handleDragLeave = (e) => {
    e.currentTarget.style.backgroundColor = ''
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.currentTarget.style.backgroundColor = ''
    const cardId = e.dataTransfer.getData('cardId')
    if (!cardId) return

    const targetIndex = dragOverCardIndex.current !== null ? dragOverCardIndex.current : cards.length
    onMoveCard(cardId, title, targetIndex)
    dragOverCardIndex.current = null
  }

  const cancelForm = () => {
    setShowAddForm(false)
    setNewCard({ title: '', description: '', assignee: '' })
  }

  return (
    <div className="column" onDragOver={(e) => handleDragOver(e, cards.length)} onDragLeave={handleDragLeave} onDrop={handleDrop}>
      <div className="column-header">
        <div className="column-title">{title}</div>
        <div className="card-count">{cards.length}</div>
      </div>

      <div className="cards-list">
        {cards.length === 0 ? (
          <div className="empty-state" style={{ textAlign: 'center', padding: '2rem', color: '#95a5a6', fontStyle: 'italic' }}>No cards yet</div>
        ) : (
          cards
            .sort((a, b) => (a.position || 0) - (b.position || 0))
            .map((card, index) => (
              <div
                key={card.id}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <Card
                  card={card}
                  onUpdate={onUpdateCard}
                  onDelete={onDeleteCard}
                  socket={socket}
                  boardId={boardId}
                  user={user}
                />
              </div>
            ))
        )}
      </div>

      {showAddForm ? (
        <form onSubmit={handleSubmit} className="add-card-form">
          <input
            ref={titleInputRef}
            type="text"
            placeholder="Card title *"
            value={newCard.title}
            onChange={(e) => setNewCard({ ...newCard, title: e.target.value })}
            disabled={isCreating}
            required
          />
          <textarea
            placeholder="Description (optional)"
            value={newCard.description}
            onChange={(e) => setNewCard({ ...newCard, description: e.target.value })}
            disabled={isCreating}
          />
          <input
            type="text"
            placeholder="Assignee (optional)"
            value={newCard.assignee}
            onChange={(e) => setNewCard({ ...newCard, assignee: e.target.value })}
            disabled={isCreating}
          />
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button type="submit" disabled={isCreating || !newCard.title.trim()}>
              {isCreating ? 'Adding...' : 'Add Card'}
            </button>
            <button type="button" onClick={cancelForm} disabled={isCreating} style={{ background: '#95a5a6' }}>
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button className="add-card-btn" onClick={() => setShowAddForm(true)} disabled={isCreating}>
          + Add Card
        </button>
      )}
    </div>
  )
}

export default Column
