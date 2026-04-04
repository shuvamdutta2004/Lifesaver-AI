import express from 'express'
import prisma from '../lib/db.js'
import { isTwilioConfigured, normalizePhoneNumber, sendSMS } from '../lib/twilio.js'

const router = express.Router()

function getDemoNumbers() {
  const raw = (process.env.TWILIO_DEMO_NUMBERS || '').trim()
  if (!raw) return []

  return raw
    .split(',')
    .map((n) => normalizePhoneNumber(n))
    .filter(Boolean)
}

async function createOptionalNotificationLog(normalizedTo) {
  try {
    const testEvent = await prisma.sosEvent.create({
      data: {
        type: 'MEDICAL',
        status: 'RESOLVED',
        source: 'twilio-test',
      },
    })

    const log = await prisma.notificationLog.create({
      data: {
        sosEventId: testEvent.id,
        recipientPhone: normalizedTo,
        recipientType: 'TEST',
        messageType: 'SMS',
        status: 'PENDING',
      },
    })

    return { logId: log.id, eventId: testEvent.id }
  } catch {
    return null
  }
}

async function updateOptionalNotificationLog(meta, data) {
  if (!meta?.logId) return

  try {
    await prisma.notificationLog.update({
      where: { id: meta.logId },
      data,
    })
  } catch {
    // Best-effort logging only for test route.
  }
}

router.post('/test-sms', async (req, res, next) => {
  try {
    if (!isTwilioConfigured()) {
      return res.status(400).json({
        success: false,
        error: 'Twilio is not configured. Check TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER.',
      })
    }

    const { to, message } = req.body || {}
    const normalizedTo = normalizePhoneNumber(to)

    if (!normalizedTo) {
      return res.status(400).json({ success: false, error: 'A valid destination phone number is required.' })
    }

    const body = message || 'LifeSaver AI Twilio test SMS: if you receive this, the integration is working.'
    const logMeta = await createOptionalNotificationLog(normalizedTo)

    try {
      const result = await sendSMS({ to: normalizedTo, body })

      await updateOptionalNotificationLog(logMeta, {
        status: result.skipped ? 'SKIPPED' : 'SENT',
        twilioSid: result.sid || null,
        attempt: 1,
        errorMsg: result.skipped ? result.reason : null,
      })

      return res.json({
        success: true,
        mode: result.skipped ? 'skipped' : 'sent',
        to: normalizedTo,
        twilioSid: result.sid || null,
        logId: logMeta?.logId || null,
      })
    } catch (error) {
      await updateOptionalNotificationLog(logMeta, {
        status: 'FAILED',
        attempt: 1,
        errorMsg: error.message,
      })

      return res.status(500).json({
        success: false,
        error: error.message,
        to: normalizedTo,
      })
    }
  } catch (err) {
    next(err)
  }
})

router.post('/test-sms/demo', async (req, res, next) => {
  try {
    if (!isTwilioConfigured()) {
      return res.status(400).json({
        success: false,
        error: 'Twilio is not configured. Check TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER.',
      })
    }

    const demoNumbers = getDemoNumbers()
    if (demoNumbers.length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Please set at least two comma-separated numbers in TWILIO_DEMO_NUMBERS.',
      })
    }

    const { message } = req.body || {}
    const body = message || 'LifeSaver AI demo test SMS: Twilio integration is active.'
    const outcomes = []

    for (const to of demoNumbers) {
      const logMeta = await createOptionalNotificationLog(to)

      try {
        const result = await sendSMS({ to, body })

        await updateOptionalNotificationLog(logMeta, {
          status: result.skipped ? 'SKIPPED' : 'SENT',
          twilioSid: result.sid || null,
          attempt: 1,
          errorMsg: result.skipped ? result.reason : null,
        })

        outcomes.push({
          to,
          success: true,
          mode: result.skipped ? 'skipped' : 'sent',
          twilioSid: result.sid || null,
          logId: logMeta?.logId || null,
        })
      } catch (error) {
        await updateOptionalNotificationLog(logMeta, {
          status: 'FAILED',
          attempt: 1,
          errorMsg: error.message,
        })

        outcomes.push({
          to,
          success: false,
          error: error.message,
          logId: logMeta?.logId || null,
        })
      }
    }

    const successCount = outcomes.filter((o) => o.success).length
    return res.status(successCount > 0 ? 200 : 500).json({
      success: successCount > 0,
      sent: successCount,
      total: outcomes.length,
      outcomes,
    })
  } catch (err) {
    next(err)
  }
})

export default router
