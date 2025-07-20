"use client"

import { useState, useEffect } from "react"
import { __DEV__ } from "react-native" // Import __DEV__ variable
import {
        View,
        Text,
        TextInput,
        TouchableOpacity,
        StyleSheet,
        SafeAreaView,
        Image,
        Alert,
        StatusBar,
        ActivityIndicator,
        Platform,
} from "react-native"
import { getDatabase, ref, push, set, update, get } from "firebase/database"
import { sendPhoneOTP, verifyPhoneOTP, resendPhoneOTP } from "../services/phoneAuthService"
import { sendMockOTP, verifyMockOTP, resendMockOTP } from "../services/mockAuthService"
import { auth } from "../firebaseConfig"

const LoginScreen = ({ navigation }) => {
        const [mobileNumber, setMobileNumber] = useState("")
        const [otp, setOtp] = useState("")
        const [userType, setUserType] = useState("फील्ड एजंट")
        const [loading, setLoading] = useState(false)
        const [otpSent, setOtpSent] = useState(false)
        const [resendLoading, setResendLoading] = useState(false)
        const [countdown, setCountdown] = useState(0)
        const [verificationId, setVerificationId] = useState("")
        const [useMockAuth, setUseMockAuth] = useState(Platform.OS !== "web") // Use mock for mobile, real for web
        const database = getDatabase()

        // Countdown timer for resend OTP
        useEffect(() => {
                let interval = null
                if (countdown > 0) {
                        interval = setInterval(() => {
                                setCountdown(countdown - 1)
                        }, 1000)
                } else if (countdown === 0) {
                        clearInterval(interval)
                }
                return () => clearInterval(interval)
        }, [countdown])

        const createUserSession = async (userId, phone, actualUserType) => {
                try {
                        const sessionId = push(ref(database, `users/${userId}/sessions`)).key
                        const loginTime = new Date().toISOString()

                        // Create session record
                        await set(ref(database, `users/${userId}/sessions/${sessionId}`), {
                                loginTime,
                                logoutTime: null,
                        })

                        // Update user info
                        await update(ref(database, `users/${userId}`), {
                                phone,
                                currentSession: sessionId,
                                lastLogin: loginTime,
                                userType: actualUserType,
                        })

                        return sessionId
                } catch (error) {
                        console.error("Error creating session:", error)
                        throw error
                }
        }

        const validateUserRole = async (userId, selectedUserType) => {
                try {
                        const userRef = ref(database, `users/${userId}`)
                        const snapshot = await get(userRef)

                        if (snapshot.exists()) {
                                const userData = snapshot.val()
                                const actualUserType = userData.userType

                                // If user selected admin but their role is not admin
                                if (selectedUserType === "प्रशासन" && actualUserType !== "प्रशासन") {
                                        return {
                                                isValid: false,
                                                message: "तुम्ही प्रशासक नाही. कृपया योग्य प्रशासक क्रेडेंशियल्सने लॉगिन करा.",
                                                actualUserType,
                                        }
                                }

                                // If user selected field agent but their role is admin
                                if (selectedUserType === "फील्ड एजंट" && actualUserType === "प्रशासन") {
                                        return {
                                                isValid: false,
                                                message: "तुम्ही प्रशासक आहात. कृपया प्रशासन म्हणून लॉगिन करा.",
                                                actualUserType,
                                        }
                                }

                                return {
                                        isValid: true,
                                        actualUserType,
                                }
                        } else {
                                return {
                                        isValid: false,
                                        message: "वापरकर्ता सापडला नाही",
                                        actualUserType: null,
                                }
                        }
                } catch (error) {
                        console.error("Error validating user role:", error)
                        return {
                                isValid: false,
                                message: "वापरकर्ता माहिती तपासताना त्रुटी आली",
                                actualUserType: null,
                        }
                }
        }

        const handleSendOTP = async () => {
                if (!mobileNumber) {
                        Alert.alert("त्रुटी", "कृपया मोबाईल नंबर भरा")
                        return
                }

                if (mobileNumber.length !== 10) {
                        Alert.alert("त्रुटी", "कृपया वैध 10 अंकी मोबाईल नंबर भरा")
                        return
                }

                setLoading(true)
                try {
                        let response

                        if (useMockAuth) {
                                response = await sendMockOTP(mobileNumber)
                        } else {
                                response = await sendPhoneOTP(mobileNumber)
                        }

                        if (response.success) {
                                setOtpSent(true)
                                setCountdown(60) // 60 seconds countdown for resend
                                setVerificationId(response.verificationId || "")
                                Alert.alert("यशस्वी", response.message)

                                // Show OTP in console for mock auth
                                if (useMockAuth) {
                                        Alert.alert("डेव्हलपमेंट मोड", `OTP कन्सोलमध्ये पहा किंवा 123456 वापरा`)
                                }
                        } else {
                                Alert.alert("त्रुटी", response.message)
                        }
                } catch (error) {
                        console.error("Send OTP error:", error)
                        Alert.alert("त्रुटी", "OTP पाठवताना त्रुटी आली")
                } finally {
                        setLoading(false)
                }
        }

        const handleResendOTP = async () => {
                if (countdown > 0) return

                setResendLoading(true)
                try {
                        let response

                        if (useMockAuth) {
                                response = await resendMockOTP(mobileNumber)
                        } else {
                                response = await resendPhoneOTP(mobileNumber)
                        }

                        if (response.success) {
                                setCountdown(60)
                                setVerificationId(response.verificationId || "")
                                Alert.alert("यशस्वी", response.message)

                                // Show OTP in console for mock auth
                                if (useMockAuth) {
                                        Alert.alert("डेव्हलपमेंट मोड", `नवा OTP कन्सोलमध्ये पहा किंवा 123456 वापरा`)
                                }
                        } else {
                                Alert.alert("त्रुटी", response.message)
                        }
                } catch (error) {
                        console.error("Resend OTP error:", error)
                        Alert.alert("त्रुटी", "OTP पुन्हा पाठवताना त्रुटी आली")
                } finally {
                        setResendLoading(false)
                }
        }

        const handleVerifyOTP = async () => {
                if (!otp) {
                        Alert.alert("त्रुटी", "कृपया OTP भरा")
                        return
                }

                if (otp.length !== 6) {
                        Alert.alert("त्रुटी", "कृपया 6 अंकी OTP भरा")
                        return
                }

                setLoading(true)
                try {
                        let otpResponse

                        if (useMockAuth) {
                                // For mock auth, allow 123456 as universal OTP
                                if (otp === "123456") {
                                        otpResponse = await verifyMockOTP(mobileNumber, otp)
                                } else {
                                        otpResponse = await verifyMockOTP(mobileNumber, otp)
                                }
                        } else {
                                otpResponse = await verifyPhoneOTP(verificationId, otp)
                        }

                        if (!otpResponse.success) {
                                Alert.alert("त्रुटी", otpResponse.message)
                                setLoading(false)
                                return
                        }

                        const firebaseUser = otpResponse.user

                        if (useMockAuth) {
                                // For mock auth, create/update user in database
                                const userId = firebaseUser.uid
                                const userRef = ref(database, `users/${userId}`)
                                const snapshot = await get(userRef)

                                if (!snapshot.exists()) {
                                        // Create mock user in database
                                        await set(userRef, {
                                                fullName: firebaseUser.fullName,
                                                phone: mobileNumber,
                                                userType: firebaseUser.userType,
                                                phoneNumber: firebaseUser.phoneNumber,
                                                createdAt: new Date().toISOString(),
                                                currentSession: null,
                                                lastLogin: null,
                                                lastLogout: null,
                                                sessions: {},
                                        })
                                }

                                // Create session and navigate
                                await createUserSession(userId, mobileNumber, firebaseUser.userType)

                                // Navigate based on user type
                                if (firebaseUser.userType === "प्रशासन") {
                                        navigation.reset({
                                                index: 0,
                                                routes: [{ name: "Admin" }],
                                        })
                                } else {
                                        navigation.reset({
                                                index: 0,
                                                routes: [{ name: "FieldAgent" }],
                                        })
                                }
                        } else {
                                // Real Firebase auth flow
                                const userRef = ref(database, `users/${firebaseUser.uid}`)
                                const snapshot = await get(userRef)

                                if (!snapshot.exists()) {
                                        Alert.alert("खाते सापडले नाही", "हा मोबाईल नंबर नोंदणीकृत नाही. कृपया प्रथम नोंदणी करा.", [
                                                {
                                                        text: "नोंदणी करा",
                                                        onPress: () => navigation.navigate("Register"),
                                                },
                                                {
                                                        text: "रद्द करा",
                                                        style: "cancel",
                                                },
                                        ])
                                        setLoading(false)
                                        return
                                }

                                // Validate user role
                                const roleValidation = await validateUserRole(firebaseUser.uid, userType)

                                if (!roleValidation.isValid) {
                                        await auth.signOut()
                                        Alert.alert("प्रवेश नाकारला", roleValidation.message)
                                        setLoading(false)
                                        return
                                }

                                // Create session and navigate
                                await createUserSession(firebaseUser.uid, mobileNumber, roleValidation.actualUserType)

                                if (roleValidation.actualUserType === "प्रशासन") {
                                        navigation.reset({
                                                index: 0,
                                                routes: [{ name: "Admin" }],
                                        })
                                } else {
                                        navigation.reset({
                                                index: 0,
                                                routes: [{ name: "FieldAgent" }],
                                        })
                                }
                        }
                } catch (error) {
                        console.error("Login error:", error)
                        Alert.alert("त्रुटी", "लॉगिन करताना त्रुटी आली")
                } finally {
                        setLoading(false)
                }
        }

        const handleEditNumber = () => {
                setOtpSent(false)
                setOtp("")
                setCountdown(0)
                setVerificationId("")
        }

        return (
                <SafeAreaView style={styles.container}>
                        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

                        {/* Add reCAPTCHA container for web */}
                        {Platform.OS === "web" && <div id="recaptcha-container" style={{ display: "none" }}></div>}

                        <View style={styles.content}>
                                {/* Celebration Image */}
                                <View style={styles.imageContainer}>
                                        <Image source={require("../assets/hero.jpg")} style={styles.celebrationImage} resizeMode="contain" />
                                </View>

                                {/* Title */}
                                <Text style={styles.title}>पुणे जिल्हा परिषद निवडणूका 2025</Text>

                                {/* Auth Mode Toggle (Development) */}
                                {__DEV__ && (
                                        <View style={styles.authModeContainer}>
                                                <TouchableOpacity
                                                        style={[styles.authModeButton, useMockAuth && styles.authModeButtonActive]}
                                                        onPress={() => setUseMockAuth(true)}
                                                >
                                                        <Text style={[styles.authModeText, useMockAuth && styles.authModeTextActive]}>Mock Auth</Text>
                                                </TouchableOpacity>
                                                <TouchableOpacity
                                                        style={[styles.authModeButton, !useMockAuth && styles.authModeButtonActive]}
                                                        onPress={() => setUseMockAuth(false)}
                                                >
                                                        <Text style={[styles.authModeText, !useMockAuth && styles.authModeTextActive]}>Firebase Auth</Text>
                                                </TouchableOpacity>
                                        </View>
                                )}

                                {/* User Type Selection */}
                                <View style={styles.userTypeContainer}>
                                        <TouchableOpacity
                                                style={[styles.userTypeButton, userType === "फील्ड एजंट" && styles.userTypeButtonActive]}
                                                onPress={() => setUserType("फील्ड एजंट")}
                                                activeOpacity={0.7}
                                                disabled={loading || resendLoading}
                                        >
                                                <Text style={[styles.userTypeText, userType === "फील्ड एजंट" && styles.userTypeTextActive]}>फील्ड एजंट</Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                                style={[styles.userTypeButton, userType === "प्रशासन" && styles.userTypeButtonActive]}
                                                onPress={() => setUserType("प्रशासन")}
                                                activeOpacity={0.7}
                                                disabled={loading || resendLoading}
                                        >
                                                <Text style={[styles.userTypeText, userType === "प्रशासन" && styles.userTypeTextActive]}>प्रशासन</Text>
                                        </TouchableOpacity>
                                </View>

                                {/* Input Fields */}
                                <View style={styles.inputContainer}>
                                        {/* Mobile Number Input */}
                                        <View style={styles.mobileInputContainer}>
                                                <TextInput
                                                        style={[styles.input, otpSent && styles.inputDisabled]}
                                                        placeholder="मोबाईल नंबर"
                                                        placeholderTextColor="#9CA3AF"
                                                        value={mobileNumber}
                                                        onChangeText={setMobileNumber}
                                                        keyboardType="phone-pad"
                                                        maxLength={10}
                                                        editable={!otpSent && !loading && !resendLoading}
                                                />
                                                {otpSent && (
                                                        <TouchableOpacity
                                                                style={styles.editButton}
                                                                onPress={handleEditNumber}
                                                                disabled={loading || resendLoading}
                                                        >
                                                                <Text style={styles.editButtonText}>बदला</Text>
                                                        </TouchableOpacity>
                                                )}
                                        </View>

                                        {/* OTP Input - Only show when OTP is sent */}
                                        {otpSent && (
                                                <TextInput
                                                        style={styles.input}
                                                        placeholder="6 अंकी OTP एंटर करा"
                                                        placeholderTextColor="#9CA3AF"
                                                        value={otp}
                                                        onChangeText={setOtp}
                                                        keyboardType="number-pad"
                                                        maxLength={6}
                                                        editable={!loading && !resendLoading}
                                                />
                                        )}
                                </View>

                                {/* Action Buttons */}
                                {!otpSent ? (
                                        // Send OTP Button
                                        <TouchableOpacity
                                                style={[styles.loginButton, loading && styles.loginButtonDisabled]}
                                                onPress={handleSendOTP}
                                                activeOpacity={0.8}
                                                disabled={loading}
                                        >
                                                {loading ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.loginButtonText}>OTP पाठवा</Text>}
                                        </TouchableOpacity>
                                ) : (
                                        // Verify OTP and Resend buttons
                                        <>
                                                <TouchableOpacity
                                                        style={[styles.loginButton, loading && styles.loginButtonDisabled]}
                                                        onPress={handleVerifyOTP}
                                                        activeOpacity={0.8}
                                                        disabled={loading || resendLoading}
                                                >
                                                        {loading ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.loginButtonText}>लॉगिन करा</Text>}
                                                </TouchableOpacity>

                                                {/* Resend OTP Button */}
                                                <TouchableOpacity
                                                        style={[styles.resendButton, (countdown > 0 || resendLoading) && styles.resendButtonDisabled]}
                                                        onPress={handleResendOTP}
                                                        activeOpacity={0.7}
                                                        disabled={countdown > 0 || resendLoading || loading}
                                                >
                                                        {resendLoading ? (
                                                                <ActivityIndicator color="#3B82F6" />
                                                        ) : (
                                                                <Text style={[styles.resendButtonText, countdown > 0 && styles.resendButtonTextDisabled]}>
                                                                        {countdown > 0 ? `OTP पुन्हा पाठवा (${countdown}s)` : "OTP पुन्हा पाठवा"}
                                                                </Text>
                                                        )}
                                                </TouchableOpacity>
                                        </>
                                )}

                                {/* Register Button */}
                                <TouchableOpacity
                                        style={styles.registerButton}
                                        onPress={() => navigation.navigate("Register")}
                                        activeOpacity={0.7}
                                        disabled={loading || resendLoading}
                                >
                                        <Text style={styles.registerButtonText}>खाते नाहीये का? आता नोंदणी करा.</Text>
                                </TouchableOpacity>

                                {/* Demo Credentials Info */}
                                <View style={styles.demoInfo}>
                                        <Text style={styles.demoTitle}>डेमो क्रेडेंशियल्स:</Text>
                                        <Text style={styles.demoText}>फील्ड एजंट: 1234567890</Text>
                                        <Text style={styles.demoText}>प्रशासन: 9876543210</Text>
                                        <Text style={styles.demoText}>तुमचा नंबर: 7507546319</Text>
                                        <Text style={styles.demoSubText}>
                                                * {useMockAuth ? "Mock Auth" : "Firebase Auth"} - OTP: 123456 (डेव्हलपमेंट)
                                        </Text>
                                </View>

                                {/* OTP Instructions */}
                                {otpSent && (
                                        <View style={styles.otpInfo}>
                                                <Text style={styles.otpInfoText}>
                                                        {mobileNumber} वर OTP पाठवला गेला आहे {useMockAuth && "(Mock Mode)"}
                                                </Text>
                                                <Text style={styles.otpInfoSubText}>
                                                        {useMockAuth ? "डेव्हलपमेंट मोड: कन्सोल पहा किंवा 123456 वापरा" : "OTP प्राप्त होण्यासाठी काही मिनिटे वाट पहा"}
                                                </Text>
                                        </View>
                                )}
                        </View>
                </SafeAreaView>
        )
}

