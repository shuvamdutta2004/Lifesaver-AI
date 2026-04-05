// ============================================================
// server/index.js — Express App Entry Point
// ============================================================

import 'dotenv/config'
import express      from 'express'
import cors         from 'cors'
import helmet       from 'helmet'
import morgan       from 'morgan'
import rateLimit    from 'express-rate-limit'

import sosRoutes    from './routes/sos.js'
import aiRoutes     from './routes/ai.js'
import nearbyRoutes from './routes/nearby.js'
import alertRoutes  from './routes/alerts.js'
import chatRoutes from './routes/chat.js'
import placesRoutes from './routes/places.js'
import directionsRoutes from './routes/directions.js'
import twilioRoutes from './routes/twilio.js'
import escapeRoutes from './routes/escape.js'
import errorHandler from './middleware/errorHandler.js'

const app  = express()
const PORT = Number(process.env.PORT || 4000)

// ── Security & middleware ────────────────────────────────────
app.use(helmet())
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'))
app.use(express.json({ limit: '10kb' }))

// ── CORS ─────────────────────────────────────────────────────
// TODO: Add your Vercel URL to ALLOWED_ORIGINS in .env
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean)

function isTrustedDevOrigin(origin) {
  if (process.env.NODE_ENV === 'production') return false

  try {
    const { hostname, port, protocol } = new URL(origin)
    const isHttp = protocol === 'http:' || protocol === 'https:'
    if (!isHttp) return false

    const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1'
    const isPrivateIPv4 = /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[0-1])\.)/.test(hostname)
    const isDevTunnel = hostname.endsWith('.devtunnels.ms')
    const isVitePort = !port || port === '5173'

    return isVitePort && (isLocalhost || isPrivateIPv4 || isDevTunnel)
  } catch {
    return false
  }
}

app.use(cors({
  origin: (origin, cb) => {
    // Allow requests with no origin (mobile apps, curl)
    if (!origin || allowedOrigins.includes(origin) || isTrustedDevOrigin(origin)) {
      return cb(null, true)
    }
    return cb(new Error(`CORS blocked: ${origin}`))
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}))

// ── Rate limiting ─────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 60_000,   // 1 minute
  max:      60,       // 60 requests per IP per minute
  message:  { error: 'Too many requests – please try again.' },
})
app.use('/api/', limiter)

// ── Routes ───────────────────────────────────────────────────
app.use('/api/sos',    sosRoutes)
app.use('/api/chat',   chatRoutes)
app.use('/api/ai',     aiRoutes)
app.use('/api/nearby', nearbyRoutes)
app.use('/api/alerts', alertRoutes)
app.use('/api/places', placesRoutes)
app.use('/api/directions', directionsRoutes)
app.use('/api/twilio', twilioRoutes)
app.use('/api/escape', escapeRoutes)

// ── Health check ─────────────────────────────────────────────
app.get('/health', (_, res) => res.json({
  status: 'ok',
  service: 'lifesaver-ai-backend',
  timestamp: new Date().toISOString(),
}))

// ── 404 ──────────────────────────────────────────────────────
app.use((_, res) => res.status(404).json({ error: 'Route not found' }))

// ── Error handler ────────────────────────────────────────────
app.use(errorHandler)

// ── Start ────────────────────────────────────────────────────
function logBoot(port) {
  const ollamaEnabled = process.env.OLLAMA_ENABLED !== 'false'
  const ollamaModel = process.env.OLLAMA_MODEL || 'llama3.2'
  console.log(`🚨 LifeSaver AI Server running on http://localhost:${port}`)
  console.log(`   Ollama:    ${ollamaEnabled ? `✅ Enabled (${ollamaModel})` : '⚠️  Disabled'}`)
  console.log(`   Twilio:    ${process.env.TWILIO_ACCOUNT_SID ? '✅ Configured' : '⚠️  Not configured'}`)
  console.log(`   Broadcast: hospitals(${process.env.BROADCAST_HOSPITAL_MODE || 'sms'})=${process.env.BROADCAST_HOSPITAL_SMS_MAX || 5}, helpers(sms)=${process.env.BROADCAST_HELPER_SMS_MAX || 5}, contacts(sms)=${process.env.BROADCAST_CONTACT_SMS_MAX || 3}`)
  console.log(`   OpenAI AI: ${process.env.OPENAI_API_KEY ? '✅ Connected' : '⚠️  No key (AI offline)'}`)
  console.log(`   Supabase:  ${process.env.SUPABASE_URL ? '✅ Connected' : '⚠️  No URL (demo mode)'}`)
  console.log(`   Firebase:  ${process.env.FIREBASE_DATABASE_URL ? '✅ Configured' : '⚠️  No DB URL (demo mode)'}`)
  console.log(`   Maps:      ${process.env.GOOGLE_MAPS_API_KEY ? '✅ Connected' : '⚠️  No key (demo mode)'}`)
  console.log(`   ENV:       ${process.env.NODE_ENV}\n`)
}

function startServer(preferredPort, attempt = 0) {
  const maxFallbackAttempts = process.env.NODE_ENV === 'production' ? 0 : 5
  const portToTry = preferredPort + attempt

  const server = app.listen(portToTry, () => logBoot(portToTry))

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE' && attempt < maxFallbackAttempts) {
      const nextPort = portToTry + 1
      console.warn(`[Server] Port ${portToTry} is busy. Retrying on ${nextPort}...`)
      return startServer(preferredPort, attempt + 1)
    }

    throw err
  })
}

startServer(PORT)

export default app
