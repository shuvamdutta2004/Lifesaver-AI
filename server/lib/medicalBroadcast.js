import prisma from './db.js'
import { isTwilioConfigured, normalizePhoneNumber, sendCall, sendSMS } from './twilio.js'

const queue = []
const scheduledEventIds = new Set()
let isProcessing = false

const HOSPITAL_SMS_MAX = Math.max(1, Number(process.env.BROADCAST_HOSPITAL_SMS_MAX || 5))
const HOSPITAL_NOTIFY_MODE = String(process.env.BROADCAST_HOSPITAL_MODE || 'sms').toLowerCase()
const HELPER_SMS_MAX = Math.max(0, Number(process.env.BROADCAST_HELPER_SMS_MAX || 5))
const CONTACT_SMS_MAX = Math.max(0, Number(process.env.BROADCAST_CONTACT_SMS_MAX || 3))

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function haversineMeters(lat1, lng1, lat2, lng2) {
  const R = 6371000
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function buildMedicalMessage(event, hospital, mode = 'sms') {
  const lat = Number(event.lat).toFixed(4)
  const lng = Number(event.lng).toFixed(4)
  if (mode === 'call') {
    return `Medical emergency near latitude ${lat}, longitude ${lng}. Please respond or contact the SOS caller immediately.`
  }

  return `MEDICAL EMERGENCY near ${lat}, ${lng}. Hospital: ${hospital.name}. Please respond immediately. SOS ID: ${event.id}`
}

function buildHelperSmsMessage(event) {
  const lat = Number(event.lat).toFixed(4)
  const lng = Number(event.lng).toFixed(4)
  return `MEDICAL SOS near ${lat}, ${lng}. If available, please assist immediately. SOS ID: ${event.id}`
}

function buildEmergencyContactSmsMessage(event) {
  const lat = Number(event.lat).toFixed(4)
  const lng = Number(event.lng).toFixed(4)
  return `Emergency alert: a medical SOS was triggered near ${lat}, ${lng}. Please check on the user immediately. SOS ID: ${event.id}`
}

function isLikelySmsCapable(phone) {
  if (!phone || !phone.startsWith('+')) return false

  const digits = phone.replace(/\D/g, '')

  // India mobile numbers are +91 followed by 10 digits starting with 6-9.
  if (digits.startsWith('91') && digits.length === 12) {
    return /^[6-9]\d{9}$/.test(digits.slice(2))
  }

  return true
}

function formatError(error) {
  const code = error?.code || error?.status || error?.response?.status
  const message = error?.message || String(error)
  return code ? `[${code}] ${message}` : message
}

async function logNotification({ eventId, phone, recipientType, messageType, status = 'PENDING', attempt = 0, twilioSid = null, errorMsg = null }) {
  return prisma.notificationLog.create({
    data: {
      sosEventId: eventId,
      recipientPhone: phone,
      recipientType,
      messageType,
      status,
      attempt,
      twilioSid,
      errorMsg,
    },
  })
}

async function updateNotification(id, data) {
  return prisma.notificationLog.update({
    where: { id },
    data,
  })
}

async function sendWithRetry(sendFn, maxAttempts = 3) {
  let lastError = null

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return { result: await sendFn(), attempt }
    } catch (error) {
      lastError = error
      if (attempt === maxAttempts) break
      await sleep(Math.min(2000 * attempt, 8000))
    }
  }

  throw lastError
}

async function selectHospitals(lat, lng) {
  const hospitals = await prisma.hospital.findMany({
    where: {
      phone: { not: '' },
    },
  })

  const uniqueByPhone = new Map()

  for (const hospital of hospitals) {
    const normalizedPhone = normalizePhoneNumber(hospital.phone)
    if (!normalizedPhone) continue

    const distanceMeters = Number.isFinite(lat) && Number.isFinite(lng)
      ? haversineMeters(lat, lng, hospital.lat, hospital.lng)
      : Number.MAX_SAFE_INTEGER

    const existing = uniqueByPhone.get(normalizedPhone)
    const candidate = {
      ...hospital,
      phone: normalizedPhone,
      distanceMeters,
    }

    if (!existing || candidate.distanceMeters < existing.distanceMeters) {
      uniqueByPhone.set(normalizedPhone, candidate)
    }
  }

  return [...uniqueByPhone.values()]
    .filter((hospital) => hospital.open24h !== false)
    .sort((a, b) => {
      if (a.distanceMeters !== b.distanceMeters) return a.distanceMeters - b.distanceMeters
      return (b.beds || 0) - (a.beds || 0)
    })
}

async function selectHelpers(lat, lng) {
  const helpers = await prisma.helper.findMany({
    where: {
      available: true,
      phone: { not: '' },
    },
  })

  const uniqueByPhone = new Map()

  for (const helper of helpers) {
    const normalizedPhone = normalizePhoneNumber(helper.phone)
    if (!normalizedPhone) continue

    const distanceMeters =
      Number.isFinite(lat) && Number.isFinite(lng) && Number.isFinite(helper.lat) && Number.isFinite(helper.lng)
        ? haversineMeters(lat, lng, helper.lat, helper.lng)
        : Number.MAX_SAFE_INTEGER

    const existing = uniqueByPhone.get(normalizedPhone)
    const candidate = {
      ...helper,
      phone: normalizedPhone,
      distanceMeters,
    }

    if (!existing || candidate.distanceMeters < existing.distanceMeters) {
      uniqueByPhone.set(normalizedPhone, candidate)
    }
  }

  return [...uniqueByPhone.values()].sort((a, b) => a.distanceMeters - b.distanceMeters)
}

