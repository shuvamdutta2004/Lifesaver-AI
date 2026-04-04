import { useState, useRef, useEffect } from 'react'
import axios from 'axios'
import { useEmergency, EMERGENCY_TYPES } from '../context/EmergencyContext'
import { EMERGENCY_INSTRUCTIONS } from '../data/emergencyInstructions'

const API_BASE = import.meta.env.VITE_API_BASE_URL || ''

// ── Static offline fallbacks ─────────────────────────────────
const OFFLINE_RESPONSES = {
  medical:      'Stay calm. Check if the person is breathing. Call 108. Begin CPR if needed (30 compressions then 2 breaths). Do NOT give food or water. I can give step-by-step guidance — what symptoms do you see?',
  fire:         'EVACUATE NOW. Do NOT use the lift. Cover your nose with wet cloth. Stay low. Call 101. Are you inside or outside the building?',
  flood:        'Move to higher ground immediately. Turn off electricity. Don\'t walk through floodwater. Call 112. What floor are you currently on?',
  earthquake:   'DROP, COVER, HOLD ON. Get under a sturdy table. Stay away from windows. Wait for shaking to stop. Has the shaking stopped yet?',
  women_safety: 'Alert has been sent to nearby volunteers. Move to a crowded, well-lit area. Call 100 (Police) or 1091 (Women Helpline). Can you get to a public place?',
}

// ── Typing indicator ─────────────────────────────────────────
function TypingIndicator() {
  return (
    <div className="flex gap-1 items-center p-3 bg-bg-elevated border border-white/5 rounded-2xl rounded-tl-sm w-fit">
      <span className="typing-dot" />
      <span className="typing-dot" />
      <span className="typing-dot" />
    </div>
  )
}

// ────────────────────────────────────────────────────────────
export default function AIChatPanel({ compact = false }) {
  const { emergencyType, userLocation, sosActive } = useEmergency()
  const eType = emergencyType ? EMERGENCY_TYPES[emergencyType] : null

  const initialMsg = emergencyType
    ? {
        role: 'assistant',
        text: `I'm LifeSaver AI. You've triggered a **${eType?.label}** emergency.\n\n${EMERGENCY_INSTRUCTIONS[emergencyType]?.immediate?.map((s, i) => `${i + 1}. ${s}`).join('\n') || ''}\n\nTell me what you see so I can guide you.`,
      }
    : {
        role: 'assistant',
        text: 'Hi, I\'m LifeSaver AI 🚨\n\nI can help with medical first-aid, fire evacuation, flood safety, earthquake response, or women safety guidance.\n\nWhat emergency are you facing?',
      }

  const [messages,  setMessages]  = useState([initialMsg])
  const [input,     setInput]      = useState('')
  const [isLoading, setIsLoading]  = useState(false)
  const bottomRef  = useRef(null)
  const inputRef   = useRef(null)

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  // Re-init when emergency type changes
  useEffect(() => {
    setMessages([initialMsg])
  }, [emergencyType])

  const sendMessage = async () => {
    const text = input.trim()
    if (!text || isLoading) return

    const userMsg = { role: 'user', text }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setIsLoading(true)

    try {
      // ── API ENDPOINT: POST /api/ai ───────────────────────
      // TODO: Set VITE_API_BASE_URL in .env to your backend URL
      // Request body: { message, emergencyType, history }
      // Response:     { reply: string }
      // ────────────────────────────────────────────────────
      const res = await axios.post(`${API_BASE}/api/ai`, {
        message:       text,
        emergencyType: emergencyType || 'general',
        history:       messages.map((m) => ({ role: m.role, content: m.text })),
        location:      userLocation,
      }, { timeout: 12000 })

      setMessages((prev) => [...prev, { role: 'assistant', text: res.data.reply }])
    } catch {
      // Offline fallback
      const fallback =
        OFFLINE_RESPONSES[emergencyType] ||
        'I\'m currently offline. Please call 112 for immediate help. Stay calm and follow your emergency instructions.'
      setMessages((prev) => [...prev, { role: 'assistant', text: fallback }])
    } finally {
      setIsLoading(false)
      inputRef.current?.focus()
    }
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className={`flex flex-col bg-bg-card border border-white/5 rounded-2xl overflow-hidden ${compact ? 'h-72' : 'h-full min-h-[400px]'}`}>

      {/* Header */}
      <div className="px-4 py-3 border-b border-white/5 flex items-center gap-3">
        <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-sm">🤖</div>
        <div>
          <p className="text-sm font-semibold">LifeSaver AI Assistant</p>
          <div className="flex items-center gap-1.5">
            <span className="status-dot active" />
            <span className="text-[11px] text-safe-green">Online</span>
          </div>
        </div>
        {eType && (
          <div className="ml-auto type-badge" style={{ background: `${eType.color}20`, color: eType.color, border: `1px solid ${eType.color}40` }}>
            {eType.icon} {eType.label}
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
            {msg.role === 'assistant' && (
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-xs mr-2 flex-shrink-0 mt-0.5">🤖</div>
            )}
            <div className={msg.role === 'user' ? 'chat-bubble-user max-w-[80%]' : 'chat-bubble-ai max-w-[85%]'}>
              {msg.text.split('\n').map((line, j) => (
                <p key={j} className={line === '' ? 'h-2' : ''}>
                  {line.replace(/\*\*(.*?)\*\*/g, '$1') /* strip markdown bold for simplicity */}
                </p>
              ))}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex items-start gap-2 animate-fade-in">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-xs">🤖</div>
            <TypingIndicator />
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-white/5">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder={sosActive ? 'Describe what you see…' : 'Ask about any emergency…'}
            className="flex-1 bg-bg-elevated border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-sos-red/50 transition-colors"
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || isLoading}
            className="px-4 py-2.5 bg-sos-red hover:bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl text-white font-bold text-sm transition-all active:scale-95"
          >
            {isLoading ? '…' : '➤'}
          </button>
        </div>
        <p className="text-[10px] text-gray-600 mt-1.5 text-center">
          AI guidance only — always call emergency services for real emergencies
        </p>
      </div>
    </div>
  )
}
