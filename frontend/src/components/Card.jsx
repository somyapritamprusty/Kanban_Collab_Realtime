import React, { useState, useEffect } from 'react'

function Card({ card, onUpdate, onDelete, socket, boardId, user }) {
  const [isEditing, setIsEditing] = useState(false)
  const [editableCard, setEditableCard] = useState(card)

  useEffect(() => { setEditableCard(card) }, [card])

  const handleDragStart = (e) => e.dataTransfer.setData('cardId', card.id)

  const handleSave = () => {
    if (!editableCard.title.trim()) return
    onUpdate(card.id, editableCard)
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditableCard(card)
    setIsEditing(false)
  }

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this card?')) onDelete(card.id)
  }

  const handleEditClick = (e) => { e.stopPropagation(); setIsEditing(true) }

  return (
    <div className="card" draggable onDragStart={handleDragStart}>
      {isEditing ? (
        <div>
          <input
            type="text"
            value={editableCard.title}
            onChange={(e) => setEditableCard({ ...editableCard, title: e.target.value })}
            style={{ width: '100%', marginBottom: '0.5rem' }}
            autoFocus
            required
          />
          <textarea
            value={editableCard.description}
            onChange={(e) => setEditableCard({ ...editableCard, description: e.target.value })}
            style={{ width: '100%', marginBottom: '0.5rem', minHeight: '60px' }}
            placeholder="Add description..."
          />
          <input
            type="text"
            value={editableCard.assignee || ''}
            onChange={(e) => setEditableCard({ ...editableCard, assignee: e.target.value })}
            placeholder="Assignee"
            style={{ width: '100%', marginBottom: '0.5rem' }}
          />
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={handleSave} style={{ background: '#27ae60', color: 'white', border: 'none', padding: '0.3rem 0.6rem', borderRadius: '3px' }}>Save</button>
            <button onClick={handleCancel} style={{ background: '#95a5a6', color: 'white', border: 'none', padding: '0.3rem 0.6rem', borderRadius: '3px' }}>Cancel</button>
            <button onClick={handleDelete} style={{ background: '#e74c3c', color: 'white', border: 'none', padding: '0.3rem 0.6rem', borderRadius: '3px' }}>Delete</button>
          </div>
        </div>
      ) : (
        <div>
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
            <div className="card-title" style={{ flex: 1 }}>{card.title}</div>
            <button 
              onClick={handleEditClick}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.8rem', color: '#7f8c8d', padding: '0.2rem', marginLeft: '0.5rem' }}
              title="Edit card"
            >✏️</button>
          </div>
          {card.description && <div className="card-description" style={{ marginBottom: '0.5rem', fontSize: '0.9rem', color: '#7f8c8d' }}>{card.description}</div>}
          <div className="card-meta" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
            <div>{card.assignee && <span style={{ background: '#3498db', color: 'white', padding: '0.2rem 0.5rem', borderRadius: '12px' }}>{card.assignee}</span>}</div>
            {card.dueDate && <span style={{ color: '#e74c3c' }}>{new Date(card.dueDate).toLocaleDateString()}</span>}
          </div>
        </div>
      )}
    </div>
  )
}

export default Card
