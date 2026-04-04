import twilio from 'twilio'

const accountSid = (process.env.TWILIO_ACCOUNT_SID || '').trim()
const authToken = (process.env.TWILIO_AUTH_TOKEN || '').trim()
const fromNumber = (process.env.TWILIO_PHONE_NUMBER || '').trim()
const defaultCountryCode = (process.env.DEFAULT_PHONE_COUNTRY_CODE || '91').trim()

const client = accountSid && authToken ? twilio(accountSid, authToken) : null

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
  return Boolean(client && fromNumber)
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
    const message = await client.messages.create({
      to: normalizedTo,
      from: fromNumber,
      body,
    })

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
    const call = await client.calls.create({
      to: normalizedTo,
      from: fromNumber,
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
