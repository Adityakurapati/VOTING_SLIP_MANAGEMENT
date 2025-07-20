import {
  signInWithPhoneNumber,
  PhoneAuthProvider,
  signInWithCredential,
  RecaptchaVerifier,
  type ApplicationVerifier,
} from "firebase/auth"
import { auth } from "../firebaseConfig"
import { Platform } from "react-native"

export interface PhoneAuthResponse {
  success: boolean
  message: string
  verificationId?: string
  error?: string
}

export interface VerifyOTPResponse {
  success: boolean
  message: string
  user?: any
  error?: string
}

// For web/testing - you might need to implement reCAPTCHA
let recaptchaVerifier: ApplicationVerifier | null = null

// Initialize reCAPTCHA for web only
export const initializeRecaptcha = () => {
  // Only initialize reCAPTCHA for web platform
  if (Platform.OS === "web" && typeof window !== "undefined" && !recaptchaVerifier) {
    try {
      recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", {
        size: "invisible",
        callback: () => {
          console.log("reCAPTCHA solved")
        },
        "expired-callback": () => {
          console.log("reCAPTCHA expired")
        },
      })
    } catch (error) {
      console.error("Error initializing reCAPTCHA:", error)
    }
  }
  return recaptchaVerifier
}

// Send OTP using Firebase Phone Authentication
export const sendPhoneOTP = async (phoneNumber: string): Promise<PhoneAuthResponse> => {
  try {
    // Format phone number for India (+91)
    const formattedNumber = phoneNumber.startsWith("+91") ? phoneNumber : `+91${phoneNumber}`

    console.log("Sending OTP to:", formattedNumber)

    let confirmationResult

    if (Platform.OS === "web") {
      // For web, use reCAPTCHA
      const appVerifier = initializeRecaptcha()
      if (!appVerifier) {
        throw new Error("Failed to initialize reCAPTCHA")
      }
      confirmationResult = await signInWithPhoneNumber(auth, formattedNumber, appVerifier)
    } else {
      // For React Native (Android/iOS), Firebase handles verification automatically
      // Note: This might not work in Expo managed workflow
      // You might need to use Firebase React Native SDK instead
      throw new Error("Phone authentication in React Native requires @react-native-firebase/auth")
    }

    // Store confirmation result globally
    global.confirmationResult = confirmationResult

    return {
      success: true,
      message: "OTP पाठवला गेला आहे",
      verificationId: confirmationResult.verificationId,
    }
  } catch (error: any) {
    console.error("Firebase Phone Auth Error:", error)

    let errorMessage = "OTP पाठवताना त्रुटी आली"

    switch (error.code) {
      case "auth/invalid-phone-number":
        errorMessage = "अवैध मोबाईल नंबर"
        break
      case "auth/too-many-requests":
        errorMessage = "खूप जास्त प्रयत्न. कृपया नंतर प्रयत्न करा"
        break
      case "auth/quota-exceeded":
        errorMessage = "दैनिक मर्यादा संपली. कृपया उद्या प्रयत्न करा"
        break
      case "auth/captcha-check-failed":
        errorMessage = "सुरक्षा तपासणी अयशस्वी. कृपया पुन्हा प्रयत्न करा"
        break
      default:
        if (error.message.includes("prototype")) {
          errorMessage = "मोबाईल प्लॅटफॉर्मवर समर्थित नाही. कृपया वेब ब्राउझर वापरा"
        } else {
          errorMessage = error.message || "OTP पाठवताना त्रुटी आली"
        }
    }

    return {
      success: false,
      message: errorMessage,
      error: error.code || error.message,
    }
  }
}

// Verify OTP using Firebase
export const verifyPhoneOTP = async (verificationId: string, otp: string): Promise<VerifyOTPResponse> => {
  try {
    let result

    if (global.confirmationResult) {
      // Use confirmation result (recommended)
      result = await global.confirmationResult.confirm(otp)
    } else {
      // Use verification ID and OTP
      const credential = PhoneAuthProvider.credential(verificationId, otp)
      result = await signInWithCredential(auth, credential)
    }

    return {
      success: true,
      message: "OTP सत्यापित झाला",
      user: result.user,
    }
  } catch (error: any) {
    console.error("Firebase OTP Verification Error:", error)

    let errorMessage = "OTP सत्यापनात त्रुटी आली"

    switch (error.code) {
      case "auth/invalid-verification-code":
        errorMessage = "चुकीचा OTP"
        break
      case "auth/code-expired":
        errorMessage = "OTP कालबाह्य झाला"
        break
      case "auth/too-many-requests":
        errorMessage = "खूप जास्त प्रयत्न. कृपया नंतर प्रयत्न करा"
        break
      default:
        errorMessage = error.message || "OTP सत्यापनात त्रुटी आली"
    }

    return {
      success: false,
      message: errorMessage,
      error: error.code,
    }
  }
}

// Resend OTP (re-trigger phone authentication)
export const resendPhoneOTP = async (phoneNumber: string): Promise<PhoneAuthResponse> => {
  // Clear previous confirmation result
  global.confirmationResult = null

  // Send new OTP
  return await sendPhoneOTP(phoneNumber)
}

// Sign out user
export const signOutUser = async (): Promise<boolean> => {
  try {
    await auth.signOut()
    global.confirmationResult = null
    return true
  } catch (error) {
    console.error("Sign out error:", error)
    return false
  }
}
