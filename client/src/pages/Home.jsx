import { useNavigate } from 'react-router-dom'
import SOSButton from '../components/SOSButton'
import { HELPLINES } from '../data/emergencyInstructions'
import { EMERGENCY_TYPES } from '../context/EmergencyContext'

const STATS = [
  { value: '12 min', label: 'Avg ambulance delay in India' },
  { value: '10 sec', label: 'LifeSaver AI response time' },
  { value: '5',      label: 'Emergency types covered' },
]

export default function Home() {
  const navigate = useNavigate()

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 py-12 space-y-20">

      {/* ── Hero ─────────────────────────────────────────── */}
      <section className="text-center space-y-8">
        <h1 className="text-5xl sm:text-7xl font-black leading-tight">
          Every Second<br />
          <span className="text-sos-red">Matters.</span>
        </h1>

        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
          LifeSaver AI is a real-time emergency response platform. One tap triggers SOS, shares your location, and connects you to nearby help — all within seconds.
        </p>

        {/* Big SOS */}
        <div className="flex justify-center py-8">
          <SOSButton size="large" />
        </div>

        {/* Shortcut hint */}
        <p className="text-xs text-gray-600">
          Also triggered by voice ("Help me") or <kbd className="bg-white/10 px-1 rounded">Ctrl</kbd> + <kbd className="bg-white/10 px-1 rounded">⇧</kbd> + <kbd className="bg-white/10 px-1 rounded">S</kbd>
        </p>
      </section>

      {/* ── Stats ────────────────────────────────────────── */}
      <section className="grid grid-cols-3 gap-4">
        {STATS.map((s) => (
          <div key={s.label} className="glass-card p-5 text-center">
            <p className="text-3xl sm:text-4xl font-black text-sos-red">{s.value}</p>
            <p className="text-xs sm:text-sm text-gray-400 mt-1">{s.label}</p>
          </div>
        ))}
      </section>

      {/* ── Emergency types ──────────────────────────────── */}
      <section>
        <h2 className="text-2xl font-bold text-center mb-8">What can we help with?</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {Object.values(EMERGENCY_TYPES).map((type) => (
            <button
              key={type.id}
              onClick={() => navigate('/dashboard')}
              className={`
                flex flex-col items-center gap-3 p-5 rounded-2xl border cursor-pointer
                hover:brightness-125 active:scale-95 transition-all
                ${type.bg} ${type.border}
              `}
            >
              <span className="text-4xl">{type.icon}</span>
              <span className="text-sm font-semibold">{type.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* ── Quick helplines ───────────────────────────────── */}
      <section className="glass-card p-6">
        <h2 className="text-lg font-bold mb-4">⚡ Quick Helplines</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            { label: '🚑 Ambulance',       number: HELPLINES.ambulance },
            { label: '🚔 Police',          number: HELPLINES.police    },
            { label: '🚒 Fire',            number: HELPLINES.fire      },
            { label: '🆘 National Emergency', number: HELPLINES.disaster },
            { label: '🚺 Women Helpline',  number: HELPLINES.women     },
            { label: '👶 Child Helpline',  number: HELPLINES.child     },
          ].map(({ label, number }) => (
            <a
              key={number}
              href={`tel:${number}`}
              className="flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl transition-all active:scale-95"
            >
              <span className="text-base">{label.split(' ')[0]}</span>
              <div>
                <p className="text-xs text-gray-400">{label.split(' ').slice(1).join(' ')}</p>
                <p className="text-sm font-bold">{number}</p>
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* ── Quick nav ─────────────────────────────────────── */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: '🗺️ Live Map',     path: '/dashboard',    desc: 'See your location' },
          { label: '🤖 AI Chat',      path: '/chat',         desc: 'Emergency guidance' },
          { label: '⛑️ Disaster Mode', path: '/disaster',    desc: 'Safe zones & routes' },
          { label: '🚺 Women Safety', path: '/women-safety', desc: 'Priority SOS' },
        ].map(({ label, path, desc }) => (
          <button
            key={path}
            onClick={() => navigate(path)}
            className="gradient-border p-5 text-left hover:brightness-110 active:scale-95 transition-all cursor-pointer"
          >
            <p className="text-base font-bold mb-1">{label}</p>
            <p className="text-xs text-gray-500">{desc}</p>
          </button>
        ))}
      </section>
    </main>
  )
}
