import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// De vier handschriften van de drukkerij zelf, uit het portfolio. Lokaal gebundeld, nooit van Google
import '@fontsource/homemade-apple/latin-400.css'
import '@fontsource/zen-antique-soft/latin-400.css'
import '@fontsource/klee-one/latin-400.css'
import '@fontsource/klee-one/latin-600.css'
import '@fontsource/yomogi/latin-400.css'
import './index.css'
import App from './App.tsx'
import { paintPhase, readPhase } from './lib/air'

// Gezet voor de eerste verf, zodat het papier nooit even de verkeerde kleur heeft
paintPhase(readPhase())

const queryClient = new QueryClient()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
)
