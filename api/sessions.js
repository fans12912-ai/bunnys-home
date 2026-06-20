const { supabase } = require('./_lib')

module.exports = async (req, res) => {
  try {
    // GET — 获取所有会话
    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .order('updated_at', { ascending: false })
      if (error) throw error
      return res.json(data)
    }

    // POST — 创建新会话
    if (req.method === 'POST') {
      const { name } = req.body || {}
      const { data, error } = await supabase
        .from('sessions')
        .insert({ name: name || '新对话' })
        .select()
        .single()
      if (error) throw error
      return res.json(data)
    }

    // PATCH — 重命名
    if (req.method === 'PATCH') {
      const { id, name } = req.body || {}
      if (!id) return res.status(400).json({ error: '缺少 id' })
      const { data, error } = await supabase
        .from('sessions')
        .update({ name, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return res.json(data)
    }

    // DELETE — 删除会话
    if (req.method === 'DELETE') {
      const { id } = req.body || {}
      if (!id) return res.status(400).json({ error: '缺少 id' })
      const { error } = await supabase
        .from('sessions')
        .delete()
        .eq('id', id)
      if (error) throw error
      return res.json({ ok: true })
    }

    res.status(405).json({ error: 'Method not allowed' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
