// utils/smsService.ts
export const sendOTP = async (
  phoneNumber: string,
  otp: string
): Promise<{ success: boolean; message?: string }> => {
  try {
    console.log(`[OTP Service] Preparing to send OTP to ${phoneNumber}`);

    const key = process.env.key;
    const url = `https://www.fast2sms.com/dev/bulkV2?authorization=${key}&route=q&message=Your%20OTP%20is%20${otp}&numbers=${phoneNumber}&flash=0`;
    console.log(`[OTP Service] Request URL: ${url}`);

    const response = await fetch(url);
    console.log(`[OTP Service] Response status: ${response.status}`);

    const data = await response.json();
    console.log(`[OTP Service] Response data:`, data);

    if (data.return === true) {
      console.log(`[OTP Service] OTP sent successfully to ${phoneNumber}`);
      return { success: true };
    } else {
      console.error(`[OTP Service] Failed to send OTP. API response:`, data);
      return {
        success: false,
        message: data.message || "Unknown error from SMS provider",
      };
    }
  } catch (error) {
    console.error("[OTP Service] Error sending OTP:", error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Network error occurred",
    };
  }
};

export const generateOTP = (): string => {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  console.log(`[OTP Service] Generated OTP: ${otp}`);
  return otp;
};
