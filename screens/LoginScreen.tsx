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
import { signInWithEmailAndPassword } from "firebase/auth"
import { getAuth } from "firebase/auth"
import { getDatabase, ref, push, set, update, get } from "firebase/database"

const LoginScreen = ({ navigation }) => {
        const [mobileNumber, setMobileNumber] = useState("")
        const [otp, setOtp] = useState("")
        const [userType, setUserType] = useState("फील्ड एजंट")
        const [loading, setLoading] = useState(false)
        const auth = getAuth()
        const database = getDatabase()

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
                                userType: actualUserType, // Use the actual user type from database
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
                try {
                        // Create email from mobile number
                        const email = `${mobileNumber}@gmail.com`

                        // Sign in with Firebase Auth
                        const userCredential = await signInWithEmailAndPassword(auth, email, otp)
                        const user = userCredential.user

                        // Validate user role
                        const roleValidation = await validateUserRole(user.uid, userType)

                        if (!roleValidation.isValid) {
                                // Sign out the user since role validation failed
                                await auth.signOut()
                                Alert.alert("प्रवेश नाकारला", roleValidation.message)
                                return
                        }

                        // Create session in database
                        await createUserSession(user.uid, mobileNumber, roleValidation.actualUserType)

                        // Navigate based on actual user type
                        if (roleValidation.actualUserType === "प्रशासन") {
                                // Reset navigation stack and go to Admin
                                navigation.reset({
                                        index: 0,
                                        routes: [{ name: "Admin" }],
                                })
                        } else {
                                // Reset navigation stack and go to Field Agent
                                navigation.reset({
                                        index: 0,
                                        routes: [{ name: "FieldAgent" }],
                                })
                        }
                } catch (error) {
                        console.error("Login error:", error)

                        let errorMessage = "लॉगिन करताना त्रुटी आली"

                        if (error.code === "auth/user-not-found") {
                                errorMessage = "हा मोबाईल नंबर नोंदणीकृत नाही. कृपया प्रथम नोंदणी करा."
                        } else if (error.code === "auth/wrong-password") {
                                errorMessage = "चुकीचा OTP/पासवर्ड"
                        } else if (error.code === "auth/invalid-email") {
                                errorMessage = "अवैध मोबाईल नंबर"
                        } else if (error.code === "auth/too-many-requests") {
                                errorMessage = "खूप जास्त प्रयत्न. कृपया काही वेळानंतर प्रयत्न करा."
                        }

                        Alert.alert("त्रुटी", errorMessage)
                } finally {
                        setLoading(false)
                }
        }

        return (
                <SafeAreaView style={styles.container}>
                        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
                        <View style={styles.content}>
                                {/* Celebration Image */}
                                <View style={styles.imageContainer}>
                                        <Image source={require("../assets/celebration.png")} style={styles.celebrationImage} resizeMode="contain" />
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
                                                editable={!loading}
                                        />

                                        <TextInput
                                                style={styles.input}
                                                placeholder="पासवर्ड"
                                                placeholderTextColor="#9CA3AF"
                                                value={otp}
                                                onChangeText={setOtp}
                                                secureTextEntry
                                                editable={!loading}
                                        />
                                </View>

                                {/* Login Button */}
                                <TouchableOpacity
                                        style={[styles.loginButton, loading && styles.loginButtonDisabled]}
                                        onPress={handleLogin}
                                        activeOpacity={0.8}
                                        disabled={loading}
                                >
                                        {loading ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.loginButtonText}>लॉगिन करा</Text>}
                                </TouchableOpacity>

                                {/* Register Button */}
                                <TouchableOpacity
                                        style={styles.registerButton}
                                        onPress={() => navigation.navigate("Register")}
                                        activeOpacity={0.7}
                                        disabled={loading}
                                >
                                        <Text style={styles.registerButtonText}>खाते नाहीये का? आता नोंदणी करा.</Text>
                                </TouchableOpacity>

                                {/* Demo Credentials Info */}
                                <View style={styles.demoInfo}>
                                        <Text style={styles.demoTitle}>डेमो क्रेडेंशियल्स:</Text>
                                        <Text style={styles.demoText}>फील्ड एजंट: 1234567890 / 123456</Text>
                                        <Text style={styles.demoText}>प्रशासन: 9876543210 / 123456</Text>
                                </View>
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
        demoInfo: {
                backgroundColor: "#F0F9FF",
                borderRadius: 12,
                padding: 16,
                borderLeftWidth: 4,
                borderLeftColor: "#3B82F6",
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
})

export default LoginScreen
