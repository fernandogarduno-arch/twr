/**
 * TWR OS — Image Proxy
 * Vercel Serverless Function: /api/img
 * Fetches external images server-side to bypass CORS restrictions
 * Usage: /api/img?url=https://...
 */

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'GET') return res.status(405).end()

  const { url } = req.query
  if (!url) return res.status(400).json({ error: 'Missing url param' })

  // Only allow image URLs
  const allowed = /\.(jpg|jpeg|png|webp|gif)(\?.*)?$/i
  if (!allowed.test(url)) {
    return res.status(400).json({ error: 'Only image URLs allowed' })
  }

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; TWR-OS/1.0)',
        'Accept': 'image/*',
      }
    })

    if (!response.ok) {
      return res.status(response.status).json({ error: 'Failed to fetch image' })
    }

    const contentType = response.headers.get('content-type') || 'image/jpeg'
    const buffer = Buffer.from(await response.arrayBuffer())

    res.setHeader('Content-Type', contentType)
    res.setHeader('Cache-Control', 'public, max-age=86400') // cache 24h
    return res.status(200).send(buffer)
  } catch (err) {
    return res.status(500).json({ error: 'Proxy error: ' + err.message })
  }
}
