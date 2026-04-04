import twilio from 'twilio'

const accountSid = (process.env.TWILIO_ACCOUNT_SID || '').trim()
const authToken = (process.env.TWILIO_AUTH_TOKEN || '').trim()
const fromNumber = (process.env.TWILIO_PHONE_NUMBER || '').trim()
const defaultCountryCode = (process.env.DEFAULT_PHONE_COUNTRY_CODE || '91').trim()

const client = accountSid && authToken ? twilio(accountSid, authToken) : null
let cachedAccountFromNumber = null
let cachedPreferredFromNumber = null
let didWarnSenderMismatch = false

function stripToDigits(value = '') {
  return String(value).replace(/\D/g, '')
}

function escapeXml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

export function isTwilioConfigured() {
  return Boolean(client)
}

function isFromNumberMismatchError(error) {
  const code = Number(error?.code || 0)
  const message = String(error?.message || '').toLowerCase()
  return code === 21606 || message.includes("mismatch between the 'from' number")
}

async function resolveAccountOwnedFromNumber({ forceRefresh = false } = {}) {
  if (!client) return null
  if (cachedAccountFromNumber && !forceRefresh) return cachedAccountFromNumber

  try {
    const incomingNumbers = await client.incomingPhoneNumbers.list({ limit: 1 })
    const discovered = incomingNumbers?.[0]?.phoneNumber || null
    cachedAccountFromNumber = discovered
    return discovered
  } catch {
    return null
  }
}

function samePhone(a, b) {
  const n1 = normalizePhoneNumber(a)
  const n2 = normalizePhoneNumber(b)
  return Boolean(n1 && n2 && n1 === n2)
}

async function resolveFromNumber({ forceRefresh = false } = {}) {
  if (cachedPreferredFromNumber && !forceRefresh) {
    return cachedPreferredFromNumber
  }

  const accountOwnedFrom = await resolveAccountOwnedFromNumber({ forceRefresh })

  if (!fromNumber) {
    cachedPreferredFromNumber = accountOwnedFrom
    return cachedPreferredFromNumber
  }

  if (!accountOwnedFrom) {
    cachedPreferredFromNumber = fromNumber
    return cachedPreferredFromNumber
  }

  if (samePhone(fromNumber, accountOwnedFrom)) {
    cachedPreferredFromNumber = fromNumber
    return cachedPreferredFromNumber
  }

  cachedPreferredFromNumber = accountOwnedFrom

  if (!didWarnSenderMismatch) {
    console.warn(
      `[Twilio] TWILIO_PHONE_NUMBER ${fromNumber} does not belong to this account. Using ${accountOwnedFrom} instead.`,
    )
    didWarnSenderMismatch = true
  }

  return cachedPreferredFromNumber
}

export function normalizePhoneNumber(rawPhone) {
  if (!rawPhone) return null

  const phone = String(rawPhone).trim()
  if (phone.startsWith('+')) {
    const digits = stripToDigits(phone)
    return digits ? `+${digits}` : null
  }

  const digits = stripToDigits(phone)
  if (!digits) return null

  if (digits.startsWith(defaultCountryCode) && digits.length >= 12) {
    return `+${digits}`
  }

  if (digits.startsWith('0') && digits.length >= 11) {
    return `+${defaultCountryCode}${digits.slice(1)}`
  }

  if (digits.length === 10) {
    return `+${defaultCountryCode}${digits}`
  }

  return `+${digits}`
}

async function executeIfConfigured(actionName, runner) {
  if (!isTwilioConfigured()) {
    return { skipped: true, reason: 'twilio_not_configured', action: actionName }
  }
  return runner()
}

export async function sendSMS({ to, body }) {
  const normalizedTo = normalizePhoneNumber(to)
  if (!normalizedTo) {
    throw new Error(`Invalid phone number: ${to}`)
  }

  return executeIfConfigured('sms', async () => {
    const primaryFrom = await resolveFromNumber()
    if (!primaryFrom) {
      throw new Error('Twilio sender number unavailable. Set TWILIO_PHONE_NUMBER or add a Twilio incoming number.')
    }

    let message

    try {
      message = await client.messages.create({
        to: normalizedTo,
        from: primaryFrom,
        body,
      })
    } catch (error) {
      if (!isFromNumberMismatchError(error)) throw error

      const fallbackFrom = await resolveFromNumber({ forceRefresh: true })
      if (!fallbackFrom || fallbackFrom === primaryFrom) throw error

      message = await client.messages.create({
        to: normalizedTo,
        from: fallbackFrom,
        body,
      })
    }

    return {
      skipped: false,
      sid: message.sid,
      status: message.status,
      to: normalizedTo,
    }
  })
}

export async function sendCall({ to, message }) {
  const normalizedTo = normalizePhoneNumber(to)
  if (!normalizedTo) {
    throw new Error(`Invalid phone number: ${to}`)
  }

  const safeMessage = escapeXml(message)

  return executeIfConfigured('call', async () => {
    const resolvedFrom = await resolveFromNumber()
    if (!resolvedFrom) {
      throw new Error('Twilio caller number unavailable. Set TWILIO_PHONE_NUMBER or add a Twilio incoming number.')
    }

    const call = await client.calls.create({
      to: normalizedTo,
      from: resolvedFrom,
      twiml: `<Response><Say voice="alice">${safeMessage}</Say></Response>`,
    })

    return {
      skipped: false,
      sid: call.sid,
      status: call.status,
      to: normalizedTo,
    }
  })
}
