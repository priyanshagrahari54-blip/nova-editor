export type AiOperation = 'analyzeMedia' | 'editImage' | 'removeObject' | 'upscaleImage' | 'generateMask' | 'editVideo' | 'enhanceAudio'
export type AiRequest = { operation: AiOperation; prompt: string; preserve: string[]; assetName?: string }
export type AiPlan = { title: string; steps: string[]; needsProvider: boolean }

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

export function createPlan(prompt: string, preserve: string[]): AiPlan {
  const normalized = prompt.toLowerCase()
  const steps = ['Analyze source media']
  if (preserve.length) steps.push(`Preserve locked regions: ${preserve.join(', ')}`)
  if (/cinematic|color|grade/.test(normalized)) steps.push('Balance exposure and apply a cinematic color grade')
  if (/noise|denoise/.test(normalized)) steps.push('Queue detail-preserving denoise operation')
  if (/stabil/.test(normalized)) steps.push('Queue video stabilization operation')
  if (/remove|replace|background/.test(normalized)) steps.push('Generate an editable mask for the requested region')
  if (steps.length === 1) steps.push('Assess exposure, color, detail, and composition')
  return { title: 'Editable AI action plan', steps, needsProvider: true }
}
