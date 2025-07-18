"use client"

import { useState } from "react"
import {
        View,
        Text,
        TextInput,
        TouchableOpacity,
        StyleSheet,
        SafeAreaView,
        ScrollView,
        StatusBar,
        Alert,
        ActivityIndicator,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { createUserWithEmailAndPassword } from "firebase/auth"
import { getAuth } from "firebase/auth"
import { getDatabase, ref, set } from "firebase/database"
import { sendOTP, verifyOTP } from "../services/msg91Service"

const RegisterScreen = ({ navigation }) => {
        const [fullName, setFullName] = useState("")
        const [mobileNumber, setMobileNumber] = useState("")
        const [otp, setOtp] = useState("")
        const [userType, setUserType] = useState("फील्ड एजंट")
        const [loading, setLoading] = useState(false)
        const [otpSent, setOtpSent] = useState(false)
        const [otpVerified, setOtpVerified] = useState(false)

        const auth = getAuth()
        const database = getDatabase()

        const validateInputs = () => {
                if (!fullName.trim()) {
                        Alert.alert("त्रुटी", "कृपया पूर्ण नाव भरा")
                        return false
                }

                if (!mobileNumber.trim() || mobileNumber.length !== 10) {
                        Alert.alert("त्रुटी", "कृपया वैध 10 अंकी मोबाईल नंबर भरा")
                        return false
                }

                return true
        }

        const handleSendOTP = async () => {
                if (!validateInputs()) {
                        return
                }

                setLoading(true)
                try {
                        const response = await sendOTP(mobileNumber)

                        if (response.success) {
                                setOtpSent(true)
                                Alert.alert("यशस्वी", response.message)
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

        const handleVerifyOTP = async () => {
                if (!otp) {
                        Alert.alert("त्रुटी", "कृपया OTP भरा")
                        return
                }

                if (otp.length !== 4 && otp.length !== 6) {
                        Alert.alert("त्रुटी", "कृपया वैध OTP भरा")
                        return
                }

                setLoading(true)
                try {
                        const response = await verifyOTP(mobileNumber, otp)

                        if (response.success) {
                                setOtpVerified(true)
                                Alert.alert("यशस्वी", "मोबाईल नंबर सत्यापित झाला")
                        } else {
                                Alert.alert("त्रुटी", response.message)
                        }
                } catch (error) {
                        console.error("Verify OTP error:", error)
                        Alert.alert("त्रुटी", "OTP सत्यापनात त्रुटी आली")
                } finally {
                        setLoading(false)
                }
        }

        const handleRegister = async () => {
                if (!otpVerified) {
                        Alert.alert("त्रुटी", "कृपया प्रथम मोबाईल नंबर सत्यापित करा")
                        return
                }

                setLoading(true)

                try {
                        // Create email from mobile number
                        const email = `${mobileNumber}@gmail.com`
                        // Use mobile number as password for simplicity (in production, use a more secure approach)
                        const password = mobileNumber

                        // Create user with Firebase Auth
                        const userCredential = await createUserWithEmailAndPassword(auth, email, password)
                        const user = userCredential.user

                        // Store additional user data in Realtime Database
                        await set(ref(database, `users/${user.uid}`), {
                                fullName: fullName.trim(),
                                phone: mobileNumber,
                                userType: userType,
                                email: email,
                                createdAt: new Date().toISOString(),
                                currentSession: null,
                                lastLogin: null,
                                lastLogout: null,
                                lastLoginLocation: null,
                                lastLogoutLocation: null,
                                sessions: {},
                        })

                        Alert.alert("यशस्वी!", "तुमचे खाते यशस्वीरित्या तयार झाले आहे. आता तुम्ही लॉगिन करू शकता.", [
                                {
                                        text: "ठीक आहे",
                                        onPress: () => navigation.navigate("Login"),
                                },
                        ])
                } catch (error) {
                        console.error("Registration error:", error)

                        let errorMessage = "नोंदणी करताना त्रुटी आली"

                        if (error.code === "auth/email-already-in-use") {
                                errorMessage = "हा मोबाईल नंबर आधीच वापरला गेला आहे"
                        } else if (error.code === "auth/weak-password") {
                                errorMessage = "पासवर्ड खूप कमकुवत आहे"
                        } else if (error.code === "auth/invalid-email") {
                                errorMessage = "अवैध ईमेल पत्ता"
                        }

                        Alert.alert("त्रुटी", errorMessage)
                } finally {
                        setLoading(false)
                }
        }

        const handleEditNumber = () => {
                setOtpSent(false)
                setOtpVerified(false)
                setOtp("")
        }

        return (
                <SafeAreaView style={styles.container}>
                        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

                        {/* Header */}
                        <View style={styles.header}>
                                <TouchableOpacity
                                        style={styles.backButton}
                                        onPress={() => navigation.goBack()}
                                        activeOpacity={0.7}
                                        disabled={loading}
                                >
                                        <Ionicons name="arrow-back" size={24} color="#1F2937" />
                                </TouchableOpacity>
                                <Text style={styles.headerTitle}>नोंदणी करा</Text>
                                <View style={styles.headerSpacer} />
                        </View>

                        <ScrollView
                                style={styles.content}
                                showsVerticalScrollIndicator={false}
                                contentContainerStyle={styles.scrollContent}
                        >
                                {/* Full Name Field */}
                                <View style={styles.inputGroup}>
                                        <Text style={styles.label}>पूर्ण नाव *</Text>
                                        <TextInput
                                                style={styles.input}
                                                placeholder="तुमचे पूर्ण नाव एंटर करा"
                                                placeholderTextColor="#9CA3AF"
                                                value={fullName}
                                                onChangeText={setFullName}
                                                editable={!loading}
                                        />
                                </View>

                                {/* Mobile Number Field */}
                                <View style={styles.inputGroup}>
                                        <Text style={styles.label}>मोबाईल नंबर *</Text>
                                        <View style={styles.mobileInputContainer}>
                                                <TextInput
                                                        style={[styles.input, styles.mobileInput, (otpSent || otpVerified) && styles.inputDisabled]}
                                                        placeholder="तुमचा 10 अंकी मोबाईल नंबर एंटर करा"
                                                        placeholderTextColor="#9CA3AF"
                                                        value={mobileNumber}
                                                        onChangeText={setMobileNumber}
                                                        keyboardType="phone-pad"
                                                        maxLength={10}
                                                        editable={!otpSent && !otpVerified && !loading}
                                                />
                                                {(otpSent || otpVerified) && (
                                                        <TouchableOpacity style={styles.editButton} onPress={handleEditNumber} disabled={loading}>
                                                                <Text style={styles.editButtonText}>बदला</Text>
                                                        </TouchableOpacity>
                                                )}
                                        </View>

                                        {/* OTP Verification Status */}
                                        {otpVerified && (
                                                <View style={styles.verifiedContainer}>
                                                        <Ionicons name="checkmark-circle" size={16} color="#22C55E" />
                                                        <Text style={styles.verifiedText}>मोबाईल नंबर सत्यापित</Text>
                                                </View>
                                        )}
                                </View>

                                {/* OTP Field - Show when OTP is sent but not verified */}
                                {otpSent && !otpVerified && (
                                        <View style={styles.inputGroup}>
                                                <Text style={styles.label}>OTP *</Text>
                                                <TextInput
                                                        style={styles.input}
                                                        placeholder="OTP एंटर करा"
                                                        placeholderTextColor="#9CA3AF"
                                                        value={otp}
                                                        onChangeText={setOtp}
                                                        keyboardType="number-pad"
                                                        maxLength={6}
                                                        editable={!loading}
                                                />
                                        </View>
                                )}

                                {/* User Type Selection */}
                                <View style={styles.inputGroup}>
                                        <Text style={styles.label}>भूमिका *</Text>
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
                                </View>

                                {/* Action Buttons */}
                                {!otpSent ? (
                                        // Send OTP Button
                                        <TouchableOpacity
                                                style={[styles.registerButton, loading && styles.registerButtonDisabled]}
                                                onPress={handleSendOTP}
                                                activeOpacity={0.8}
                                                disabled={loading}
                                        >
                                                {loading ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.registerButtonText}>OTP पाठवा</Text>}
                                        </TouchableOpacity>
                                ) : !otpVerified ? (
                                        // Verify OTP Button
                                        <TouchableOpacity
                                                style={[styles.registerButton, loading && styles.registerButtonDisabled]}
                                                onPress={handleVerifyOTP}
                                                activeOpacity={0.8}
                                                disabled={loading}
                                        >
                                                {loading ? (
                                                        <ActivityIndicator color="#ffffff" />
                                                ) : (
                                                        <Text style={styles.registerButtonText}>OTP सत्यापित करा</Text>
                                                )}
                                        </TouchableOpacity>
                                ) : (
                                        // Register Button
                                        <TouchableOpacity
                                                style={[styles.registerButton, loading && styles.registerButtonDisabled]}
                                                onPress={handleRegister}
                                                activeOpacity={0.8}
                                                disabled={loading}
                                        >
                                                {loading ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.registerButtonText}>नोंदणी करा</Text>}
                                        </TouchableOpacity>
                                )}

                                {/* Login Link */}
                                <View style={styles.loginLinkContainer}>
                                        <Text style={styles.loginLinkText}>आधीच खाते आहे का?</Text>
                                        <TouchableOpacity onPress={() => navigation.navigate("Login")} activeOpacity={0.7} disabled={loading}>
                                                <Text style={styles.loginLinkButton}>आता लॉगिन करा</Text>
                                        </TouchableOpacity>
                                </View>

                                {/* OTP Instructions */}
                                {otpSent && !otpVerified && (
                                        <View style={styles.otpInfo}>
                                                <Text style={styles.otpInfoText}>{mobileNumber} वर OTP पाठवला गेला आहे</Text>
                                                <Text style={styles.otpInfoSubText}>OTP प्राप्त होण्यासाठी काही मिनिटे वाट पहा</Text>
                                        </View>
                                )}
                        </ScrollView>
                </SafeAreaView>
        )
}

const styles = StyleSheet.create({
        container: {
                flex: 1,
                backgroundColor: "#ffffff",
        },
        header: {
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingHorizontal: 20,
                paddingVertical: 16,
                borderBottomWidth: 1,
                borderBottomColor: "#F3F4F6",
        },
        backButton: {
                padding: 4,
        },
        headerTitle: {
                fontSize: 18,
                fontWeight: "600",
                color: "#1F2937",
        },
        headerSpacer: {
                width: 32,
        },
        content: {
                flex: 1,
        },
        scrollContent: {
                paddingHorizontal: 24,
                paddingTop: 24,
                paddingBottom: 40,
        },
        inputGroup: {
                marginBottom: 24,
        },
        label: {
                fontSize: 16,
                fontWeight: "600",
                color: "#1F2937",
                marginBottom: 8,
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
        },
        mobileInputContainer: {
                flexDirection: "row",
                alignItems: "center",
        },
        mobileInput: {
                flex: 1,
                marginRight: 12,
        },
        inputDisabled: {
                backgroundColor: "#F3F4F6",
                color: "#6B7280",
        },
        editButton: {
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
        verifiedContainer: {
                flexDirection: "row",
                alignItems: "center",
                marginTop: 8,
        },
        verifiedText: {
                color: "#22C55E",
                fontSize: 14,
                fontWeight: "500",
                marginLeft: 4,
        },
        userTypeContainer: {
                flexDirection: "row",
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
        registerButton: {
                backgroundColor: "#3B82F6",
                borderRadius: 12,
                paddingVertical: 16,
                alignItems: "center",
                justifyContent: "center",
                marginTop: 16,
                marginBottom: 24,
                shadowColor: "#3B82F6",
                shadowOffset: {
                        width: 0,
                        height: 4,
                },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 8,
        },
        registerButtonDisabled: {
                backgroundColor: "#9CA3AF",
        },
        registerButtonText: {
                color: "#ffffff",
                fontSize: 18,
                fontWeight: "600",
        },
        loginLinkContainer: {
                alignItems: "center",
                marginTop: 8,
        },
        loginLinkText: {
                fontSize: 14,
                color: "#6B7280",
                marginBottom: 4,
        },
        loginLinkButton: {
                fontSize: 14,
                color: "#3B82F6",
                fontWeight: "600",
        },
        otpInfo: {
                backgroundColor: "#F0FDF4",
                borderRadius: 12,
                padding: 16,
                borderLeftWidth: 4,
                borderLeftColor: "#22C55E",
                marginTop: 16,
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

export default RegisterScreen
