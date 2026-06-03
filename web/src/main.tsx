import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'

// Font self-hosted (sostituiscono il CDN Google Fonts del prototipo)
import '@fontsource/bricolage-grotesque/400.css'
import '@fontsource/bricolage-grotesque/500.css'
import '@fontsource/bricolage-grotesque/600.css'
import '@fontsource/bricolage-grotesque/700.css'
import '@fontsource/bricolage-grotesque/800.css'
import '@fontsource/figtree/400.css'
import '@fontsource/figtree/500.css'
import '@fontsource/figtree/600.css'
import '@fontsource/figtree/700.css'
import '@fontsource/jetbrains-mono/400.css'
import '@fontsource/jetbrains-mono/500.css'

import './styles/theme.css'
import { initTheme } from '@/lib/theme'
import { router } from '@/router'

// Applica il tema salvato il prima possibile (evita flash)
initTheme()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
