type Request = {
  method?: string
  body?: unknown
}

type Response = {
  status: (code: number) => { json: (value: unknown) => void }
  setHeader: (key: string, value: string) => void
}

type AiBody = {
  operation?: string
  prompt?: string
  preserve?: string[]
  assetName?: string
}

type ModelResponse = {
  output_text?: string
  output?: Array<{ content?: Array<{ type?: string; text?: string }> }>
  error?: { message?: string }
}

const DEFAULT_MODEL = 'gpt-5.6-sol'
const allowedOperations = new Set(['analyzeMedia', 'editImage', 'removeObject', 'upscaleImage', 'generateMask', 'editVideo', 'enhanceAudio'])

function requestBody(value: unknown): AiBody {
  if (typeof value === 'string') {
    try { return JSON.parse(value) as AiBody } catch { return {} }
  }
  return value && typeof value === 'object' ? value as AiBody : {}
}

function outputText(result: ModelResponse) {
  if (result.output_text) return result.output_text
  return result.output?.flatMap(item => item.content ?? []).find(item => item.type === 'output_text')?.text ?? ''
}

function parsePlan(text: string) {
  const normalized = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '')
  const parsed = JSON.parse(normalized) as { title?: unknown; summary?: unknown; steps?: unknown }
  if (typeof parsed.title !== 'string' || !Array.isArray(parsed.steps)) throw new Error('Model returned an invalid edit plan.')
  const steps = parsed.steps.filter((step): step is string => typeof step === 'string' && step.trim().length > 0).slice(0, 8)
  if (!steps.length) throw new Error('Model returned an empty edit plan.')
  return { title: parsed.title.slice(0, 100), summary: typeof parsed.summary === 'string' ? parsed.summary.slice(0, 300) : '', steps }
}

export default async function handler(request: Request, response: Response) {
  response.setHeader('Cache-Control', 'no-store')
  if (request.method !== 'POST') { response.status(405).json({ error: 'Use POST for Nova AI requests.' }); return }

  const body = requestBody(request.body)
  const prompt = body.prompt?.trim() ?? ''
  const operation = body.operation ?? 'analyzeMedia'
  if (!prompt || prompt.length > 4000 || !allowedOperations.has(operation)) {
    response.status(400).json({ error: 'Pass a valid AI operation and a prompt up to 4,000 characters.' })
    return
  }

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    response.status(503).json({ error: 'Nova AI is not configured. Add OPENAI_API_KEY to the server environment.', code: 'provider_not_configured' })
    return
  }

  const model = process.env.NOVA_AI_MODEL || process.env.OPENAI_MODEL || DEFAULT_MODEL
  const preserve = Array.isArray(body.preserve) ? body.preserve.filter(item => typeof item === 'string').slice(0, 10) : []
  const system = `You are Nova Studio's senior post-production AI. Create precise, professional, non-destructive editing plans for photo and video creators. You understand color science, retouching, compositing, VFX, audio mastering, pacing, delivery formats, and the limitations of browser-based editing. Return only valid JSON with this exact shape: {"title":"short title","summary":"one concise creative direction","steps":["specific editable step"]}. Include 3 to 7 steps. Never claim an edit was executed. Distinguish editable local adjustments from operations that need an image, video, transcription, or generative media provider.`
  const user = `Operation: ${operation}\nAsset: ${body.assetName?.slice(0, 200) || 'active media'}\nProtected regions: ${preserve.length ? preserve.join(', ') : 'none'}\nCreator direction: ${prompt}`

  try {
    const upstream = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, reasoning: { effort: 'high' }, max_output_tokens: 1400, input: [{ role: 'system', content: system }, { role: 'user', content: user }] }),
    })
    const result = await upstream.json() as ModelResponse
    if (!upstream.ok) {
      // Security: Do not expose raw upstream error details or API key/provider internals to clients
      response.status(upstream.status).json({ error: 'The AI provider rejected this request.' })
      return
    }
    const plan = parsePlan(outputText(result))
    response.status(200).json({ model, plan: { ...plan, needsProvider: false, source: 'cloud' } })
  } catch {
    // Security: Generic error message avoids leaking stack traces or connection error details
    response.status(502).json({ error: 'Nova could not contact the AI provider.' })
  }
}
