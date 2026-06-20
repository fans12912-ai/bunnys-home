const { supabase } = require('./_lib')

module.exports = async (req, res) => {
  try {
    // GET — 获取设置
    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .limit(1)
        .single()
      if (error) throw error
      return res.json(data)
    }

    // PATCH — 更新设置
    if (req.method === 'PATCH') {
      const { data: current, error: readErr } = await supabase
        .from('settings').select('*').limit(1).single()
      if (readErr) throw readErr

      const { data, error } = await supabase
        .from('settings')
        .update({ ...req.body, updated_at: new Date().toISOString() })
        .eq('id', current.id)
        .select()
        .single()
      if (error) throw error
      return res.json(data)
    }

    res.status(405).json({ error: 'Method not allowed' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
