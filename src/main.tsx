import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// Apply saved theme before render
(function () {
  try {
    const savedMode = localStorage.getItem('ramscars_mode')
    const savedLightTheme = localStorage.getItem('ramscars_light_theme') || 'indigo'
    const savedDarkTheme = localStorage.getItem('ramscars_dark_theme') || 'dark-indigo'

    const root = document.documentElement
    if (savedMode === 'dark') {
      root.classList.add('dark')
      root.setAttribute('data-theme', savedDarkTheme)
    } else {
      root.classList.remove('dark')
      root.setAttribute('data-theme', savedLightTheme)
    }
  } catch (e) {
    // localStorage not available
  }
})()

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.error('Service worker registration failed:', err)
    })
  })
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