async function selectEmergencyContacts(userId) {
  if (!userId) return []

  const contacts = await prisma.emergencyContact.findMany({
    where: {
      userId,
      phone: { not: '' },
    },
  })

  const uniqueByPhone = new Map()

  for (const contact of contacts) {
    const normalizedPhone = normalizePhoneNumber(contact.phone)
    if (!normalizedPhone) continue
    if (!uniqueByPhone.has(normalizedPhone)) {
      uniqueByPhone.set(normalizedPhone, {
        ...contact,
        phone: normalizedPhone,
      })
    }
  }

  return [...uniqueByPhone.values()]
}

async function sendSmsRecipients({ event, recipients, recipientType, messageBuilder }) {
  for (const recipient of recipients) {
    if (!isLikelySmsCapable(recipient.phone)) {
      await logNotification({
        eventId: event.id,
        phone: recipient.phone,
        recipientType,
        messageType: 'SMS',
        status: 'SKIPPED',
        errorMsg: 'Likely non-SMS number.',
      })
      continue
    }

    const smsLog = await logNotification({
      eventId: event.id,
      phone: recipient.phone,
      recipientType,
      messageType: 'SMS',
    })

    try {
      const { result, attempt } = await sendWithRetry(() =>
        sendSMS({
          to: recipient.phone,
          body: messageBuilder(event, recipient),
        }),
      )

      await updateNotification(smsLog.id, {
        status: result.skipped ? 'SKIPPED' : 'SENT',
        attempt,
        twilioSid: result.sid || null,
        errorMsg: result.skipped ? result.reason : null,
      })
    } catch (error) {
      await updateNotification(smsLog.id, {
        status: 'FAILED',
        attempt: 3,
        errorMsg: formatError(error),
      })
    }

    await sleep(500)
  }
}

async function sendCallRecipients({ event, recipients, recipientType, messageBuilder }) {
  for (const recipient of recipients) {
    const callLog = await logNotification({
      eventId: event.id,
      phone: recipient.phone,
      recipientType,
      messageType: 'CALL',
    })

    try {
      const { result, attempt } = await sendWithRetry(() =>
        sendCall({
          to: recipient.phone,
          message: messageBuilder(event, recipient),
        }),
      )

      await updateNotification(callLog.id, {
        status: result.skipped ? 'SKIPPED' : 'SENT',
        attempt,
        twilioSid: result.sid || null,
        errorMsg: result.skipped ? result.reason : null,
      })
    } catch (error) {
      await updateNotification(callLog.id, {
        status: 'FAILED',
        attempt: 3,
        errorMsg: formatError(error),
      })
    }

    await sleep(1000)
  }
}

async function processMedicalJob(job) {
  const { sosEventId, lat, lng } = job

  if (!sosEventId) return

  const event = await prisma.sosEvent.findUnique({ where: { id: sosEventId } })
  if (!event) {
    console.warn(`[Broadcast] Skipping medical broadcast for missing SosEvent ${sosEventId}`)
    return
  }

  const hospitals = (await selectHospitals(lat, lng)).slice(0, HOSPITAL_SMS_MAX)
  const helpers = (await selectHelpers(lat, lng)).slice(0, HELPER_SMS_MAX)
  const emergencyContacts = (await selectEmergencyContacts(event.userId)).slice(0, CONTACT_SMS_MAX)

  if (hospitals.length === 0 && helpers.length === 0 && emergencyContacts.length === 0) {
    await logNotification({
      eventId: sosEventId,
      phone: 'n/a',
      recipientType: 'SYSTEM',
      messageType: 'SMS',
      status: 'SKIPPED',
      errorMsg: 'No eligible recipients found',
    })
    return
  }

  if (HOSPITAL_NOTIFY_MODE === 'call') {
    await sendCallRecipients({
      event,
      recipients: hospitals,
      recipientType: 'HOSPITAL',
      messageBuilder: (evt, hospital) => buildMedicalMessage(evt, hospital, 'call'),
    })
  } else {
    await sendSmsRecipients({
      event,
      recipients: hospitals,
      recipientType: 'HOSPITAL',
      messageBuilder: (evt, hospital) => buildMedicalMessage(evt, hospital, 'sms'),
    })
  }

  await sendSmsRecipients({
    event,
    recipients: helpers,
    recipientType: 'HELPER',
    messageBuilder: (evt) => buildHelperSmsMessage(evt),
  })

  await sendSmsRecipients({
    event,
    recipients: emergencyContacts,
    recipientType: 'EMERGENCY_CONTACT',
    messageBuilder: (evt) => buildEmergencyContactSmsMessage(evt),
  })
}

async function drainQueue() {
  if (isProcessing) return
  isProcessing = true

  while (queue.length > 0) {
    const job = queue.shift()

    try {
      await processMedicalJob(job)
    } catch (error) {
      console.error('[Broadcast] Job failed:', error.message)
    } finally {
      if (job?.sosEventId) scheduledEventIds.delete(job.sosEventId)
    }
  }

  isProcessing = false
}

export function enqueueMedicalBroadcast(job) {
  if (!job?.sosEventId) return { queued: false, reason: 'missing_sos_event_id' }
  if (scheduledEventIds.has(job.sosEventId)) {
    return { queued: false, reason: 'already_queued' }
  }

  scheduledEventIds.add(job.sosEventId)
  queue.push(job)
  void drainQueue()

  return { queued: true }
}
