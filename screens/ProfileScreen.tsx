"use client"

import { useState, useEffect } from "react"
import {
        View,
        Text,
        TouchableOpacity,
        Alert,
        StyleSheet,
        SafeAreaView,
        Image,
        ScrollView,
        ActivityIndicator,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { signOut } from "firebase/auth"
import { auth, database } from "../firebaseConfig"
import { ref, update, onValue, get } from "firebase/database"
import { useUser } from "../contexts/UserContext"

const ProfileScreen = ({ navigation }) => {
        const [userInfo, setUserInfo] = useState(null)
        const [loading, setLoading] = useState(true)
        const [loggingOut, setLoggingOut] = useState(false)
        const { user: contextUser } = useUser()

        useEffect(() => {
                const user = auth.currentUser
                if (user) {
                        const userRef = ref(database, `users/${user.uid}`)
                        const unsubscribe = onValue(userRef, (snapshot) => {
                                if (snapshot.exists()) {
                                        const userData = snapshot.val()
                                        setUserInfo({
                                                uid: user.uid,
                                                phone: userData.phone || "",
                                                userType: userData.userType || "फील्ड एजंट",
                                                fullName: userData.fullName || "",
                                                currentSession: userData.currentSession || null,
                                                lastLogin: userData.lastLogin || null,
                                                lastLogout: userData.lastLogout || null,
                                                loginLocation: userData.loginLocation || null,
                                                isActive: userData.isActive || false,
                                                total_slips_issued: userData.total_slips_issued || 0,
                                                total_voting_done: userData.total_voting_done || 0,
                                                sessions: userData.sessions || {},
                                                createdAt: userData.createdAt || null,
                                        })
                                }
                                setLoading(false)
                        })

                        return () => unsubscribe()
                } else {
                        setLoading(false)
                }
        }, [])

        // Fallback to context user if realtime data is not available
        useEffect(() => {
                if (contextUser && !userInfo) {
                        setUserInfo({
                                uid: contextUser.uid,
                                phone: contextUser.phone || "",
                                userType: contextUser.userType || "फील्ड एजंट",
                                fullName: contextUser.fullName || "",
                                currentSession: contextUser.currentSession || null,
                                lastLogin: contextUser.lastLogin || null,
                                lastLogout: contextUser.lastLogout || null,
                                loginLocation: contextUser.loginLocation || null,
                                isActive: contextUser.isActive || false,
                                total_slips_issued: contextUser.total_slips_issued || 0,
                                total_voting_done: contextUser.total_voting_done || 0,
                                sessions: contextUser.sessions || {},
                                createdAt: contextUser.createdAt || null,
                        })
                        setLoading(false)
                }
        }, [contextUser])

        const handleLogout = async () => {
                Alert.alert("लॉगआउट", "तुम्ही खरोखर लॉगआउट करू इच्छिता?", [
                        {
                                text: "रद्द करा",
                                style: "cancel",
                        },
                        {
                                text: "लॉगआउट",
                                style: "destructive",
                                onPress: performLogout,
                        },
                ])
        }

        const performLogout = async () => {
                setLoggingOut(true)
                try {
                        const user = auth.currentUser
                        if (user) {
                                // Get current user data to check for active session
                                const userRef = ref(database, `users/${user.uid}`)
                                const snapshot = await get(userRef)

                                if (snapshot.exists()) {
                                        const userData = snapshot.val()
                                        if (userData.currentSession) {
                                                const logoutTime = new Date().toISOString()

                                                // Update current session with logout time
                                                await update(ref(database, `users/${user.uid}/sessions/${userData.currentSession}`), {
                                                        logoutTime,
                                                        logoutType: "manual",
                                                })

                                                // Update user info
                                                await update(ref(database, `users/${user.uid}`), {
                                                        currentSession: null,
                                                        lastLogout: logoutTime,
                                                        isActive: false,
                                                })
                                        }
                                }
                        }

                        await signOut(auth)
                        navigation.reset({
                                index: 0,
                                routes: [{ name: "Auth" }],
                        })
                } catch (error) {
                        console.error("Logout error:", error)
                        Alert.alert("त्रुटी", "लॉगआउट करताना समस्या आली")
                } finally {
                        setLoggingOut(false)
                }
        }

        const formatDateTime = (isoString) => {
                if (!isoString) return "कधीच नाही"
                try {
                        const date = new Date(isoString)
                        return date.toLocaleString("mr-IN", {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                        })
                } catch (error) {
                        return "अवैध तारीख"
                }
        }

        const getSessionStatus = () => {
                return userInfo?.currentSession ? "सक्रिय" : "निष्क्रिय"
        }

        const getSessionStatusColor = () => {
                return userInfo?.currentSession ? "#4CAF50" : "#FF5722"
        }

        const getTotalSessions = () => {
                if (!userInfo?.sessions) return 0
                return Object.keys(userInfo.sessions).length
        }

        const getCurrentUser = () => {
                // Return the most reliable user data
                return userInfo || contextUser || {
                        uid: "N/A",
                        phone: "N/A",
                        userType: "फील्ड एजंट",
                        fullName: "एजंट अॅलेक्स",
                        total_slips_issued: 0,
                        total_voting_done: 0,
                }
        }

        if (loading) {
                return (
                        <SafeAreaView style={styles.container}>
                                <View style={styles.loadingContainer}>
                                        <ActivityIndicator size="large" color="#3B82F6" />
                                        <Text style={styles.loadingText}>प्रोफाइल लोड होत आहे...</Text>
                                </View>
                        </SafeAreaView>
                )
        }

        const currentUser = getCurrentUser()

        return (
                <SafeAreaView style={styles.container}>
                        <View style={styles.header}>
                                <Text style={styles.headerTitle}>प्रोफाइल</Text>
                                <TouchableOpacity
                                        style={styles.settingsButton}
                                        onPress={() => {
                                                /* Add settings functionality */
                                        }}
                                >
                                        <Ionicons name="settings-outline" size={24} color="#666" />
                                </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                                {/* Profile Section */}
                                <View style={styles.profileSection}>
                                        <Image
                                                source={
                                                        currentUser.userType === "प्रशासन"
                                                                ? require("../assets/avatar1.png")
                                                                : require("../assets/avatar2.png")
                                                }
                                                style={styles.profileImage}
                                        />
                                        <Text style={styles.profileName}>
                                                {currentUser.fullName ||
                                                        (currentUser.userType === "प्रशासन" ? "प्रशासक" : "फील्ड एजंट")}
                                        </Text>
                                        <Text style={styles.profileRole}>{currentUser.userType}</Text>
                                        <View style={styles.statusContainer}>
                                                <View style={[styles.statusDot, { backgroundColor: getSessionStatusColor() }]} />
                                                <Text style={[styles.statusText, { color: getSessionStatusColor() }]}>{getSessionStatus()}</Text>
                                        </View>
                                </View>

                                {/* Stats Section */}
                                <View style={styles.statsSection}>
                                        <Text style={styles.sectionTitle}>कार्य आकडेवारी</Text>
                                        <View style={styles.statsContainer}>
                                                <View style={styles.statItem}>
                                                        <Text style={styles.statNumber}>{currentUser.total_slips_issued || 0}</Text>
                                                        <Text style={styles.statLabel}>स्लिप जारी</Text>
                                                </View>
                                                <View style={styles.statItem}>
                                                        <Text style={styles.statNumber}>{currentUser.total_voting_done || 0}</Text>
                                                        <Text style={styles.statLabel}>मतदान नोंद</Text>
                                                </View>
                                                <View style={styles.statItem}>
                                                        <Text style={styles.statNumber}>{getTotalSessions()}</Text>
                                                        <Text style={styles.statLabel}>सेशन</Text>
                                                </View>
                                        </View>
                                </View>

                                {/* User Info Section */}
                                <View style={styles.infoSection}>
                                        <Text style={styles.sectionTitle}>वैयक्तिक माहिती</Text>

                                        <View style={styles.infoItem}>
                                                <View style={styles.infoIcon}>
                                                        <Ionicons name="call-outline" size={20} color="#3B82F6" />
                                                </View>
                                                <View style={styles.infoContent}>
                                                        <Text style={styles.infoLabel}>मोबाईल नंबर</Text>
                                                        <Text style={styles.infoValue}>{currentUser.phone || "N/A"}</Text>
                                                </View>
                                        </View>

                                        <View style={styles.infoItem}>
                                                <View style={styles.infoIcon}>
                                                        <Ionicons name="person-outline" size={20} color="#3B82F6" />
                                                </View>
                                                <View style={styles.infoContent}>
                                                        <Text style={styles.infoLabel}>वापरकर्ता ID</Text>
                                                        <Text style={styles.infoValue}>{currentUser.uid?.substring(0, 10)}...</Text>
                                                </View>
                                        </View>

                                        <View style={styles.infoItem}>
                                                <View style={styles.infoIcon}>
                                                        <Ionicons name="briefcase-outline" size={20} color="#3B82F6" />
                                                </View>
                                                <View style={styles.infoContent}>
                                                        <Text style={styles.infoLabel}>भूमिका</Text>
                                                        <Text style={styles.infoValue}>{currentUser.userType}</Text>
                                                </View>
                                        </View>

                                        <View style={styles.infoItem}>
                                                <View style={styles.infoIcon}>
                                                        <Ionicons name="calendar-outline" size={20} color="#3B82F6" />
                                                </View>
                                                <View style={styles.infoContent}>
                                                        <Text style={styles.infoLabel}>खाते तारीख</Text>
                                                        <Text style={styles.infoValue}>{formatDateTime(currentUser.createdAt)}</Text>
                                                </View>
                                        </View>

                                        <View style={styles.infoItem}>
                                                <View style={styles.infoIcon}>
                                                        <Ionicons name="time-outline" size={20} color="#3B82F6" />
                                                </View>
                                                <View style={styles.infoContent}>
                                                        <Text style={styles.infoLabel}>शेवटचे लॉगिन</Text>
                                                        <Text style={styles.infoValue}>{formatDateTime(currentUser.lastLogin)}</Text>
                                                </View>
                                        </View>

                                        <View style={styles.infoItem}>
                                                <View style={styles.infoIcon}>
                                                        <Ionicons name="log-out-outline" size={20} color="#3B82F6" />
                                                </View>
                                                <View style={styles.infoContent}>
                                                        <Text style={styles.infoLabel}>शेवटचे लॉगआउट</Text>
                                                        <Text style={styles.infoValue}>{formatDateTime(currentUser.lastLogout)}</Text>
                                                </View>
                                        </View>
                                </View>

                                {/* Actions Section */}
                                <View style={styles.actionsSection}>
                                        <Text style={styles.sectionTitle}>क्रिया</Text>

                                        <TouchableOpacity style={styles.actionItem}>
                                                <View style={styles.actionIcon}>
                                                        <Ionicons name="notifications-outline" size={20} color="#3B82F6" />
                                                </View>
                                                <Text style={styles.actionText}>सूचना</Text>
                                                <Ionicons name="chevron-forward" size={20} color="#666" />
                                        </TouchableOpacity>

                                        <TouchableOpacity style={styles.actionItem}>
                                                <View style={styles.actionIcon}>
                                                        <Ionicons name="help-circle-outline" size={20} color="#3B82F6" />
                                                </View>
                                                <Text style={styles.actionText}>मदत आणि समर्थन</Text>
                                                <Ionicons name="chevron-forward" size={20} color="#666" />
                                        </TouchableOpacity>

                                        <TouchableOpacity style={styles.actionItem}>
                                                <View style={styles.actionIcon}>
                                                        <Ionicons name="information-circle-outline" size={20} color="#3B82F6" />
                                                </View>
                                                <Text style={styles.actionText}>अॅप बद्दल</Text>
                                                <Ionicons name="chevron-forward" size={20} color="#666" />
                                        </TouchableOpacity>

                                        {currentUser.userType === "प्रशासन" && (
                                                <TouchableOpacity
                                                        style={styles.actionItem}
                                                        onPress={() => navigation.navigate("Admin")}
                                                >
                                                        <View style={styles.actionIcon}>
                                                                <Ionicons name="shield-checkmark-outline" size={20} color="#3B82F6" />
                                                        </View>
                                                        <Text style={styles.actionText}>प्रशासन डॅशबोर्ड</Text>
                                                        <Ionicons name="chevron-forward" size={20} color="#666" />
                                                </TouchableOpacity>
                                        )}
                                </View>

                                {/* Logout Button */}
                                <TouchableOpacity
                                        style={[styles.logoutButton, loggingOut && styles.logoutButtonDisabled]}
                                        onPress={handleLogout}
                                        disabled={loggingOut}
                                >
                                        {loggingOut ? (
                                                <ActivityIndicator color="#fff" />
                                        ) : (
                                                <>
                                                        <Ionicons name="log-out-outline" size={20} color="#fff" />
                                                        <Text style={styles.logoutButtonText}>लॉगआउट</Text>
                                                </>
                                        )}
                                </TouchableOpacity>
                        </ScrollView>
                </SafeAreaView>
        )
}

const styles = StyleSheet.create({
        container: {
                flex: 1,
                backgroundColor: "#f5f5f5",
        },
        loadingContainer: {
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
        },
        loadingText: {
                marginTop: 16,
                fontSize: 16,
                color: "#333",
        },
        header: {
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingHorizontal: 16,
                paddingVertical: 12,
                backgroundColor: "#fff",
                borderBottomWidth: 1,
                borderBottomColor: "#e0e0e0",
        },
        headerTitle: {
                fontSize: 18,
                fontWeight: "600",
                color: "#000",
        },
        settingsButton: {
                padding: 4,
        },
        content: {
                flex: 1,
                paddingHorizontal: 16,
        },
        profileSection: {
                backgroundColor: "#fff",
                borderRadius: 12,
                padding: 20,
                alignItems: "center",
                marginTop: 16,
                marginBottom: 16,
        },
        profileImage: {
                width: 100,
                height: 100,
                borderRadius: 50,
                marginBottom: 16,
        },
        profileName: {
                fontSize: 20,
                fontWeight: "bold",
                color: "#000",
                marginBottom: 4,
        },
        profileRole: {
                fontSize: 16,
                color: "#666",
                marginBottom: 12,
        },
        statusContainer: {
                flexDirection: "row",
                alignItems: "center",
        },
        statusDot: {
                width: 8,
                height: 8,
                borderRadius: 4,
                marginRight: 6,
        },
        statusText: {
                fontSize: 14,
                fontWeight: "500",
        },
        statsSection: {
                backgroundColor: "#fff",
                borderRadius: 12,
                padding: 16,
                marginBottom: 16,
        },
        statsContainer: {
                flexDirection: "row",
                justifyContent: "space-between",
        },
        statItem: {
                alignItems: "center",
                flex: 1,
        },
        statNumber: {
                fontSize: 24,
                fontWeight: "bold",
                color: "#3B82F6",
                marginBottom: 4,
        },
        statLabel: {
                fontSize: 12,
                color: "#666",
                textAlign: "center",
        },
        infoSection: {
                backgroundColor: "#fff",
                borderRadius: 12,
                padding: 16,
                marginBottom: 16,
        },
        sectionTitle: {
                fontSize: 16,
                fontWeight: "600",
                color: "#000",
                marginBottom: 16,
        },
        infoItem: {
                flexDirection: "row",
                alignItems: "center",
                paddingVertical: 12,
                borderBottomWidth: 1,
                borderBottomColor: "#f0f0f0",
        },
        infoIcon: {
                width: 40,
                height: 40,
                borderRadius: 8,
                backgroundColor: "#f5f5f5",
                justifyContent: "center",
                alignItems: "center",
                marginRight: 12,
        },
        infoContent: {
                flex: 1,
        },
        infoLabel: {
                fontSize: 14,
                color: "#666",
                marginBottom: 4,
        },
        infoValue: {
                fontSize: 16,
                color: "#000",
                fontWeight: "500",
        },
        actionsSection: {
                backgroundColor: "#fff",
                borderRadius: 12,
                padding: 16,
                marginBottom: 16,
        },
        actionItem: {
                flexDirection: "row",
                alignItems: "center",
                paddingVertical: 12,
                borderBottomWidth: 1,
                borderBottomColor: "#f0f0f0",
        },
        actionIcon: {
                width: 40,
                height: 40,
                borderRadius: 8,
                backgroundColor: "#f5f5f5",
                justifyContent: "center",
                alignItems: "center",
                marginRight: 12,
        },
        actionText: {
                flex: 1,
                fontSize: 16,
                color: "#000",
                fontWeight: "500",
        },
        logoutButton: {
                backgroundColor: "#ff4444",
                borderRadius: 8,
                padding: 16,
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 32,
                flexDirection: "row",
        },
        logoutButtonDisabled: {
                backgroundColor: "#ffaaaa",
        },
        logoutButtonText: {
                color: "#fff",
                fontSize: 16,
                fontWeight: "600",
                marginLeft: 8,
        },
})

export default ProfileScreen