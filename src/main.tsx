import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import LandingPage from './LandingPage.tsx'
import CatalogStudio from './components/CatalogStudio'

const path = window.location.pathname
const isEditorRoute = path === '/editor' || path.startsWith('/editor/')
const isCatalogRoute = path === '/catalog' || path.startsWith('/catalog/')

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {isCatalogRoute ? <CatalogStudio /> : isEditorRoute ? <App /> : <LandingPage />}
  </StrictMode>,
)
