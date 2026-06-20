const { supabase, deepseek } = require('./_lib')

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { message, sessionId, model } = req.body
    if (!message || !sessionId) {
      return res.status(400).json({ error: '缺少 message 或 sessionId' })
    }

    // 1. 存用户消息
    const { error: userMsgErr } = await supabase
      .from('messages')
      .insert({ session_id: sessionId, role: 'user', content: message })
    if (userMsgErr) throw userMsgErr

    // 更新会话时间
    await supabase
      .from('sessions')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', sessionId)

    // 2. 加载设置
    const { data: settings } = await supabase
      .from('settings').select('*').limit(1).single()

    // 3. 加载历史消息
    const { data: history } = await supabase
      .from('messages')
      .select('*')
      .eq('session_id', sessionId)
      .eq('visible', true)
      .order('created_at', { ascending: true })

    // 4. 加载记忆摘要
    const { data: memories } = await supabase
      .from('memories')
      .select('*')
      .order('created_at', { ascending: false })

    // 5. 组装上下文
    const systemPrompt = settings?.system_prompt || '你是 Bunny，一只住在像素世界里的 AI 小兔子。'
    const memoryText = memories?.map(m => m.content).join('\n') || ''

    const messages = [{ role: 'system', content: systemPrompt }]
    if (memoryText) {
      messages.push({ role: 'system', content: `[过往记忆]\n${memoryText}` })
    }

    const contextRounds = settings?.context_rounds || 20
    const recentMessages = (history || []).slice(-contextRounds)
    for (const msg of recentMessages) {
      messages.push({
        role: msg.role === 'ai' ? 'assistant' : 'user',
        content: msg.content
      })
    }

    // 6. 调用模型
    const modelName = model === 'deepseek-r1' ? 'deepseek-reasoner' : 'deepseek-chat'
    const completion = await deepseek.chat.completions.create({
      model: modelName,
      messages,
      temperature: settings?.temperature || 0.7,
      max_tokens: settings?.max_tokens || 2048,
    })

    const reply = completion.choices[0]?.message?.content || '（模型未返回内容）'

    // 7. 存 AI 回复
    await supabase
      .from('messages')
      .insert({ session_id: sessionId, role: 'ai', content: reply })

    // 8. 记忆压缩检查（后台执行）
    const tokenEstimate = JSON.stringify(messages).length / 2
    const threshold = settings?.compress_threshold || 8000
    if (tokenEstimate > threshold && history.length > 10) {
      compressMemory(history, settings).catch(err => {
        console.error('记忆压缩失败:', err.message)
      })
    }

    res.json({ reply })
  } catch (err) {
    console.error('聊天接口错误:', err)
    res.status(500).json({ error: err.message })
  }
}

// 记忆压缩
async function compressMemory(history, settings) {
  const keepRounds = (settings?.compress_keep_rounds || 5) * 2
  const oldMessages = history.slice(0, -keepRounds)
  if (oldMessages.length === 0) return

  const text = oldMessages
    .map(m => `${m.role === 'user' ? '用户' : 'AI'}: ${m.content}`)
    .join('\n')

  const completion = await deepseek.chat.completions.create({
    model: 'deepseek-chat',
    messages: [
      { role: 'system', content: '将以下对话内容压缩为一段简洁的摘要，保留关键信息和情感。用中文输出，不超过200字。' },
      { role: 'user', content: text },
    ],
    temperature: 0.3,
    max_tokens: 500,
  })

  const summary = completion.choices[0]?.message?.content
  if (summary) {
    await supabase.from('memories').insert({ content: summary })
    const oldIds = oldMessages.map(m => m.id)
    await supabase.from('messages').update({ visible: false }).in('id', oldIds)
    console.log(`记忆压缩完成：${oldIds.length} 条消息 → 1 条摘要`)
  }
}
