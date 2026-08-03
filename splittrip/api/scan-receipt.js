/**
 * Vercel Serverless Function: /api/scan-receipt
 *
 * Accepts: POST { image: base64string, mimeType: "image/jpeg" }
 * Returns: { merchant, total, currency, items }
 *
 * The ANTHROPIC_API_KEY lives in Vercel environment variables — never exposed to the browser.
 */

export default async function handler(req, res) {
  // CORS — allow your own domain in production; for now allow all origins
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') { res.status(200).end(); return }
  if (req.method !== 'POST')    { res.status(405).json({ error: 'Method not allowed' }); return }

  const { image, mimeType } = req.body || {}
  if (!image) { res.status(400).json({ error: 'Missing image field' }); return }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) { res.status(500).json({ error: 'API key not configured' }); return }

  const validMime = ['image/jpeg','image/png','image/gif','image/webp'].includes(mimeType)
    ? mimeType : 'image/jpeg'

  try {
    const anthropicResp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type':      'application/json',
        'x-api-key':         apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model:      'claude-opus-4-6',
        max_tokens: 512,
        messages: [{
          role: 'user',
          content: [
            {
              type:   'image',
              source: { type: 'base64', media_type: validMime, data: image },
            },
            {
              type: 'text',
              text: `Parse this receipt image carefully. Return ONLY a valid JSON object — no markdown, no explanation:
{"merchant":"store or restaurant name","total":0.00,"currency":"ISO 4217 currency code","items":[{"name":"item","amount":0.00}]}

Rules:
- merchant: the name of the store/restaurant as shown on the receipt
- total: the final grand total paid (after tax, after discounts) as a number
- currency: detect from symbols or text. Common codes: SGD, MYR, USD, EUR, GBP, JPY, AUD, THB, IDR, INR, HKD, KRW, CNY, VND, PHP, TWD. Default SGD if unclear.
- items: individual line items if visible, otherwise []
- Return ONLY the JSON object, nothing else.`,
            },
          ],
        }],
      }),
    })

    if (!anthropicResp.ok) {
      const err = await anthropicResp.text()
      console.error('Anthropic error:', err)
      res.status(502).json({ error: 'AI service error', detail: err })
      return
    }

    const data    = await anthropicResp.json()
    const rawText = data.content?.find(b => b.type === 'text')?.text || '{}'
    const cleaned = rawText.replace(/```json|```/g, '').trim()

    let parsed
    try {
      parsed = JSON.parse(cleaned)
    } catch {
      console.error('JSON parse failed:', cleaned)
      res.status(422).json({ error: 'Could not parse receipt', raw: cleaned })
      return
    }

    res.status(200).json(parsed)
  } catch (err) {
    console.error('Handler error:', err)
    res.status(500).json({ error: 'Internal server error', detail: err.message })
  }
}
