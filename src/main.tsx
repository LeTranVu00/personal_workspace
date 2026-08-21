import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { LanguageProvider } from './i18n'

// Get root element
const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('Root element #root not found')
}

// Create root and render
createRoot(rootElement).render(
  <StrictMode>
    <LanguageProvider>
      <App />
    </LanguageProvider>
  </StrictMode>,
)