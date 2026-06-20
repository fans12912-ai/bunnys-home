import { useState, useRef, useEffect, useCallback } from 'react'
import Sidebar from '../components/Sidebar'
import MessageInput from '../components/MessageInput'

// Vercel 部署时用同域（serverless functions），本地开发时用独立后端
const API_BASE = import.meta.env.PROD ? '' : 'http://localhost:3001'

function Chat() {
  const [sessions, setSessions] = useState([])
  const [activeSessionId, setActiveSessionId] = useState(null)
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedModel, setSelectedModel] = useState(
    () => localStorage.getItem('selectedModel') || 'deepseek'
  )
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const messagesEndRef = useRef(null)

  // 加载会话列表
  const loadSessions = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/sessions`)
      const data = await res.json()
      if (Array.isArray(data) && data.length > 0) {
        setSessions(data)
        if (!activeSessionId) {
          setActiveSessionId(data[0].id)
        }
      }
    } catch (err) {
      console.error('加载会话失败:', err)
    }
  }, [activeSessionId])

  // 加载消息
  const loadMessages = useCallback(async (sessionId) => {
    try {
      const res = await fetch(`${API_BASE}/api/messages?sessionId=${sessionId}`)
      const data = await res.json()
      if (Array.isArray(data)) {
        setMessages(data.map(m => ({
          id: m.id,
          role: m.role,
          content: m.content,
          timestamp: m.created_at
        })))
      }
    } catch (err) {
      console.error('加载消息失败:', err)
    }
  }, [])

  useEffect(() => { loadSessions() }, [loadSessions])

  useEffect(() => {
    if (activeSessionId) loadMessages(activeSessionId)
  }, [activeSessionId, loadMessages])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'instant' })
  }, [messages])

  const handleModelChange = (model) => {
    setSelectedModel(model)
    localStorage.setItem('selectedModel', model)
  }

  const handleNewSession = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: '新对话' })
      })
      const newSession = await res.json()
      setSessions(prev => [newSession, ...prev])
      setActiveSessionId(newSession.id)
      setMessages([])
    } catch (err) {
      console.error('创建会话失败:', err)
    }
  }

  const handleSwitchSession = (id) => {
    setActiveSessionId(id)
    setSidebarOpen(false)
  }

  const handleRenameSession = async (id, newName) => {
    setSessions(prev => prev.map(s => s.id === id ? { ...s, name: newName } : s))
    try {
      await fetch(`${API_BASE}/api/sessions`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, name: newName })
      })
    } catch (err) {
      console.error('重命名失败:', err)
    }
  }

  const handleDeleteSession = async (id) => {
    if (sessions.length <= 1) return
    setSessions(prev => prev.filter(s => s.id !== id))
    if (activeSessionId === id) {
      const rest = sessions.filter(s => s.id !== id)
      setActiveSessionId(rest[0]?.id || null)
    }
    try {
      await fetch(`${API_BASE}/api/sessions`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      })
    } catch (err) {
      console.error('删除失败:', err)
    }
  }

  const handleSend = async (text) => {
    if (!text.trim() || loading || !activeSessionId) return

    const userMsg = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date().toISOString()
    }
    setMessages(prev => [...prev, userMsg])
    setLoading(true)

    try {
      const res = await fetch(`${API_BASE}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          sessionId: activeSessionId,
          model: selectedModel
        })
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)

      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        content: data.reply,
        timestamp: new Date().toISOString()
      }])
    } catch (err) {
      console.error('发送失败:', err)
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        content: `[错误] ${err.message}`,
        timestamp: new Date().toISOString()
      }])
    } finally {
      setLoading(false)
    }
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
            <option value="deepseek">DeepSeek</option>
            <option value="deepseek-r1">DeepSeek R1</option>
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
