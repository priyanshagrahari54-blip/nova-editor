export type AiOperation = 'analyzeMedia' | 'editImage' | 'removeObject' | 'upscaleImage' | 'generateMask' | 'editVideo' | 'enhanceAudio'
export type AiRequest = { operation: AiOperation; prompt: string; preserve: string[]; assetName?: string }
export type AiPlan = { title: string; steps: string[]; needsProvider: boolean; summary?: string; model?: string; source?: 'local' | 'cloud' }

export const NOVA_AI_MODEL = import.meta.env.VITE_NOVA_AI_MODEL || 'gpt-5.6-sol'

export interface NovaAiProvider {
  id: string
  can(operation: AiOperation): boolean
  execute(request: AiRequest): Promise<unknown>
}

export class ProviderRegistry {
  private providers: NovaAiProvider[] = []
  register(provider: NovaAiProvider) { this.providers.push(provider) }
  providerFor(operation: AiOperation) { return this.providers.find(provider => provider.can(operation)) }
}

export const providers = new ProviderRegistry()

class NovaPowerfulModelProvider implements NovaAiProvider {
  id = `openai:${NOVA_AI_MODEL}`
  can() { return true }
  async execute(request: AiRequest) {
    const response = await fetch('/api/ai', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(request) })
    const result = await response.json() as { model?: string; plan?: AiPlan; error?: string }
    if (!response.ok || !result.plan) throw new Error(result.error || 'The powerful AI model is unavailable.')
    return { ...result.plan, model: result.model || NOVA_AI_MODEL, source: 'cloud' as const }
  }
}

providers.register(new NovaPowerfulModelProvider())

export function createPlan(prompt: string, preserve: string[]): AiPlan {
  const normalized = prompt.toLowerCase()
  const steps = ['Analyze source media']
  if (preserve.length) steps.push(`Preserve locked regions: ${preserve.join(', ')}`)
  if (/cinematic|color|grade/.test(normalized)) steps.push('Balance exposure and apply a cinematic color grade')
  if (/noise|denoise/.test(normalized)) steps.push('Queue detail-preserving denoise operation')
  if (/stabil/.test(normalized)) steps.push('Queue video stabilization operation')
  if (/remove|replace|background/.test(normalized)) steps.push('Generate an editable mask for the requested region')
  if (steps.length === 1) steps.push('Assess exposure, color, detail, and composition')
  return { title: 'Editable AI action plan', summary: 'A safe local plan is shown until the secure model endpoint is configured.', steps, needsProvider: true, model: 'Nova local planner', source: 'local' }
}

export async function createPowerfulPlan(request: AiRequest): Promise<AiPlan> {
  const provider = providers.providerFor(request.operation)
  if (!provider) throw new Error('No AI provider supports this operation.')
  const result = await provider.execute(request)
  if (!result || typeof result !== 'object') throw new Error('The AI provider returned an invalid response.')
  const plan = result as AiPlan
  if (typeof plan.title !== 'string' || !Array.isArray(plan.steps)) throw new Error('The AI provider returned an invalid edit plan.')
  return plan
}
