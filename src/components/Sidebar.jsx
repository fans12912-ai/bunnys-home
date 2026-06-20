import { useState } from 'react'

function Sidebar({
  sessions, activeSessionId, onNewSession,
  onSwitchSession, onRenameSession, onDeleteSession, isOpen
}) {
  const [editingId, setEditingId] = useState(null)
  const [editName, setEditName] = useState('')

  const startRename = (s) => { setEditingId(s.id); setEditName(s.name) }
  const submitRename = (id) => {
    if (editName.trim()) onRenameSession(id, editName.trim())
    setEditingId(null)
  }

  return (
    <div className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-header">
        <div className="sidebar-title">BUNNY'S HOME</div>
        <button className="new-chat-btn" onClick={onNewSession}>+ 新对话</button>
      </div>

      <div className="session-list">
        {sessions.map(s => (
          <div
            key={s.id}
            className={`session-item ${s.id === activeSessionId ? 'active' : ''}`}
            onClick={() => onSwitchSession(s.id)}
          >
            {editingId === s.id ? (
              <input
                value={editName}
                onChange={e => setEditName(e.target.value)}
                onBlur={() => submitRename(s.id)}
                onKeyDown={e => {
                  if (e.key === 'Enter') submitRename(s.id)
                  if (e.key === 'Escape') setEditingId(null)
                }}
                onClick={e => e.stopPropagation()}
                autoFocus
                style={{
                  flex: 1, border: '2px solid #d4c0c2', padding: '2px 6px',
                  fontSize: '12px', outline: 'none', fontFamily: 'inherit'
                }}
              />
            ) : (
              <span className="session-item-name">{s.name}</span>
            )}
            <div className="session-item-actions">
              <button className="session-action-btn" onClick={e => { e.stopPropagation(); startRename(s) }}>E</button>
              <button className="session-action-btn" onClick={e => { e.stopPropagation(); onDeleteSession(s.id) }}>X</button>
            </div>
          </div>
        ))}
      </div>

      <div className="sidebar-footer">
        <div className="avatar">*</div>
        <span className="sidebar-user-name">Bunny</span>
      </div>
    </div>
  )
}

export default Sidebar
