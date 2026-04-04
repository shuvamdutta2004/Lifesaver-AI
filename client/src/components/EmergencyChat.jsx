import { useState, useRef, useEffect } from 'react'
import axios from 'axios'
import { useEmergency } from '../context/EmergencyContext'

const API_BASE = import.meta.env.VITE_API_BASE_URL || ''

const QUICK_ACTIONS = [
  { id: 'bleeding', label: '🩸 Bleeding' },
  { id: 'fire', label: '🔥 Fire' },
  { id: 'heart_attack', label: '❤️ Heart Attack' }
]

export default function EmergencyChat() {
  const { emergencyType, userLocation } = useEmergency()
  const [messages, setMessages] = useState([
    { role: 'assistant', text: 'How can I assist you with your emergency?' }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef(null)

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async (text = input) => {
    const message = text.trim()
    if (!message || loading) return

    setMessages(prev => [...prev, { role: 'user', text: message }])
    setInput('')
    setLoading(true)

    try {
      const { data } = await axios.post(`${API_BASE}/api/ai`, {
        message,
        emergencyType: emergencyType || 'general',
        history: messages.map((m) => ({ role: m.role, content: m.text })),
        location: userLocation,
      }, { timeout: 12000 })
      setMessages(prev => [...prev, { role: 'assistant', text: data.reply }])
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', text: 'Please contact emergency services immediately.' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full bg-bg-card border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="bg-sos-red p-4">
        <h2 className="text-sm font-black uppercase tracking-widest text-white">Emergency AI Assistant</h2>
      </div>

      {/* Messages */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 scrollbar-thin">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm ${
              m.role === 'user' 
                ? 'bg-blue-600 text-white rounded-br-none' 
                : 'bg-white/5 text-gray-200 border border-white/10 rounded-bl-none'
            }`}>
              {m.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white/5 border border-white/10 px-4 py-2.5 rounded-2xl rounded-bl-none text-[10px] text-gray-500 animate-pulse">
              LifeSaver AI is thinking...
            </div>
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      {/* Quick Actions */}
      <div className="p-2 border-t border-white/5 flex gap-2">
        {QUICK_ACTIONS.map(qa => (
          <button
            key={qa.id}
            onClick={() => handleSend(`Help with ${qa.label.split(' ')[1]}`)}
            className="flex-1 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-bold transition-colors"
          >
            {qa.label}
          </button>
        ))}
      </div>

      {/* Input */}
      <form 
        onSubmit={e => { e.preventDefault(); handleSend(); }}
        className="p-4 border-t border-white/5 flex gap-2"
      >
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Describe your emergency..."
          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-sos-red/50 transition-colors"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="bg-sos-red hover:bg-red-600 text-white px-5 py-2 rounded-xl font-bold text-sm disabled:opacity-50 transition-all active:scale-95"
        >
          {loading ? '...' : 'SEND'}
        </button>
      </form>
    </div>
  )
}
