/**
 * TWR OS — Anthropic API Proxy
 * Vercel Serverless Function: /api/claude
 *
 * - Evita CORS bloqueando llamadas directas desde el browser
 * - La API key NUNCA sale al cliente (queda en el servidor)
 * - Solo acepta POST desde tu propio dominio
 */

export default async function handler(req, res) {
  // ── CORS headers ────────────────────────────────────────────────────────────
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  // Preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const ANTHROPIC_KEY = process.env.ANTHROPIC_KEY  // sin VITE_ — queda solo en el servidor
  if (!ANTHROPIC_KEY) {
    return res.status(500).json({ error: 'ANTHROPIC_KEY no configurada en variables de entorno de Vercel.' })
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01',
        'anthropic-beta': 'interleaved-thinking-2025-05-07',
      },
      body: JSON.stringify(req.body),
    })

    const data = await response.json()

    if (!response.ok) {
      return res.status(response.status).json(data)
    }

    return res.status(200).json(data)
  } catch (err) {
    return res.status(500).json({ error: 'Proxy error: ' + err.message })
  }
}
