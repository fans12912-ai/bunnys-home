import { useState, useRef, useEffect } from 'react'

function MessageInput({ onSend, disabled }) {
  const [text, setText] = useState('')
  const taRef = useRef(null)

  useEffect(() => {
    const ta = taRef.current
    if (ta) {
      ta.style.height = 'auto'
      ta.style.height = Math.min(ta.scrollHeight, 120) + 'px'
    }
  }, [text])

  const submit = () => {
    if (!text.trim() || disabled) return
    onSend(text)
    setText('')
  }

  const onKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  return (
    <div className="input-container">
      <div className="input-wrapper">
        <textarea
          ref={taRef}
          className="chat-input"
          placeholder="输入消息..."
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={onKey}
          disabled={disabled}
          rows={1}
        />
        <button className="send-btn" onClick={submit} disabled={disabled || !text.trim()}>
          &gt;
        </button>
      </div>
    </div>
  )
}

export default MessageInput
