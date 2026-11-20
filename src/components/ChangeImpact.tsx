import { useState } from 'react'
import { Activity, AlertTriangle, Clock3 } from 'lucide-react'
import { getRecentProductChanges, type ProductChangeEvent } from '../lib/changeImpact'
import './ChangeImpact.css'

export default function ChangeImpact() {
  const [events] = useState<ProductChangeEvent[]>(() => getRecentProductChanges())
  return <section className="change-impact">
    <div className="change-impact-heading"><div><span className="catalog-kicker">CATALOG CHANGE INTELLIGENCE</span><h2><Activity size={21}/> Product Change Impact</h2><p>When product facts change, Nova lists the downstream content that should be reviewed. It does not claim to update marketplace listings automatically.</p></div><span className="change-impact-count">{events.length} recent changes</span></div>
    {events.length ? <div className="change-impact-list">{events.slice(0,10).map(event => <article key={event.id}><header><strong>{event.sku} · {event.title}</strong><span><Clock3 size={12}/>{new Date(event.createdAt).toLocaleString()}</span></header><p>Changed: {event.changedFields.join(', ')}</p><ul>{event.reviewActions.map(action => <li key={action}><AlertTriangle size={13}/>{action}</li>)}</ul></article>)}</div> : <div className="change-impact-empty">No product changes recorded yet. Edit an existing product to generate the first impact review.</div>}
  </section>
}
