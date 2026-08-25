import { useMemo, useState } from 'react'
import { Activity, Bot, CheckCircle2, CircleDot, Clock3, GitBranch, GitPullRequest, Play, RefreshCw, Rocket, Settings2, ShieldCheck, Sparkles, Wand2, X, Zap } from 'lucide-react'

type Issue = { id: number; title: string; label: string; priority: 'Critical' | 'High' | 'Normal'; status: 'Open' | 'Fixed' }
type Job = { name: string; detail: string; status: 'Ready' | 'Running' | 'Complete' }

const initialIssues: Issue[] = [
  { id: 184, title: 'Export keeps the selected image format', label: 'export', priority: 'Critical', status: 'Open' },
  { id: 179, title: 'Improve mobile editor controls', label: 'mobile', priority: 'High', status: 'Open' },
  { id: 172, title: 'Canvas interaction and zoom polish', label: 'editor', priority: 'Normal', status: 'Open' },
]
const initialJobs: Job[] = [
  { name: 'Issue triage', detail: 'Group feedback and identify impact', status: 'Ready' },
  { name: 'Quality review', detail: 'Check build, accessibility, and regression signals', status: 'Ready' },
  { name: 'Release notes', detail: 'Draft a human-reviewable update summary', status: 'Ready' },
]

export function ReleaseEngine({ onClose }: { onClose: () => void }) {
  const [issues, setIssues] = useState(initialIssues)
  const [jobs, setJobs] = useState(initialJobs)
  const [running, setRunning] = useState(false)
  const [autopilot, setAutopilot] = useState(false)
  const [release, setRelease] = useState('v1.0.0')
  const [lastRun, setLastRun] = useState('Not run yet')
  const open = issues.filter(issue => issue.status === 'Open')
  const health = useMemo(() => Math.max(72, 100 - open.length * 7), [open.length])
  const runEngine = () => {
    setRunning(true); setJobs(items => items.map(item => ({ ...item, status: 'Running' })))
    window.setTimeout(() => {
      setIssues(items => items.map((item, index) => index < 2 ? { ...item, status: 'Fixed' } : item))
      setJobs(items => items.map(item => ({ ...item, status: 'Complete' })))
      setRelease('v1.0.1'); setLastRun('Just now'); setRunning(false)
    }, 1500)
  }
  return <div className="modal-backdrop engine-backdrop" onClick={onClose}>
    <section className="engine" onClick={event => event.stopPropagation()}>
      <header><div><span className="eyebrow">NOVA AUTONOMY ENGINE</span><h2>Plan, check, and prepare updates</h2></div><button onClick={onClose}><X size={18}/></button></header>
      <div className="engine-overview"><div className="health"><div className="health-ring" style={{ '--score': `${health}%` } as React.CSSProperties}><b>{health}</b><small>health</small></div><span><b>Release confidence</b><small>Prioritized from local workspace signals.</small></span></div><div className="release-card"><span>Next prepared release</span><b>{release}</b><small>{open.length} issues still need review</small><button onClick={runEngine} disabled={running}>{running ? <RefreshCw className="spin" size={15}/> : <Sparkles size={15}/>} {running ? 'Running engine…' : 'Run automation'}</button></div></div>
      <div className="autopilot"><div className="bot-icon"><Bot size={20}/></div><span><b>Autopilot proposals</b><small>Continuously prepare fixes, tests, and release notes. Publishing always requires your approval.</small></span><button className={autopilot ? 'toggle on' : 'toggle'} onClick={() => setAutopilot(!autopilot)} aria-label="Toggle autopilot"><i/></button></div>
      <div className="engine-grid"><section><div className="engine-title"><GitPullRequest size={16}/><b>Issue inbox</b><span>{open.length} open</span></div>{issues.map(issue => <article className={`issue ${issue.status === 'Fixed' ? 'fixed' : ''}`} key={issue.id}><CircleDot size={15}/><div><b>#{issue.id} · {issue.title}</b><small>{issue.label} · {issue.priority}</small></div><button onClick={() => setIssues(items => items.map(item => item.id === issue.id ? { ...item, status: item.status === 'Open' ? 'Fixed' : 'Open' } : item))}>{issue.status === 'Fixed' ? <CheckCircle2 size={16}/> : 'Mark fixed'}</button></article>)}</section><section className="pipeline"><div className="engine-title"><Activity size={16}/><b>Automation jobs</b><span>{lastRun}</span></div>{jobs.map((job, index) => <div className="job" key={job.name}><i className={job.status === 'Complete' ? 'done' : job.status === 'Running' ? 'working' : ''}>{job.status === 'Complete' ? <CheckCircle2 size={15}/> : job.status === 'Running' ? <RefreshCw className="spin" size={15}/> : index === 2 ? <Wand2 size={15}/> : <Clock3 size={15}/>}</i><span><b>{job.name}</b><small>{job.detail}</small></span><em>{job.status}</em></div>)}<footer><ShieldCheck size={16}/><span><b>Approval gate enabled</b><small>Only you can publish code, releases, or external changes.</small></span></footer></section></div>
      <div className="engine-footer"><span><GitBranch size={15}/> GitHub connection: not configured</span><span><Settings2 size={15}/> Connect a repository and GitHub token in a secure backend to automate real issue sync and pull requests.</span><button onClick={runEngine}><Play size={14}/> Run now</button></div>
    </section>
  </div>
}