import { useState } from 'react'
import { Check, LockKeyhole, Mail, UserRound, X } from 'lucide-react'

type Account = { name: string; email: string }

export function AuthDialog({ account, onClose, onSave, onSignOut }: { account: Account | null; onClose: () => void; onSave: (account: Account) => void; onSignOut: () => void }) {
  const [name, setName] = useState(account?.name ?? '')
  const [email, setEmail] = useState(account?.email ?? '')
  const [error, setError] = useState('')
  const save = () => { if (!name.trim() || !/^\S+@\S+\.\S+$/.test(email)) { setError('Enter a name and a valid email address.'); return }; onSave({ name: name.trim(), email: email.trim().toLowerCase() }); onClose() }
  return <div className="modal-backdrop" onClick={onClose}><section className="auth-dialog" onClick={event => event.stopPropagation()}><button className="close-modal" aria-label="Close profile modal" onClick={onClose}><X size={17}/></button><div className="auth-icon"><LockKeyhole size={20}/></div><span className="eyebrow">NOVA ACCOUNT</span><h2>{account ? 'Your workspace profile' : 'Set up your workspace'}</h2><p>Save your account profile on this device. Project data is stored locally in this browser.</p><label><UserRound size={15}/><input value={name} onChange={event => setName(event.target.value)} placeholder="Your name" autoComplete="name"/></label><label><Mail size={15}/><input value={email} onChange={event => setEmail(event.target.value)} placeholder="you@example.com" type="email" autoComplete="email"/></label>{error && <small className="auth-error">{error}</small>}<button className="auth-save" onClick={save}><Check size={16}/> {account ? 'Save profile' : 'Create local account'}</button>{account && <button className="auth-signout" onClick={() => { onSignOut(); onClose() }}>Sign out on this device</button>}<small className="auth-note">For production multi-device sign-in, connect a hosted identity provider such as Auth0, Clerk, or Supabase Auth with server-side configuration.</small></section></div>
}