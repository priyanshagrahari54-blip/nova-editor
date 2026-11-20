import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, Check, Clapperboard, Image as ImageIcon, Layers3, Link2, Sparkles, Wand2 } from 'lucide-react'
import './LandingPage.css'

const APP_URL = '/editor'\nconst CATALOG_URL = '/catalog'

function getReferralCode() {
  try {
    const existing = localStorage.getItem('nova_referral_code')
    if (existing) return existing
    const code = `NOVA-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
    localStorage.setItem('nova_referral_code', code)
    return code
  } catch {
    return 'NOVA-CREATOR'
  }
}

export default function LandingPage() {
  const [copied, setCopied] = useState(false)
  const [referralCode] = useState(getReferralCode)
  const shareUrl = useMemo(() => {
    if (typeof window === 'undefined') return ''
    return `${window.location.origin}/?ref=${encodeURIComponent(referralCode)}`
  }, [referralCode])

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search)
      const source = params.get('utm_source') || params.get('ref')
      if (source) {
        sessionStorage.setItem('nova_acquisition_source', source.slice(0, 100))
      }
    } catch {
      // Attribution is optional; the editor must work when browser storage is unavailable.
    }
  }, [])

  const copyReferral = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2200)
    } catch {
      window.location.href = `mailto:?subject=${encodeURIComponent('Try Nova Studio')}&body=${encodeURIComponent(`Try Nova Studio: ${shareUrl}`)}`
    }
  }

  return (
    <main className="nova-landing">
      <nav className="landing-nav">
        <a className="landing-brand" href="/" aria-label="Nova Studio home"><span className="brand-mark"><Sparkles size={18} /></span><span>NOVA <small>STUDIO</small></span></a>
        <div className="landing-nav-links"><a href="#features">Features</a><a href="#workflow">How it works</a><a href={CATALOG_URL}>Product catalog</a><a href="#pricing">Pricing</a></div>
        <a className="landing-nav-cta" href={CATALOG_URL}>Open catalog <ArrowRight size={15} /></a>
      </nav>

      <section className="landing-hero">
        <div className="hero-copy">
          <div className="eyebrow"><span /> CREATIVE WORKSPACE FOR THE NEXT WAVE</div>
          <h1>Make every frame<br /><em>feel intentional.</em></h1>
          <p className="hero-description">A focused photo and video editing workspace for creators, freelancers and small studios. Shape your look, refine your media and keep your edits under control.</p>
          <div className="hero-actions"><a className="primary-cta" href={APP_URL}>Start creating free <ArrowRight size={17} /></a><a className="secondary-cta" href={CATALOG_URL}>Explore product catalog</a></div>
          <div className="hero-proof"><span><Check size={14} /> Free to get started</span><span><Check size={14} /> No card required</span><span><Check size={14} /> Works in your browser</span></div>
        </div>
        <div className="hero-art" aria-label="Nova Studio creative editing workspace preview">
          <div className="art-glow" />
          <div className="editor-window">
            <div className="editor-chrome"><span /><span /><span /><b>NOVA / CREATIVE WORKSPACE</b><i>LOCAL PREVIEW</i></div>
            <div className="editor-body"><aside><div className="tool-active"><ImageIcon size={17}/></div><div><Layers3 size={17}/></div><div><Wand2 size={17}/></div><div><Clapperboard size={17}/></div></aside><div className="preview-stage"><div className="preview-image"><div className="preview-sun" /><div className="preview-mountain one" /><div className="preview-mountain two" /><div className="preview-water" /><span>FRAME 01 / COLOR STUDY</span></div><div className="preview-controls"><b>COLOR & TONE</b><span>Exposure <i><u /></i></span><span>Contrast <i><u /></i></span><span>Temperature <i><u /></i></span></div></div></div>
            <div className="editor-footer"><span>PROJECT / UNTITLED</span><span>UNDO ↶ &nbsp; REDO ↷</span><span>READY TO CREATE</span></div>
          </div>
          <div className="floating-chip chip-top"><Sparkles size={15}/> Creative control</div><div className="floating-chip chip-bottom"><Check size={15}/> Non-destructive workflow</div>
        </div>
      </section>

      <section className="landing-strip"><span>BUILT FOR THE PEOPLE WHO MAKE</span><b>CREATORS</b><b>FREELANCERS</b><b>PHOTO STUDIOS</b><b>SMALL AGENCIES</b></section>

      <section className="landing-section" id="features"><div className="section-heading"><div className="eyebrow">THE CREATIVE TOOLKIT</div><h2>Everything you need to shape<br /><em>the final look.</em></h2><p>Start with the tools available today. New capabilities will be introduced as they are tested and released.</p></div><div className="feature-grid"><article><span><ImageIcon/></span><h3>Photo adjustments</h3><p>Refine exposure, contrast, color, crop and creative looks in one workspace.</p></article><article><span><Clapperboard/></span><h3>Video workspace</h3><p>Organize clips and work with a timeline-oriented editing workflow.</p></article><article><span><Wand2/></span><h3>AI-assisted direction</h3><p>Turn a creative brief into a structured editing plan. Provider-backed AI features may require configuration.</p></article><article><span><Layers3/></span><h3>Layers & edit history</h3><p>Keep creative elements organized and move through edits with undo and redo.</p></article></div></section>

      <section className="workflow-section" id="workflow"><div><div className="eyebrow">A SIMPLE START</div><h2>From first import<br /><em>to final export.</em></h2><p>Open the workspace, bring in your media, adjust the look and export when your result is ready.</p><a className="primary-cta" href={APP_URL}>Try the editor <ArrowRight size={17}/></a></div><ol><li><b>01</b><span><strong>Bring your media</strong><small>Start with an image or video file.</small></span></li><li><b>02</b><span><strong>Shape your look</strong><small>Adjust color, framing and creative elements.</small></span></li><li><b>03</b><span><strong>Review & export</strong><small>Use edit history to refine your result.</small></span></li></ol></section>

      <section className="pricing-section" id="pricing"><div className="section-heading"><div className="eyebrow">EARLY ACCESS</div><h2>Start free. Create first.</h2><p>Nova is currently free to try while we validate the workflow with creators and studios.</p></div><div className="pricing-card"><div><span className="plan-label">STARTER</span><h3>Free</h3><p>Explore the current editing workspace without a subscription.</p></div><ul><li><Check/> Access to available editor tools</li><li><Check/> Local media workflow</li><li><Check/> No payment details required</li><li><Check/> Share feedback with the team</li></ul><a className="primary-cta" href={APP_URL}>Open Nova for free <ArrowRight size={17}/></a><small>Paid plans and payment checkout are not enabled yet. We will publish pricing only after costs and payment eligibility are verified.</small></div></section>

      <section className="referral-section"><div><div className="eyebrow">GROW TOGETHER</div><h2>Know a creator?<br /><em>Pass Nova along.</em></h2><p>Share your personal link with a creator or studio. Referral rewards are not active yet; this link is for sharing and early discovery only.</p></div><div className="share-card"><div className="share-icon"><Link2/></div><b>Your share link</b><code>{shareUrl}</code><button onClick={copyReferral}>{copied ? <><Check size={16}/> Copied</> : <><Link2 size={16}/> Copy share link</>}</button><small>Sharing does not create a cash reward or guarantee a referral credit.</small></div></section>

      <footer className="landing-footer"><a className="landing-brand" href="/"><span className="brand-mark"><Sparkles size={18}/></span><span>NOVA <small>STUDIO</small></span></a><span>Built for thoughtful creative work.</span><div><a href="https://github.com/priyanshagrahari54-blip/nova-editor/issues/new">Contact / feedback</a><a href="https://github.com/priyanshagrahari54-blip/nova-editor">GitHub</a><a href="https://github.com/priyanshagrahari54-blip/nova-editor/issues">Feedback</a></div></footer>
    </main>
  )
}
