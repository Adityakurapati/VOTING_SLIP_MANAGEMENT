import { getDatabase, ref, set, get, remove, update } from "firebase/database"

/**
 * Store OTP with 5 min expiry at path: otps/{phone}
 */
export async function storeOtp(phone: string, otp: string) {
  const db = getDatabase()
  const expiresAt = Date.now() + 5 * 60 * 1000 // 5 minutes
  const otpRef = ref(db, `otps/${phone}`)
  await set(otpRef, {
    otp, // NOTE: plaintext OTP; consider hashing + moving verification server-side for stronger security
    expiresAt,
    attempts: 0,
    createdAt: Date.now(),
  })
}

/**
 * Verify OTP and delete it on success or expiration.
 * Returns { valid: boolean, reason?: string }
 */
export async function verifyOtp(phone: string, otp: string): Promise<{ valid: boolean; reason?: string }> {
  const db = getDatabase()
  const otpRef = ref(db, `otps/${phone}`)
  const snapshot = await get(otpRef)

  if (!snapshot.exists()) {
    return { valid: false, reason: "no-otp" }
  }

  const data = snapshot.val() as { otp: string; expiresAt: number; attempts?: number }
  const now = Date.now()

  if (!data.expiresAt || now > data.expiresAt) {
    await remove(otpRef)
    return { valid: false, reason: "expired" }
  }

  if (data.otp !== otp) {
    // bump attempts; optionally lockout after N tries
    await update(otpRef, { attempts: (data.attempts || 0) + 1 })
    return { valid: false, reason: "mismatch" }
  }

  await remove(otpRef)
  return { valid: true }
}
