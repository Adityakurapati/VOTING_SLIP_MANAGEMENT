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
import { database } from "../firebaseConfig"
import { ref, set, get } from "firebase/database"
import { sendOTP, generateOTP } from "../utils/smsService"
import { storeOtp, verifyOtp } from "../utils/otpStore"

const RegisterScreen = ({ navigation }) => {
  const [fullName, setFullName] = useState("")
  const [mobileNumber, setMobileNumber] = useState("")
  const [userType, setUserType] = useState("फील्ड एजंट")
  const [loading, setLoading] = useState(false)
  const [otpRequested, setOtpRequested] = useState(false)
  const [otp, setOtp] = useState("")

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

  const handleRequestOtp = async () => {
    if (!validateInputs()) return

    setLoading(true)
    try {
      // Block duplicate registrations
      const existingRef = ref(database, `users/${mobileNumber}`)
      const existing = await get(existingRef)
      if (existing.exists()) {
        Alert.alert("सूचना", "हा मोबाईल नंबर आधीच नोंदणीकृत आहे. कृपया लॉगिन करा.")
        setLoading(false)
        return
      }

      const code = generateOTP()
      await storeOtp(mobileNumber, code)
      const { success, message } = await sendOTP(mobileNumber, code)
      if (!success) {
        Alert.alert("त्रुटी", `OTP पाठविण्यात अडचण: ${message || "अज्ञात त्रुटी"}`)
        setLoading(false)
        return
      }
      setOtpRequested(true)
      Alert.alert("यशस्वी!", `OTP ${mobileNumber} वर पाठवला आहे`)
    } catch (err) {
      console.error("[Registration] OTP error:", err)
      Alert.alert("त्रुटी", "OTP पाठविण्यात अडचण आली")
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyAndCreate = async () => {
    if (!otp.trim() || otp.length !== 6) {
      Alert.alert("त्रुटी", "कृपया वैध 6 अंकी OTP भरा")
      return
    }
    setLoading(true)
    try {
      const result = await verifyOtp(mobileNumber, otp)
      if (!result.valid) {
        const msg = result.reason === "expired" ? "OTP कालबाह्य झाला आहे" : "चुकीचा OTP"
        Alert.alert("त्रुटी", msg)
        setLoading(false)
        return
      }

      // Create user record keyed by phone
      await set(ref(database, `users/${mobileNumber}`), {
        fullName: fullName.trim(),
        phone: mobileNumber,
        userType: "फील्ड एजंट",
        validated: false, // Requires admin approval
        createdAt: new Date().toISOString(),
        currentSession: null,
        lastLogin: null,
        lastLogout: null,
        sessions: {},
        isActive: false,
      })

      Alert.alert("यशस्वी!", "तुमचे खाते तयार झाले आहे. प्रशासकाच्या मंजुरीनंतर तुम्ही लॉगिन करू शकाल.", [
        { text: "ठीक आहे", onPress: () => navigation.navigate("Login") },
      ])
    } catch (error) {
      console.error("[Registration] Error during registration:", error)
      Alert.alert("त्रुटी", "नोंदणी करताना त्रुटी आली")
    } finally {
      setLoading(false)
    }
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
            editable={!loading && !otpRequested}
          />
        </View>

        {/* Mobile Number Field */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>मोबाईल नंबर *</Text>
          <TextInput
            style={styles.input}
            placeholder="तुमचा 10 अंकी मोबाईल नंबर एंटर करा"
            placeholderTextColor="#9CA3AF"
            value={mobileNumber}
            onChangeText={setMobileNumber}
            keyboardType="phone-pad"
            maxLength={10}
            editable={!loading && !otpRequested}
          />
        </View>

        {/* User Type Selection - Only Field Agent */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>भूमिका *</Text>
          <View style={styles.userTypeContainer}>
            <TouchableOpacity style={[styles.userTypeButton, styles.userTypeButtonActive]} disabled={true}>
              <Text style={[styles.userTypeText, styles.userTypeTextActive]}>फील्ड एजंट</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.noteText}>नोंद: केवळ फील्ड एजंट नोंदणी उपलब्ध आहे. प्रशासक खाते मॅन्युअली तयार केले जाते.</Text>
        </View>

        {/* OTP Field (after request) */}
        {otpRequested && (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>OTP *</Text>
            <TextInput
              style={styles.input}
              placeholder="6 अंकी OTP"
              placeholderTextColor="#9CA3AF"
              value={otp}
              onChangeText={setOtp}
              keyboardType="number-pad"
              maxLength={6}
              editable={!loading}
            />
          </View>
        )}

        {/* Action Button */}
        {!otpRequested ? (
          <TouchableOpacity
            style={[styles.registerButton, loading && styles.registerButtonDisabled]}
            onPress={handleRequestOtp}
            activeOpacity={0.8}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.registerButtonText}>OTP मिळवा</Text>}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.registerButton, loading && styles.registerButtonDisabled]}
            onPress={handleVerifyAndCreate}
            activeOpacity={0.8}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.registerButtonText}>नोंदणी पूर्ण करा</Text>
            )}
          </TouchableOpacity>
        )}

        {/* Login Link */}
        <View style={styles.loginLinkContainer}>
          <Text style={styles.loginLinkText}>आधीच खाते आहे का?</Text>
          <TouchableOpacity onPress={() => navigation.navigate("Login")} activeOpacity={0.7} disabled={loading}>
            <Text style={styles.loginLinkButton}>आता लॉगिन करा</Text>
          </TouchableOpacity>
        </View>
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
  noteText: {
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: 8,
    fontStyle: "italic",
  },
})

export default RegisterScreen