const styles = StyleSheet.create({
        container: {
                flex: 1,
                backgroundColor: "#ffffff",
        },
        content: {
                flex: 1,
                paddingHorizontal: 24,
                paddingTop: 40,
                paddingBottom: 32,
        },
        imageContainer: {
                alignItems: "center",
                marginBottom: 32,
                paddingTop: 20,
        },
        celebrationImage: {
                width: 200,
                height: 160,
        },
        title: {
                fontSize: 24,
                fontWeight: "700",
                color: "#1F2937",
                textAlign: "center",
                marginBottom: 40,
                lineHeight: 32,
        },
        authModeContainer: {
                flexDirection: "row",
                marginBottom: 16,
                backgroundColor: "#FEF3C7",
                borderRadius: 8,
                padding: 4,
        },
        authModeButton: {
                flex: 1,
                paddingVertical: 8,
                paddingHorizontal: 12,
                borderRadius: 4,
                alignItems: "center",
        },
        authModeButtonActive: {
                backgroundColor: "#F59E0B",
        },
        authModeText: {
                fontSize: 12,
                fontWeight: "500",
                color: "#92400E",
        },
        authModeTextActive: {
                color: "#ffffff",
        },
        userTypeContainer: {
                flexDirection: "row",
                marginBottom: 32,
                backgroundColor: "#F3F4F6",
                borderRadius: 12,
                padding: 4,
        },
        userTypeButton: {
                flex: 1,
                paddingVertical: 12,
                paddingHorizontal: 16,
                borderRadius: 8,
                alignItems: "center",
                justifyContent: "center",
        },
        userTypeButtonActive: {
                backgroundColor: "#374151",
                shadowColor: "#000",
                shadowOffset: {
                        width: 0,
                        height: 2,
                },
                shadowOpacity: 0.1,
                shadowRadius: 3,
                elevation: 3,
        },
        userTypeText: {
                fontSize: 16,
                fontWeight: "600",
                color: "#6B7280",
        },
        userTypeTextActive: {
                color: "#ffffff",
        },
        inputContainer: {
                marginBottom: 24,
        },
        mobileInputContainer: {
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 16,
        },
        input: {
                backgroundColor: "#F9FAFB",
                borderWidth: 1,
                borderColor: "#E5E7EB",
                borderRadius: 12,
                paddingHorizontal: 16,
                paddingVertical: 16,
                fontSize: 16,
                color: "#1F2937",
                fontWeight: "400",
                flex: 1,
        },
        inputDisabled: {
                backgroundColor: "#F3F4F6",
                color: "#6B7280",
        },
        editButton: {
                marginLeft: 12,
                backgroundColor: "#3B82F6",
                paddingHorizontal: 16,
                paddingVertical: 12,
                borderRadius: 8,
        },
        editButtonText: {
                color: "#ffffff",
                fontSize: 14,
                fontWeight: "600",
        },
        loginButton: {
                backgroundColor: "#3B82F6",
                borderRadius: 12,
                paddingVertical: 16,
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 16,
                shadowColor: "#3B82F6",
                shadowOffset: {
                        width: 0,
                        height: 4,
                },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 8,
        },
        loginButtonDisabled: {
                backgroundColor: "#9CA3AF",
        },
        loginButtonText: {
                color: "#ffffff",
                fontSize: 18,
                fontWeight: "600",
        },
        resendButton: {
                backgroundColor: "transparent",
                borderWidth: 1,
                borderColor: "#3B82F6",
                borderRadius: 12,
                paddingVertical: 12,
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 16,
        },
        resendButtonDisabled: {
                borderColor: "#9CA3AF",
        },
        resendButtonText: {
                color: "#3B82F6",
                fontSize: 16,
                fontWeight: "500",
        },
        resendButtonTextDisabled: {
                color: "#9CA3AF",
        },
        registerButton: {
                backgroundColor: "#9CA3AF",
                borderRadius: 12,
                paddingVertical: 16,
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 20,
        },
        registerButtonText: {
                color: "#ffffff",
                fontSize: 16,
                fontWeight: "500",
        },
        demoInfo: {
                backgroundColor: "#F0F9FF",
                borderRadius: 12,
                padding: 16,
                borderLeftWidth: 4,
                borderLeftColor: "#3B82F6",
                marginBottom: 16,
        },
        demoTitle: {
                fontSize: 14,
                fontWeight: "600",
                color: "#1F2937",
                marginBottom: 8,
        },
        demoText: {
                fontSize: 12,
                color: "#6B7280",
                marginBottom: 4,
        },
        demoSubText: {
                fontSize: 11,
                color: "#9CA3AF",
                fontStyle: "italic",
                marginTop: 4,
        },
        otpInfo: {
                backgroundColor: "#F0FDF4",
                borderRadius: 12,
                padding: 16,
                borderLeftWidth: 4,
                borderLeftColor: "#22C55E",
        },
        otpInfoText: {
                fontSize: 14,
                fontWeight: "600",
                color: "#166534",
                marginBottom: 4,
        },
        otpInfoSubText: {
                fontSize: 12,
                color: "#16A34A",
        },
})

export default LoginScreen
