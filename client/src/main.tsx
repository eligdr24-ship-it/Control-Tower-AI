import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App'
import { QueryProvider } from './lib/QueryProvider'
import { AuthProvider }  from './context/AuthContext'
import { AuthGate }      from './components/layout/AuthGate'

const root = document.getElementById('root')
if (!root) throw new Error('Root element #root not found')

createRoot(root).render(
  <StrictMode>
    <QueryProvider>
      <BrowserRouter>
        <AuthProvider>
          <AuthGate>
            <App />
          </AuthGate>
        </AuthProvider>
      </BrowserRouter>
    </QueryProvider>
  </StrictMode>
)
