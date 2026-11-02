import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/globals.css'
import App from './App.jsx'
import { initBookingTracking } from './utils/adsTracking'
import { initLeadTracking } from './utils/leadTracking'
import { initTracking } from './utils/tracking'

initBookingTracking()
initLeadTracking()
initTracking()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
