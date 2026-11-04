// Indian mobile-number validation shared by the profile, address book and checkout.
// A valid number is exactly 10 digits, starts with 6-9 (how Indian mobiles are
// issued), and isn't an obvious fake such as 9999999999 or 9876543210.

// Keep digits only, max 10 -- use as the onChange filter for phone inputs.
export function cleanPhone(value) {
  return String(value || '').replace(/\D/g, '').slice(0, 10)
}

// Returns '' when valid, otherwise a message to show the user.
export function phoneError(value) {
  const v = String(value || '').trim()
  if (!/^\d+$/.test(v)) return 'Phone number can contain digits only.'
  if (v.length !== 10) return 'Phone number must be exactly 10 digits.'
  if (!/^[6-9]/.test(v)) return 'Enter a valid mobile number (it must start with 6, 7, 8 or 9).'
  if (/^(\d)\1{9}$/.test(v) || '01234567890123456789'.includes(v) || '98765432109876543210'.includes(v)) {
    return 'Enter a real mobile number.'
  }
  return ''
}
