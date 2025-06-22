import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Register service worker for PWA
// Temporarily disabled due to import issues
// if ('serviceWorker' in navigator) {
//   // Dynamic import to handle the virtual module
//   import('virtual:pwa-register').then(({ registerSW }) => {
//     const updateSW = registerSW({
//       onNeedRefresh() {
//         if (confirm('New content available. Reload?')) {
//           updateSW(true)
//         }
//       },
//       onOfflineReady() {
//         console.log('App ready to work offline')
//       },
//     })
//   }).catch((error) => {
//     console.log('PWA register not available:', error)
//   })
// }

createRoot(document.getElementById("root")!).render(<App />);
