// Mock authentication service for development/testing
export interface MockAuthResponse {
  success: boolean
  message: string
  verificationId?: string
  error?: string
}

export interface MockVerifyResponse {
  success: boolean
  message: string
  user?: any
  error?: string
}

// Mock user database for testing
const MOCK_USERS = {
  "1234567890": {
    uid: "mock_user_1",
    phoneNumber: "+911234567890",
    fullName: "टेस्ट फील्ड एजंट",
    userType: "फील्ड एजंट",
  },
  "9876543210": {
    uid: "mock_admin_1",
    phoneNumber: "+919876543210",
    fullName: "टेस्ट प्रशासक",
    userType: "प्रशासन",
  },
  "7507546319": {
    uid: "mock_user_2",
    phoneNumber: "+917507546319",
    fullName: "टेस्ट वापरकर्ता",
    userType: "फील्ड एजंट",
  },
}

// Mock OTP storage
const mockOTPs: { [key: string]: string } = {}

// Send mock OTP
export const sendMockOTP = async (phoneNumber: string): Promise<MockAuthResponse> => {
  try {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Generate random 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString()

    // Store OTP for verification
    mockOTPs[phoneNumber] = otp

    // Log OTP for testing (remove in production)
    console.log(`Mock OTP for ${phoneNumber}: ${otp}`)

    return {
      success: true,
      message: "OTP पाठवला गेला आहे",
      verificationId: `mock_verification_${phoneNumber}`,
    }
  } catch (error) {
    return {
      success: false,
      message: "OTP पाठवताना त्रुटी आली",
      error: error.message,
    }
  }
}

// Verify mock OTP
export const verifyMockOTP = async (phoneNumber: string, otp: string): Promise<MockVerifyResponse> => {
  try {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 500))

    const storedOTP = mockOTPs[phoneNumber]

    if (!storedOTP) {
      return {
        success: false,
        message: "OTP कालबाह्य झाला किंवा सापडला नाही",
      }
    }

    if (storedOTP !== otp) {
      return {
        success: false,
        message: "चुकीचा OTP",
      }
    }

    // Clear used OTP
    delete mockOTPs[phoneNumber]

    // Return mock user data
    const mockUser = MOCK_USERS[phoneNumber] || {
      uid: `mock_user_${phoneNumber}`,
      phoneNumber: `+91${phoneNumber}`,
      fullName: "टेस्ट वापरकर्ता",
      userType: "फील्ड एजंट",
    }

    return {
      success: true,
      message: "OTP सत्यापित झाला",
      user: mockUser,
    }
  } catch (error) {
    return {
      success: false,
      message: "OTP सत्यापनात त्रुटी आली",
      error: error.message,
    }
  }
}

// Resend mock OTP
export const resendMockOTP = async (phoneNumber: string): Promise<MockAuthResponse> => {
  // Clear previous OTP
  delete mockOTPs[phoneNumber]

  // Send new OTP
  return await sendMockOTP(phoneNumber)
}
