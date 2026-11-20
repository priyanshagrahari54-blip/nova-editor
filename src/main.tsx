import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import LandingPage from './LandingPage.tsx'

const isEditorRoute = window.location.pathname === '/editor' || window.location.pathname.startsWith('/editor/')

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {isEditorRoute ? <App /> : <LandingPage />}
  </StrictMode>,
)
