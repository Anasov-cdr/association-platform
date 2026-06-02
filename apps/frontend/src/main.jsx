import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './i18n'
import './index.css'
import { App } from './App'
import { applySmartOrdoSso } from './smartordoSso'

applySmartOrdoSso()

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
)
