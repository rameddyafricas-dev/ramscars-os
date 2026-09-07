import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// Apply saved theme before render
(function () {
  try {
    const savedMode = localStorage.getItem('ramscars_mode')
    const savedLightTheme = localStorage.getItem('ramscars_light_theme')
    const savedDarkTheme = localStorage.getItem('ramscars_dark_theme')

    const root = document.documentElement
    if (savedMode === 'dark') {
      root.classList.add('dark')
      if (savedDarkTheme) root.setAttribute('data-theme', savedDarkTheme)
    } else {
      root.classList.remove('dark')
      if (savedLightTheme) root.setAttribute('data-theme', savedLightTheme)
    }
  } catch (e) {
    // localStorage not available
  }
})()

// Global error listeners
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error || event.message)
})

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason)
})

// Service worker registration with update prompt
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        // Check for updates on page load
        registration.update().catch(() => {})

        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing
          if (!newWorker) return
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              showUpdateBanner()
            }
          })
        })

        let refreshing = false
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          if (refreshing) return
          refreshing = true
          window.location.reload()
        })
      })
      .catch((err) => {
        console.error('Service worker registration failed:', err)
      })
  })
}

function showUpdateBanner() {
  if (document.getElementById('update-banner')) return
  const banner = document.createElement('div')
  banner.id = 'update-banner'
  banner.style.cssText = 'position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:#4f46e5;color:white;padding:12px 24px;border-radius:12px;box-shadow:0 10px 30px rgba(0,0,0,0.2);z-index:99999;display:flex;align-items:center;gap:12px;font-family:system-ui,sans-serif;'
  banner.innerHTML = `
    <span>New version available.</span>
    <button id="update-banner-button" style="background:white;color:#4f46e5;border:none;padding:8px 16px;border-radius:8px;font-weight:600;cursor:pointer;">Refresh</button>
    <button id="update-banner-close" style="background:transparent;color:white;border:none;font-size:20px;cursor:pointer;line-height:1;">&times;</button>
  `
  banner.querySelector('#update-banner-button')?.addEventListener('click', () => {
    window.location.reload()
  })
  banner.querySelector('#update-banner-close')?.addEventListener('click', () => {
    banner.remove()
  })
  document.body.appendChild(banner)
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
