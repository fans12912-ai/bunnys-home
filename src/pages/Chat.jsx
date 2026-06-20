import { useState, useRef, useEffect } from 'react'
import Sidebar from '../components/Sidebar'
import MessageInput from '../components/MessageInput'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001'

function Chat() {
  const [sessions, setSessions] = useState([
    { id: '1', name: '新对话', createdAt: new Date().toISOString() }
  ])
  const [activeSessionId, setActiveSessionId] = useState('1')
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedModel, setSelectedModel] = useState(
    () => localStorage.getItem('selectedModel') || 'claude'
  )
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'instant' })
  }, [messages])

  const handleModelChange = (model) => {
    setSelectedModel(model)
    localStorage.setItem('selectedModel', model)
  }

  const handleNewSession = () => {
    const newId = Date.now().toString()
    setSessions(prev => [{
      id: newId,
      name: `新对话 ${prev.length + 1}`,
      createdAt: new Date().toISOString()
    }, ...prev])
    setActiveSessionId(newId)
    setMessages([])
  }

  const handleSwitchSession = (id) => {
    setActiveSessionId(id)
    setMessages([])
    setSidebarOpen(false)
  }

  const handleRenameSession = (id, newName) => {
    setSessions(prev => prev.map(s => s.id === id ? { ...s, name: newName } : s))
  }

  const handleDeleteSession = (id) => {
    if (sessions.length <= 1) return
    setSessions(prev => prev.filter(s => s.id !== id))
    if (activeSessionId === id) {
      const rest = sessions.filter(s => s.id !== id)
      setActiveSessionId(rest[0]?.id)
      setMessages([])
    }
  }

  const handleSend = async (text) => {
    if (!text.trim() || loading) return
    const userMsg = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date().toISOString()
    }
    setMessages(prev => [...prev, userMsg])
    setLoading(true)

    // TODO: 接入后端
    setTimeout(() => {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        content: '这是模拟回复。后端搭好之后这里就是真正的 AI 回复。',
        timestamp: new Date().toISOString()
      }])
      setLoading(false)
    }, 600)
  }

  const activeSession = sessions.find(s => s.id === activeSessionId)

  return (
    <div className="chat-layout">
      {sidebarOpen && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.1)', zIndex: 9 }}
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <Sidebar
        sessions={sessions}
        activeSessionId={activeSessionId}
        onNewSession={handleNewSession}
        onSwitchSession={handleSwitchSession}
        onRenameSession={handleRenameSession}
        onDeleteSession={handleDeleteSession}
        isOpen={sidebarOpen}
      />
      <div className="chat-main">
        <div className="chat-topbar">
          <span className="chat-topbar-title">{activeSession?.name || '对话'}</span>
          <select
            className="model-selector"
            value={selectedModel}
            onChange={(e) => handleModelChange(e.target.value)}
          >
            <option value="claude">Claude</option>
            <option value="deepseek">DeepSeek</option>
            <option value="gpt">GPT</option>
          </select>
        </div>

        <div className="messages-container">
          {messages.length === 0 && !loading && (
            <div className="empty-chat">
              <div className="empty-chat-icon">[*]</div>
              <p className="empty-chat-text">说点什么吧</p>
            </div>
          )}

          {messages.map(msg => (
            <div key={msg.id} className={`message-row ${msg.role}`}>
              <div className="message-avatar">{msg.role === 'user' ? '>' : '*'}</div>
              <div>
                <div className="message-bubble">{msg.content}</div>
                <div className="message-time">
                  {new Date(msg.timestamp).toLocaleTimeString('zh-CN', {
                    hour: '2-digit', minute: '2-digit'
                  })}
                </div>
              </div>
            </div>
          ))}

          {loading && (
            <div className="message-row ai">
              <div className="message-avatar">*</div>
              <div className="message-bubble">
                <div className="typing-indicator">
                  <div className="typing-dot" />
                  <div className="typing-dot" />
                  <div className="typing-dot" />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <MessageInput onSend={handleSend} disabled={loading} />
      </div>
    </div>
  )
}

export default Chat
