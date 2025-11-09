"use client"

import { useState } from "react"
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
} from "react-native"
import { ref, push, set, update, get } from "firebase/database"
import { database } from "../firebaseConfig"
import AsyncStorage from "@react-native-async-storage/async-storage"

import { getCurrentLocation } from "../utils/locationUtils"
import { sendOTP, generateOTP } from "../utils/smsService"
import { storeOtp, verifyOtp } from "../utils/otpStore"

const LoginScreen = ({ navigation }) => {
        const [mobileNumber, setMobileNumber] = useState("")
        const [otp, setOtp] = useState("")
        const [userType, setUserType] = useState("फील्ड एजंट")
        const [loading, setLoading] = useState(false)
        const [locationLoading, setLocationLoading] = useState(false)
        const [otpRequested, setOtpRequested] = useState(false)

        const createUserSession = async (userId, phone, actualUserType, loginLocation) => {
                try {
                        const sessionId = push(ref(database, `users/${userId}/sessions`)).key
                        const loginTime = new Date().toISOString()

                        await set(ref(database, `users/${userId}/sessions/${sessionId}`), {
                                loginTime,
                                loginLocation: loginLocation || null,
                                logoutTime: null,
                                logoutLocation: null,
                                logoutType: null,
                                slips_issued: 0,
                                voting_done: 0,
                        })

                        await update(ref(database, `users/${userId}`), {
                                phone,
                                currentSession: sessionId,
                                lastLogin: loginTime,
                                loginLocation: loginLocation || null,
                                userType: actualUserType,
                                isActive: true,
                        })

                        await AsyncStorage.setItem("session", JSON.stringify({ userId, currentSession: sessionId }))

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

                                if (selectedUserType === "प्रशासन" && actualUserType !== "प्रशासन") {
                                        return {
                                                isValid: false,
                                                message: "तुम्ही प्रशासक नाही. कृपया योग्य प्रशासक क्रेडेंशियल्सने लॉगिन करा.",
                                                actualUserType,
                                        }
                                }

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
                                message: "वాపరుకర్త సమాచారం పరీక్షతానికి తెలియదు",
                                actualUserType: null,
                        }
                }
        }

        const requestOTP = async () => {
                if (!mobileNumber || mobileNumber.length !== 10) {
                        Alert.alert("त्रुटी", "कृपया वैध 10 अंकी मोबाईल नंबर भरा")
                        return
                }

                setLoading(true)

                try {
                        const otp = generateOTP()
                        await storeOtp(mobileNumber, otp)

                        const { success, message } = await sendOTP(mobileNumber, otp)

                        if (success) {
                                setOtpRequested(true)
                                Alert.alert("यशस्वी", `OTP तुमच्या मोबाईल नंबर ${mobileNumber} वर पाठवला आहे`)
                        } else {
                                Alert.alert("त्रुटी", `OTP पाठविण्यात अडचण: ${message || "अज्ञात त्रुटी"}`)
                        }
                } catch (error) {
                        console.error("OTP sending error:", error)
                        Alert.alert("त्रुटी", "OTP पाठविण्यात अडचण आली")
                } finally {
                        setLoading(false)
                }
        }

        const handleLogin = async () => {
                if (!mobileNumber || !otp) {
                        Alert.alert("त्रुटी", "कृपया मोबाईल नंबर आणि OTP भरा")
                        return
                }

                if (mobileNumber.length !== 10) {
                        Alert.alert("त्रुटी", "कृपया वैध 10 अंकी मोबाईल नंबर भरा")
                        return
                }

                setLoading(true)
                setLocationLoading(true)

                try {
                        const otpResult = await verifyOtp(mobileNumber, otp)
                        if (!otpResult.valid) {
                                setLoading(false)
                                setLocationLoading(false)
                                const reason = otpResult.reason
                                const message =
                                        reason === "expired" ? "OTP कालबाह्य झाला आहे. कृपया नवीन OTP मागवा." : "OTP चुकीचा आहे. कृपया पुन्हा प्रयत्न करा."
                                Alert.alert("त्रुटी", message)
                                return
                        }

                        const locationResult = await getCurrentLocation()
                        setLocationLoading(false)

                        let loginLocation = null
                        if (locationResult.success) {
                                loginLocation = locationResult.location
                        } else {
                                Alert.alert("स्थान त्रुटी", `${locationResult.error}\n\nतरीही लॉगिन करायचे?`, [
                                        {
                                                text: "रद्द करा",
                                                style: "cancel",
                                                onPress: () => {
                                                        setLoading(false)
                                                        return
                                                },
                                        },
                                        {
                                                text: "लॉगिन करा",
                                                onPress: () => proceedWithLogin(null),
                                        },
                                ])
                                return
                        }

                        await proceedWithLogin(loginLocation)
                } catch (error) {
                        console.error("Login error:", error)
                        setLoading(false)
                        setLocationLoading(false)
                        Alert.alert("त्रुटी", "लॉगिन करताना त्रुटी आली")
                }
        }

        const proceedWithLogin = async (loginLocation) => {
                try {
                        const userId = mobileNumber // use phone number as userId

                        const userRef = ref(database, `users/${userId}`)
                        const userSnap = await get(userRef)
                        if (!userSnap.exists()) {
                                Alert.alert("त्रुटी", "हा मोबाईल नंबर नोंदणीकृत नाही. कृपया प्रथम नोंदणी करा.")
                                return
                        }

                        const roleValidation = await validateUserRole(userId, userType)

                        if (!roleValidation.isValid) {
                                Alert.alert("प्रवेश नाकारला", roleValidation.message)
                                setLoading(false)
                                return
                        }

                        await createUserSession(userId, mobileNumber, roleValidation.actualUserType, loginLocation)

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
                } catch (error) {
                        console.error("Login error:", error)
                        Alert.alert("त्रुटी", "लॉगिन करताना त्रुटी आली")
                } finally {
                        setLoading(false)
                        setLocationLoading(false)
                }
        }

        return (
                <SafeAreaView style={styles.container}>
                        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
                        <View style={styles.content}>
                                {/* Celebration Image */}
                                <View style={styles.imageContainer}>
                                        <Image source={require("../assets/banner.jpeg")} style={styles.celebrationImage} resizeMode="contain" />
                                </View>

                                {/* Title */}
                                <Text style={styles.title}>पुणे जिल्हा परिषद निवडणूका 2025</Text>

                                {/* User Type Selection */}
                                <View style={styles.userTypeContainer}>
                                        <TouchableOpacity
                                                style={[styles.userTypeButton, userType === "फील्ड एजंट" && styles.userTypeButtonActive]}
                                                onPress={() => setUserType("फील्ड एजंट")}
                                                activeOpacity={0.7}
                                                disabled={loading}
                                        >
                                                <Text style={[styles.userTypeText, userType === "फील्ड एजंट" && styles.userTypeTextActive]}>फील्ड एजंट</Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                                style={[styles.userTypeButton, userType === "प्रशासन" && styles.userTypeButtonActive]}
                                                onPress={() => setUserType("प्रशासन")}
                                                activeOpacity={0.7}
                                                disabled={loading}
                                        >
                                                <Text style={[styles.userTypeText, userType === "प्रशासन" && styles.userTypeTextActive]}>प्रशासन</Text>
                                        </TouchableOpacity>
                                </View>

                                {/* Input Fields */}
                                <View style={styles.inputContainer}>
                                        <TextInput
                                                style={styles.input}
                                                placeholder="मोबाईल नंबर"
                                                placeholderTextColor="#9CA3AF"
                                                value={mobileNumber}
                                                onChangeText={setMobileNumber}
                                                keyboardType="phone-pad"
                                                maxLength={10}
                                                editable={!loading && !otpRequested}
                                        />

                                        {otpRequested && (
                                                <TextInput
                                                        style={styles.input}
                                                        placeholder="OTP"
                                                        placeholderTextColor="#9CA3AF"
                                                        value={otp}
                                                        onChangeText={setOtp}
                                                        keyboardType="number-pad"
                                                        maxLength={6}
                                                        editable={!loading}
                                                />
                                        )}
                                </View>

                                {/* Location Status */}
                                {locationLoading && (
                                        <View style={styles.locationStatus}>
                                                <ActivityIndicator size="small" color="#2196F3" />
                                                <Text style={styles.locationText}>स्थान मिळवत आहे...</Text>
                                        </View>
                                )}

                                {/* OTP Request/Login Button */}
                                {!otpRequested ? (
                                        <TouchableOpacity
                                                style={[styles.loginButton, loading && styles.loginButtonDisabled]}
                                                onPress={requestOTP}
                                                activeOpacity={0.8}
                                                disabled={loading}
                                        >
                                                {loading ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.loginButtonText}>OTP मिळवा</Text>}
                                        </TouchableOpacity>
                                ) : (
                                        <TouchableOpacity
                                                style={[styles.loginButton, loading && styles.loginButtonDisabled]}
                                                onPress={handleLogin}
                                                activeOpacity={0.8}
                                                disabled={loading}
                                        >
                                                {loading ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.loginButtonText}>लॉगिन करा</Text>}
                                        </TouchableOpacity>
                                )}

                                {/* Register Button */}
                                <TouchableOpacity
                                        style={styles.registerButton}
                                        onPress={() => navigation.navigate("Register")}
                                        activeOpacity={0.7}
                                        disabled={loading}
                                >
                                        <Text style={styles.registerButtonText}>खाते नाहीये का? आता नोंदणी करा.</Text>
                                </TouchableOpacity>
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
                width: "100%",
                marginBottom: 32,
                paddingTop: 20,
        },
        celebrationImage: {
                width: "100%",
                height: undefined,
                aspectRatio: 16 / 9,
        },
        title: {
                fontSize: 24,
                fontWeight: "700",
                color: "#1F2937",
                textAlign: "center",
                marginBottom: 20,
                lineHeight: 32,
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
        input: {
                backgroundColor: "#F9FAFB",
                borderWidth: 1,
                borderColor: "#E5E7EB",
                borderRadius: 12,
                paddingHorizontal: 16,
                paddingVertical: 16,
                fontSize: 16,
                color: "#1F2937",
                marginBottom: 16,
                fontWeight: "400",
        },
        locationStatus: {
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 20,
                padding: 10,
                backgroundColor: "#e3f2fd",
                borderRadius: 8,
        },
        locationText: {
                marginLeft: 8,
                fontSize: 14,
                color: "#1976d2",
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
})

export default LoginScreen
