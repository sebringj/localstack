import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { AutonomoProvider } from './providers/AutonomoProvider'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AutonomoProvider>
      <App />
    </AutonomoProvider>
  </React.StrictMode>,
)
