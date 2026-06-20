const { supabase } = require('./_lib')

// GET /api/messages?sessionId=xxx
module.exports = async (req, res) => {
  try {
    const sessionId = req.query.sessionId
    if (!sessionId) return res.status(400).json({ error: '缺少 sessionId' })

    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('session_id', sessionId)
      .eq('visible', true)
      .order('created_at', { ascending: true })

    if (error) throw error
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
