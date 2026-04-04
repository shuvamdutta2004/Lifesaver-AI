import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useEmergency } from '../context/EmergencyContext'

export default function Navbar() {
  const { sosActive, emergencyType } = useEmergency()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)

  const isActive = (path) => location.pathname === path

  return (
    <nav className="sticky top-0 z-50 bg-bg-primary/80 backdrop-blur-md border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <div className="relative w-9 h-9 rounded-xl bg-sos-red flex items-center justify-center">
            <span className="text-lg">🚨</span>
            {sosActive && (
              <span className="absolute inset-0 rounded-xl bg-sos-red animate-ping-slow opacity-50" />
            )}
          </div>
          <div>
            <p className="text-sm font-bold leading-tight tracking-tight">LifeSaver <span className="text-sos-red">AI</span></p>
            <p className="text-[10px] text-gray-500 leading-tight">Emergency Response</p>
          </div>
        </Link>

        {/* SOS Active badge */}
        {sosActive && (
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-sos-red/20 border border-sos-red/50 rounded-full animate-fade-in">
            <span className="status-dot active" />
            <span className="text-sos-red text-xs font-bold uppercase tracking-widest">SOS Active</span>
          </div>
        )}

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1">
          {[
            { path: '/',             label: 'Home',    icon: '🏠' },
            { path: '/dashboard',    label: 'Map',     icon: '🗺️' },
            { path: '/chat',         label: 'AI Chat', icon: '🤖' },
            { path: '/disaster',     label: 'Disaster',icon: '⛑️' },
            { path: '/women-safety', label: 'Safety',  icon: '🚺' },
          ].map(({ path, label, icon }) => (
            <Link
              key={path}
              to={path}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                isActive(path)
                  ? 'bg-sos-red/15 text-sos-red'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <span>{icon}</span>
              {label}
            </Link>
          ))}
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5"
          aria-label="Toggle menu"
        >
          <div className="space-y-1.5">
            <span className={`block w-5 h-0.5 bg-current transition-all ${menuOpen ? 'rotate-45 translate-y-2' : ''}`} />
            <span className={`block w-5 h-0.5 bg-current transition-all ${menuOpen ? 'opacity-0' : ''}`} />
            <span className={`block w-5 h-0.5 bg-current transition-all ${menuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
          </div>
        </button>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className="md:hidden px-4 pb-4 space-y-1 animate-slide-up">
          {[
            { path: '/',             label: 'Home',    icon: '🏠' },
            { path: '/dashboard',    label: 'Map View',icon: '🗺️' },
            { path: '/chat',         label: 'AI Chat', icon: '🤖' },
            { path: '/disaster',     label: 'Disaster',icon: '⛑️' },
            { path: '/women-safety', label: 'Women Safety', icon: '🚺' },
          ].map(({ path, label, icon }) => (
            <Link
              key={path}
              to={path}
              onClick={() => setMenuOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                isActive(path)
                  ? 'bg-sos-red/15 text-sos-red'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <span>{icon}</span>
              {label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  )
}
