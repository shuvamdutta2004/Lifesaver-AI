// server/middleware/errorHandler.js
// Global Express error handler

export default function errorHandler(err, req, res, next) {
  const status = err.status || err.statusCode || 500
  const message = err.message || 'Internal server error'

  console.error(`[ERROR] ${req.method} ${req.path} — ${status}: ${message}`)

  res.status(status).json({
    error:   message,
    status,
    path:    req.path,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  })
}
