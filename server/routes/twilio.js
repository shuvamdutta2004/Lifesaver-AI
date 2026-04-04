import express from 'express'
import prisma from '../lib/db.js'
import { isTwilioConfigured, normalizePhoneNumber, sendSMS } from '../lib/twilio.js'

const router = express.Router()

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

    const log = await prisma.notificationLog.create({
      data: {
        sosEventId: 'twilio-test',
        recipientPhone: normalizedTo,
        recipientType: 'TEST',
        messageType: 'SMS',
        status: 'PENDING',
      },
    })

    try {
      const result = await sendSMS({ to: normalizedTo, body })

      const updated = await prisma.notificationLog.update({
        where: { id: log.id },
        data: {
          status: result.skipped ? 'SKIPPED' : 'SENT',
          twilioSid: result.sid || null,
          attempt: 1,
          errorMsg: result.skipped ? result.reason : null,
        },
      })

      return res.json({
        success: true,
        mode: result.skipped ? 'skipped' : 'sent',
        to: normalizedTo,
        twilioSid: result.sid || null,
        log: updated,
      })
    } catch (error) {
      await prisma.notificationLog.update({
        where: { id: log.id },
        data: {
          status: 'FAILED',
          attempt: 1,
          errorMsg: error.message,
        },
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

export default router