"use client"

import { useState, useEffect } from "react"
import {
        View,
        Text,
        StyleSheet,
        SafeAreaView,
        TouchableOpacity,
        ScrollView,
        ActivityIndicator,
        StatusBar,
        Alert,
        Image,
        AppState,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { ref, onValue, off, get, update } from "firebase/database"
import { database, auth } from "../firebaseConfig"
import { signOut } from "firebase/auth"
import { getCurrentLocation, formatLocationForDisplay } from "../utils/locationUtils"

// Same village data structure as DashboardScreen
const VILLAGE_DATA = {
        "इंदुरी": {
                "२२३ गावठाण इंदुरी": [
                        "इंदुरी_गावठाण_इंदुरी", "इंदुरी_बाजारपेठ_इंदुरी", "इंदुरी_बाजारपेठ_मागील_भाग_इंदुरी", "काशिद_चाळ_इंदुरी", "काशिद_मळा_इंदुरी", "काशिद_विट_भट्टी_इंदुरी", "खांदवे_चाळ_इंदुरी", "गावठाण_इंदुरी", "पवारवाडा_इंदुरी", "राऊत_विट_भट्टी_इंदुरी", "विष्णु_मंदिर_इंदुरी", "शिदीया_मागील_भाग_इंदुरी"
                ],
                "२२४ गावठाण इंदुरी": ["गावठाण इंदुरी", "सुतार वस्ती गावठाण इंदुरी", "गायकवाड वाडा गावठाण इंदुरी", "कॅडबरी वस्ती इंदुरी"],
                "२२५ कुंडमळा इंदुरी": [],
                "२२६ गावठाण वस्ती इंदुरी": ["कांदे वस्ती इंदुरी", "कुंडमळा इंदुरी", "गावठाण वस्ती इंदुरी", "प्रगती नगर इंदुरी"],
                "२२७ गावठाण इंदुरी": ["इंदुरी_गावठाण_इंदुरी", "ओव्हरसीस_इलेव्हेटोर", "कांदे_वस्ती_इंदुरी", "गावठाण_इंदुरी", "ठाकरवाडी_इंदुरी"],
                "२२८ भागवत मळा इंदुरी": [],
        }
}

const AdminDashboardScreen = ({ navigation }) => {
        const [users, setUsers] = useState({})
        const [loading, setLoading] = useState(true)
        const [selectedUser, setSelectedUser] = useState(null)
        const [currentView, setCurrentView] = useState("dashboard")
        const [selectedSession, setSelectedSession] = useState(null)
        const [lastActivity, setLastActivity] = useState(Date.now())

        // Dashboard state
        const [expandedSections, setExpandedSections] = useState({
                village: false,
                division: false,
        })
        const [selectedVillage, setSelectedVillage] = useState(null)
        const [selectedBhag, setSelectedBhag] = useState(null)
        const [selectedVibhag, setSelectedVibhag] = useState(null)
        const [stats, setStats] = useState({
                totalVoters: 0,
                slipIssued: 0,
                votingDone: 0,
        })

        // Auto logout after 1 hour of inactivity
        useEffect(() => {
                const INACTIVITY_TIMEOUT = 60 * 60 * 1000 // 1 hour in milliseconds
                let inactivityTimer

                const resetInactivityTimer = () => {
                        setLastActivity(Date.now())
                        clearTimeout(inactivityTimer)
                        inactivityTimer = setTimeout(() => {
                                handleAutoLogout()
                        }, INACTIVITY_TIMEOUT)
                }

                const handleAutoLogout = async () => {
                        Alert.alert(
                                "सेशन समाप्त",
                                "निष्क्रियतेमुळे तुमचे सेशन समाप्त झाले आहे. कृपया पुन्हा लॉगिन करा.",
                                [
                                        {
                                                text: "ठीक आहे",
                                                onPress: async () => {
                                                        await performLogout(true)
                                                },
                                        },
                                ],
                                { cancelable: false },
                        )
                }

                // Handle app state changes
                const handleAppStateChange = (nextAppState) => {
                        if (nextAppState === "background" || nextAppState === "inactive") {
                                // App is going to background, perform logout
                                performLogout(true)
                        } else if (nextAppState === "active") {
                                // App is becoming active, reset timer
                                resetInactivityTimer()
                        }
                }

                // Set up app state listener
                const subscription = AppState.addEventListener("change", handleAppStateChange)

                // Start the inactivity timer
                resetInactivityTimer()

                // Add activity listeners (you can add more as needed)
                const activityEvents = ["onTouchStart", "onScroll", "onPress"]

                return () => {
                        clearTimeout(inactivityTimer)
                        subscription?.remove()
                }
        }, [])

        const performLogout = async (isAutoLogout = false) => {
                try {
                        const currentUser = auth.currentUser
                        if (currentUser) {
                                // Get current location for logout
                                const logoutLocation = await getCurrentLocation()

                                // Get current user data to check for active session
                                const userRef = ref(database, `users/${currentUser.uid}`)
                                const snapshot = await get(userRef)

                                if (snapshot.exists()) {
                                        const userData = snapshot.val()
                                        if (userData.currentSession) {
                                                const logoutTime = new Date().toISOString()

                                                // Update current session with logout time, location, and logout type
                                                await update(ref(database, `users/${currentUser.uid}/sessions/${userData.currentSession}`), {
                                                        logoutTime,
                                                        logoutLocation: logoutLocation || null,
                                                        logoutType: isAutoLogout ? "auto" : "manual",
                                                })

                                                // Update user info
                                                await update(ref(database, `users/${currentUser.uid}`), {
                                                        currentSession: null,
                                                        lastLogout: logoutTime,
                                                        logoutLocation: logoutLocation || null,
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
                }
        }

        useEffect(() => {
                const usersRef = ref(database, "users")
                const unsubscribe = onValue(usersRef, (snapshot) => {
                        const data = snapshot.val()
                        if (data) {
                                // Filter to show only field agents (फील्ड एजंट)
                                const filteredUsers = Object.keys(data).reduce((acc, userId) => {
                                        const user = data[userId]
                                        if (user.userType === "फील्ड एजंट") {
                                                acc[userId] = {
                                                        ...user,
                                                        uid: userId,
                                                }
                                        }
                                        return acc
                                }, {})
                                setUsers(filteredUsers)
                        }
                        setLoading(false)
                })

                return () => off(usersRef, "value", unsubscribe)
        }, [])

        const calculateStats = (village, bhag, vibhag) => {
                const villagesRef = ref(database, "villages")
                onValue(villagesRef, (snapshot) => {
                        const data = snapshot.val()
                        if (data && data[village] && data[village][bhag] && data[village][bhag][vibhag]) {
                                const voterList = data[village][bhag][vibhag]["मतदार_यादी"] || {}
                                let totalVoters = 0
                                let slipIssued = 0
                                let votingDone = 0

                                Object.values(voterList).forEach((voter) => {
                                        totalVoters++
                                        if (voter["स्लिप_जारी_केली"] === true || voter["स्लिप जारी केली"] === true) {
                                                slipIssued++
                                        }
                                        if (voter["मतदान_झाले"] === true || voter["मतदान झाले"] === true) {
                                                votingDone++
                                        }
                                })

                                setStats({
                                        totalVoters,
                                        slipIssued,
                                        votingDone,
                                })
                        } else {
                                setStats({
                                        totalVoters: 0,
                                        slipIssued: 0,
                                        votingDone: 0,
                                })
                        }
                })
        }

        const calculateOverallStats = () => {
                const villagesRef = ref(database, "villages")
                onValue(villagesRef, (snapshot) => {
                        const data = snapshot.val()
                        let totalVoters = 0
                        let slipIssued = 0
                        let votingDone = 0

                        if (data) {
                                Object.values(data).forEach((village) => {
                                        Object.values(village).forEach((bhag) => {
                                                Object.values(bhag).forEach((vibhag) => {
                                                        const voterList = vibhag["मतदार_यादी"] || {}
                                                        Object.values(voterList).forEach((voter) => {
                                                                totalVoters++
                                                                if (voter["स्लिप_जारी_केली"] === true || voter["स्लिप जारी केली"] === true) {
                                                                        slipIssued++
                                                                }
                                                                if (voter["मतदान_झाले"] === true || voter["मतदान झाले"] === true) {
                                                                        votingDone++
                                                                }
                                                        })
                                                })
                                        })
                                })
                        }

                        setStats({
                                totalVoters,
                                slipIssued,
                                votingDone,
                        })
                })
        }

        useEffect(() => {
                if (selectedVillage && selectedBhag && selectedVibhag) {
                        calculateStats(selectedVillage, selectedBhag, selectedVibhag)
                } else {
                        calculateOverallStats()
                }
        }, [selectedVillage, selectedBhag, selectedVibhag])

        const handleLogout = () => {
                Alert.alert("लॉगआउट", "तुम्ही खरोखर लॉगआउट करू इच्छिता?", [
                        {
                                text: "रद्द करा",
                                style: "cancel",
                        },
                        {
                                text: "लॉगआउट",
                                style: "destructive",
                                onPress: () => performLogout(false),
                        },
                ])
        }

        const toggleSection = (section) => {
                setExpandedSections((prev) => ({
                        ...prev,
                        [section]: !prev[section],
                }))
        }

        const handleVillageSelect = (village) => {
                setSelectedVillage(village)
                setSelectedBhag(null)
                setSelectedVibhag(null)
                const bhags = Object.keys(VILLAGE_DATA[village])
                if (bhags.length === 1) {
                        setSelectedBhag(bhags[0])
                        setExpandedSections({
                                village: false,
                                division: true,
                        })
                } else {
                        setExpandedSections({
                                village: false,
                                division: false,
                        })
                }
        }

        const handleBhagSelect = (bhag) => {
                setSelectedBhag(bhag)
                setSelectedVibhag(null)
                setExpandedSections({
                        village: false,
                        division: false,
                })
        }

        const handleVibhagSelect = (vibhag) => {
                setSelectedVibhag(vibhag)
        }

        const clearSelection = () => {
                setSelectedVillage(null)
                setSelectedBhag(null)
                setSelectedVibhag(null)
                setExpandedSections({
                        village: false,
                        division: false,
                })
        }

        const getUserStats = () => {
                const userList = Object.values(users)
                const totalUsers = userList.length
                const activeUsers = userList.filter((user) => user.currentSession).length
                return { totalUsers, activeUsers }
        }

        const formatDate = (dateString) => {
                if (!dateString) return "N/A"
                const date = new Date(dateString)
                return date.toLocaleString("mr-IN", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                })
        }

        const getSessionDuration = (loginTime, logoutTime) => {
                if (!loginTime) return "N/A"
                const start = new Date(loginTime)
                const end = logoutTime ? new Date(logoutTime) : new Date()
                const durationMs = end.getTime() - start.getTime()
                const hours = Math.floor(durationMs / (1000 * 60 * 60))
                const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60))

                if (hours > 0) {
                        return `${hours} तास ${minutes} मिनिटे`
                }
                return `${minutes} मिनिटे`
        }

        const getSessionHistory = (user) => {
                if (!user.sessions) return []
                return Object.entries(user.sessions)
                        .map(([sessionId, session]) => ({
                                ...session,
                                sessionId,
                        }))
                        .sort((a, b) => new Date(b.loginTime).getTime() - new Date(a.loginTime).getTime())
        }

        const renderSessionDetail = () => {
                if (!selectedSession) return null

                return (
                        <View style={styles.sessionDetailModal}>
                                <View style={styles.sessionDetailContent}>
                                        <View style={styles.sessionDetailHeader}>
                                                <Text style={styles.sessionDetailTitle}>सेशन तपशील</Text>
                                                <TouchableOpacity onPress={() => setSelectedSession(null)}>
                                                        <Ionicons name="close" size={24} color="#fff" />
                                                </TouchableOpacity>
                                        </View>

                                        <ScrollView style={styles.sessionDetailScroll}>
                                                <View style={styles.sessionDetailInfo}>
                                                        <Text style={styles.sessionDetailLabel}>सेशन ID:</Text>
                                                        <Text style={styles.sessionDetailValue}>{selectedSession.sessionId?.substring(0, 12)}...</Text>
                                                </View>

                                                <View style={styles.sessionDetailInfo}>
                                                        <Text style={styles.sessionDetailLabel}>लॉगिन वेळ:</Text>
                                                        <Text style={styles.sessionDetailValue}>{formatDate(selectedSession.loginTime)}</Text>
                                                </View>

                                                <View style={styles.sessionDetailInfo}>
                                                        <Text style={styles.sessionDetailLabel}>लॉगिन स्थान:</Text>
                                                        <Text style={styles.sessionDetailValue}>{formatLocationForDisplay(selectedSession.loginLocation)}</Text>
                                                </View>

                                                {selectedSession.logoutTime && (
                                                        <>
                                                                <View style={styles.sessionDetailInfo}>
                                                                        <Text style={styles.sessionDetailLabel}>लॉगआउट वेळ:</Text>
                                                                        <Text style={styles.sessionDetailValue}>{formatDate(selectedSession.logoutTime)}</Text>
                                                                </View>

                                                                <View style={styles.sessionDetailInfo}>
                                                                        <Text style={styles.sessionDetailLabel}>लॉगआउट स्थान:</Text>
                                                                        <Text style={styles.sessionDetailValue}>
                                                                                {formatLocationForDisplay(selectedSession.logoutLocation)}
                                                                        </Text>
                                                                </View>
                                                        </>
                                                )}

                                                <View style={styles.sessionDetailInfo}>
                                                        <Text style={styles.sessionDetailLabel}>लॉगआउट प्रकार:</Text>
                                                        <Text
                                                                style={[
                                                                        styles.sessionDetailValue,
                                                                        selectedSession.logoutType === "auto" ? styles.autoLogout : styles.manualLogout,
                                                                ]}
                                                        >
                                                                {selectedSession.logoutType === "auto"
                                                                        ? "स्वयंचलित"
                                                                        : selectedSession.logoutType === "manual"
                                                                                ? "मॅन्युअल"
                                                                                : selectedSession.logoutTime
                                                                                        ? "मॅन्युअल"
                                                                                        : "सक्रिय"}
                                                        </Text>
                                                </View>

                                                <View style={styles.sessionDetailInfo}>
                                                        <Text style={styles.sessionDetailLabel}>कालावधी:</Text>
                                                        <Text style={styles.sessionDetailValue}>
                                                                {getSessionDuration(selectedSession.loginTime, selectedSession.logoutTime)}
                                                        </Text>
                                                </View>

                                                <View style={styles.sessionDetailInfo}>
                                                        <Text style={styles.sessionDetailLabel}>स्लिप मंजूर:</Text>
                                                        <Text style={styles.sessionDetailValue}>{Number(selectedSession.slips_issued || 0)}</Text>
                                                </View>

                                                <View style={styles.sessionDetailInfo}>
                                                        <Text style={styles.sessionDetailLabel}>मतदान मंजूर:</Text>
                                                        <Text style={styles.sessionDetailValue}>{Number(selectedSession.voting_done || 0)}</Text>
                                                </View>

                                                {selectedSession.sections && (
                                                        <>
                                                                <View style={[styles.sessionDetailInfo, { marginTop: 8 }]}>
                                                                        <Text style={styles.sessionDetailLabel}>विभागनिहाय तपशील:</Text>
                                                                        <Text style={styles.sessionDetailValue} />
                                                                </View>
                                                                {Object.entries(selectedSession.sections).map(([villageKey, divisions]: any) => (
                                                                        <View key={villageKey} style={{ marginBottom: 6 }}>
                                                                                <Text style={[styles.sessionDetailLabel, { opacity: 0.9 }]}>{villageKey}</Text>
                                                                                {divisions &&
                                                                                        Object.entries(divisions as any).map(([divisionKey, vibhags]: any) => (
                                                                                                <View key={divisionKey} style={{ marginLeft: 8, marginTop: 2 }}>
                                                                                                        <Text style={[styles.sessionDetailLabel, { fontSize: 12, opacity: 0.85 }]}>
                                                                                                                {divisionKey}
                                                                                                        </Text>
                                                                                                        {vibhags &&
                                                                                                                Object.entries(vibhags as any).map(([vibhagKey, counts]: any) => (
                                                                                                                        <View key={vibhagKey} style={{ marginLeft: 12, marginTop: 2 }}>
                                                                                                                                <Text style={[styles.sessionDetailValue, { fontSize: 12 }]}>
                                                                                                                                        {vibhagKey}: स्लिप {Number((counts as any).slips_issued || 0)} • मतदान{" "}
                                                                                                                                        {Number((counts as any).voting_done || 0)}
                                                                                                                                </Text>
                                                                                                                        </View>
                                                                                                                ))}
                                                                                                </View>
                                                                                        ))}
                                                                        </View>
                                                                ))}
                                                        </>
                                                )}
                                        </ScrollView>
                                </View>
                        </View>
                )
        }

        const renderUserDetail = () => {
                if (!selectedUser) return null
                const sessionHistory = getSessionHistory(selectedUser)

                return (
                        <View style={styles.userDetailContainer}>
                                <View style={styles.userDetailHeader}>
                                        <TouchableOpacity style={styles.backButton} onPress={() => setSelectedUser(null)}>
                                                <Ionicons name="arrow-back" size={20} color="#fff" />
                                        </TouchableOpacity>
                                        <Text style={styles.userDetailTitle}>फील्ड एजंट तपशील</Text>
                                </View>

                                <ScrollView style={styles.userDetailContent}>
                                        <View style={styles.userInfoCard}>
                                                <Text style={styles.userDetailName}>{selectedUser.fullName || selectedUser.name || "Unknown"}</Text>
                                                <Text style={styles.userDetailPhone}>{selectedUser.phone}</Text>

                                                <View style={styles.userTypeContainer}>
                                                        <Text style={[styles.userTypeBadge, styles.agentBadge]}>{selectedUser.userType}</Text>
                                                </View>

                                                <View style={styles.statusRow}>
                                                        <Text style={styles.statusLabel}>स्थिती:</Text>
                                                        <Text
                                                                style={[styles.statusValue, selectedUser.currentSession ? styles.activeStatus : styles.inactiveStatus]}
                                                        >
                                                                {selectedUser.currentSession ? "सक्रिय" : "निष्क्रिय"}
                                                        </Text>
                                                </View>

                                                <View style={styles.statusRow}>
                                                        <Text style={styles.statusLabel}>शेवटचे लॉगिन:</Text>
                                                        <Text style={styles.statusValue}>{formatDate(selectedUser.lastLogin)}</Text>
                                                </View>

                                                <View style={styles.statusRow}>
                                                        <Text style={styles.statusLabel}>शेवटचे लॉगआउट:</Text>
                                                        <Text style={styles.statusValue}>{formatDate(selectedUser.lastLogout)}</Text>
                                                </View>
                                        </View>

                                        {/* Action Statistics */}
                                        <View style={styles.actionStatsCard}>
                                                <Text style={styles.sectionTitle}>एकूण कार्य आकडेवारी</Text>
                                                <View style={styles.statsRow}>
                                                        <View style={styles.statItem}>
                                                                <Text style={styles.statNumber}>{selectedUser.total_slips_issued || 0}</Text>
                                                                <Text style={styles.statLabel}>स्लिप जारी केली</Text>
                                                        </View>
                                                        <View style={styles.statItem}>
                                                                <Text style={styles.statNumber}>{selectedUser.total_voting_done || 0}</Text>
                                                                <Text style={styles.statLabel}>मतदान नोंद</Text>
                                                        </View>
                                                </View>
                                        </View>

                                        <View style={styles.sessionHistoryCard}>
                                                <Text style={styles.sectionTitle}>सेशन इतिहास ({sessionHistory.length})</Text>
                                                {sessionHistory.length > 0 ? (
                                                        sessionHistory.map((session, index) => (
                                                                <TouchableOpacity
                                                                        key={session.sessionId || index}
                                                                        style={styles.sessionItem}
                                                                        onPress={() => setSelectedSession(session)}
                                                                >
                                                                        <View style={styles.sessionHeader}>
                                                                                <Text style={styles.sessionNumber}>सेशन #{sessionHistory.length - index}</Text>
                                                                                <Text
                                                                                        style={[
                                                                                                styles.sessionStatus,
                                                                                                session.logoutTime ? styles.completedSession : styles.activeSession,
                                                                                        ]}
                                                                                >
                                                                                        {session.logoutTime ? "पूर्ण" : "सक्रिय"}
                                                                                </Text>
                                                                        </View>

                                                                        <Text style={styles.sessionTime}>लॉगिन: {formatDate(session.loginTime)}</Text>
                                                                        <Text style={styles.sessionLocation}>
                                                                                लॉगिन स्थान: {formatLocationForDisplay(session.loginLocation)}
                                                                        </Text>

                                                                        {session.logoutTime && (
                                                                                <>
                                                                                        <Text style={styles.sessionTime}>लॉगआउट: {formatDate(session.logoutTime)}</Text>
                                                                                        <Text style={styles.sessionLocation}>
                                                                                                लॉगआउट स्थान: {formatLocationForDisplay(session.logoutLocation)}
                                                                                        </Text>
                                                                                        <Text style={styles.sessionTime}>
                                                                                                प्रकार: {session.logoutType === "auto" ? "स्वयंचलित" : "मॅन्युअल"}
                                                                                        </Text>
                                                                                </>
                                                                        )}

                                                                        <Text style={styles.sessionDuration}>
                                                                                कालावधी: {getSessionDuration(session.loginTime, session.logoutTime)}
                                                                        </Text>

                                                                        {/* Session Action Stats */}
                                                                        <View style={styles.sessionStats}>
                                                                                <Text style={styles.sessionStatsText}>
                                                                                        स्लिप: {session.slips_issued || 0} | मतदान: {session.voting_done || 0}
                                                                                </Text>
                                                                        </View>

                                                                        <Ionicons name="chevron-forward" size={16} color="#666" style={styles.sessionChevron} />
                                                                </TouchableOpacity>
                                                        ))
                                                ) : (
                                                        <Text style={styles.noDataText}>कोणताही सेशन इतिहास उपलब्ध नाही</Text>
                                                )}
                                        </View>
                                </ScrollView>

                                {selectedSession && renderSessionDetail()}
                        </View>
                )
        }

        const renderUserManagement = () => {
                const userStats = getUserStats()

                return (
                        <View style={styles.container}>
                                <StatusBar backgroundColor="#f5f5f5" barStyle="dark-content" />
                                {/* Header */}
                                <View style={styles.header}>
                                        <TouchableOpacity onPress={() => setCurrentView("dashboard")}>
                                                <Ionicons name="arrow-back" size={24} color="#000" />
                                        </TouchableOpacity>
                                        <Text style={styles.headerTitle}>फील्ड एजंट व्यवस्थापन</Text>
                                        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                                                <Ionicons name="log-out-outline" size={20} color="#fff" />
                                        </TouchableOpacity>
                                </View>

                                <ScrollView style={styles.content}>
                                        {/* Stats Cards */}
                                        <View style={styles.statsContainer}>
                                                <View style={styles.statCard}>
                                                        <Text style={styles.statNumber}>{userStats.totalUsers}</Text>
                                                        <Text style={styles.statLabel}>एकूण फील्ड एजंट</Text>
                                                </View>
                                                <View style={styles.statCard}>
                                                        <Text style={styles.statNumber}>{userStats.activeUsers}</Text>
                                                        <Text style={styles.statLabel}>सक्रिय एजंट</Text>
                                                </View>
                                        </View>

                                        {/* Users List */}
                                        <View style={styles.usersSection}>
                                                <Text style={styles.sectionTitle}>फील्ड एजंट यादी</Text>
                                                {Object.entries(users).map(([userId, user]) => (
                                                        <TouchableOpacity key={userId} style={styles.userCard} onPress={() => setSelectedUser(user)}>
                                                                <View style={styles.userInfo}>
                                                                        <Text style={styles.userName}>{user.fullName || user.name || "Unknown"}</Text>
                                                                        <Text style={styles.userPhone}>{user.phone}</Text>
                                                                        <Text style={[styles.userType, styles.agentType]}>{user.userType}</Text>

                                                                        {/* User Activity Summary */}
                                                                        <View style={styles.userActivitySummary}>
                                                                                <Text style={styles.activityText}>
                                                                                        स्लिप: {user.total_slips_issued || 0} | मतदान: {user.total_voting_done || 0}
                                                                                </Text>
                                                                                <Text style={styles.sessionCountText}>
                                                                                        सेशन: {user.sessions ? Object.keys(user.sessions).length : 0}
                                                                                </Text>
                                                                        </View>
                                                                </View>

                                                                <View style={styles.userStatus}>
                                                                        <View
                                                                                style={[
                                                                                        styles.statusIndicator,
                                                                                        user.currentSession ? styles.activeIndicator : styles.inactiveIndicator,
                                                                                ]}
                                                                        />
                                                                        <Text style={styles.statusText}>{user.currentSession ? "सक्रिय" : "निष्क्रिय"}</Text>
                                                                        <Ionicons name="chevron-forward" size={16} color="#666" />
                                                                </View>
                                                        </TouchableOpacity>
                                                ))}

                                                {Object.keys(users).length === 0 && (
                                                        <View style={styles.emptyContainer}>
                                                                <Text style={styles.emptyText}>कोणतेही फील्ड एजंट सापडले नाहीत</Text>
                                                        </View>
                                                )}
                                        </View>
                                </ScrollView>
                        </View>
                )
        }

        const renderDashboard = () => {
                const hasMultipleBhags = selectedVillage && Object.keys(VILLAGE_DATA[selectedVillage]).length > 1
                const hasVibhags =
                        selectedBhag &&
                        selectedVillage &&
                        VILLAGE_DATA[selectedVillage][selectedBhag] &&
                        VILLAGE_DATA[selectedVillage][selectedBhag].length > 0

                return (
                        <View style={styles.container}>
                                <StatusBar backgroundColor="#f5f5f5" barStyle="dark-content" />
                                {/* Header */}
                                <View style={styles.header}>
                                        <Text style={styles.headerTitle}>प्रशासन डैशबोर्ड</Text>
                                        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                                                <Ionicons name="log-out-outline" size={20} color="#fff" />
                                        </TouchableOpacity>
                                </View>

                                <ScrollView style={styles.content}>
                                        {/* Profile Section */}
                                        <View style={styles.profileSection}>
                                                <Image source={require("../assets/profile-placeholder.png")} style={styles.profileImage} />
                                                <View style={styles.profileInfo}>
                                                        <Text style={styles.profileName}>प्रशासक</Text>
                                                        <Text style={styles.profileRole}>प्रशासन</Text>
                                                </View>
                                        </View>

                                        {/* Stats Cards */}
                                        <View style={styles.statsContainer}>
                                                <View style={styles.statCard}>
                                                        <Text style={styles.statNumber}>{stats.totalVoters}</Text>
                                                        <Text style={styles.statLabel}>एकूण मतदार</Text>
                                                </View>
                                                <View style={styles.statCard}>
                                                        <Text style={styles.statNumber}>{stats.slipIssued}</Text>
                                                        <Text style={styles.statLabel}>स्लिप जारी केली</Text>
                                                </View>
                                        </View>

                                        <View style={[styles.statCard, { width: "100%" }]}>
                                                <Text style={styles.statNumber}>{stats.votingDone}</Text>
                                                <Text style={styles.statLabel}>मतदान झाले</Text>
                                        </View>

                                        {/* Area Selection */}
                                        <View style={styles.selectionHeader}>
                                                <Text style={styles.selectionTitle}>क्षेत्र निवडा (वैकल्पिक)</Text>
                                                {(selectedVillage || selectedBhag || selectedVibhag) && (
                                                        <TouchableOpacity style={styles.clearButton} onPress={clearSelection}>
                                                                <Text style={styles.clearButtonText}>साफ करा</Text>
                                                        </TouchableOpacity>
                                                )}
                                        </View>

                                        {/* Village Dropdown */}
                                        <View style={styles.expandableSection}>
                                                <TouchableOpacity style={styles.expandableHeader} onPress={() => toggleSection("village")}>
                                                        <Text style={styles.expandableTitle}>{selectedVillage ? selectedVillage : "गाव निवडा"}</Text>
                                                        <Ionicons name={expandedSections.village ? "chevron-up" : "chevron-down"} size={20} color="#000" />
                                                </TouchableOpacity>
                                                {expandedSections.village && (
                                                        <View style={styles.dropdownContent}>
                                                                {Object.keys(VILLAGE_DATA).map((village) => (
                                                                        <TouchableOpacity
                                                                                key={village}
                                                                                style={styles.dropdownItem}
                                                                                onPress={() => handleVillageSelect(village)}
                                                                        >
                                                                                <Text style={styles.dropdownItemText}>{village}</Text>
                                                                        </TouchableOpacity>
                                                                ))}
                                                        </View>
                                                )}
                                        </View>

                                        {/* Bhag Dropdown */}
                                        {hasMultipleBhags && selectedVillage && (
                                                <View style={styles.expandableSection}>
                                                        <TouchableOpacity style={styles.expandableHeader} onPress={() => toggleSection("division")}>
                                                                <Text style={styles.expandableTitle}>{selectedBhag ? selectedBhag : "भाग निवडा"}</Text>
                                                                <Ionicons name={expandedSections.division ? "chevron-up" : "chevron-down"} size={20} color="#000" />
                                                        </TouchableOpacity>
                                                        {expandedSections.division && (
                                                                <View style={styles.dropdownContent}>
                                                                        {Object.keys(VILLAGE_DATA[selectedVillage]).map((bhag) => (
                                                                                <TouchableOpacity key={bhag} style={styles.dropdownItem} onPress={() => handleBhagSelect(bhag)}>
                                                                                        <Text style={styles.dropdownItemText}>{bhag}</Text>
                                                                                </TouchableOpacity>
                                                                        ))}
                                                                </View>
                                                        )}
                                                </View>
                                        )}

                                        {/* Vibhag Selection */}
                                        {hasVibhags && (
                                                <View style={styles.expandableSection}>
                                                        <Text style={styles.vibhagLabel}>विभाग निवडा:</Text>
                                                        {VILLAGE_DATA[selectedVillage][selectedBhag].map((vibhag) => (
                                                                <TouchableOpacity
                                                                        key={vibhag}
                                                                        style={[styles.vibhagItem, selectedVibhag === vibhag && styles.vibhagItemSelected]}
                                                                        onPress={() => handleVibhagSelect(vibhag)}
                                                                >
                                                                        <Text style={styles.vibhagItemText}>{vibhag}</Text>
                                                                        {selectedVibhag === vibhag && <Ionicons name="checkmark" size={20} color="green" />}
                                                                </TouchableOpacity>
                                                        ))}
                                                </View>
                                        )}

                                        {/* Manage Users Button */}
                                        <TouchableOpacity style={styles.manageUsersButton} onPress={() => setCurrentView("users")}>
                                                <Ionicons name="people-outline" size={24} color="#fff" />
                                                <Text style={styles.manageUsersButtonText}>फील्ड एजंट व्यवस्थापन</Text>
                                        </TouchableOpacity>

                                        {/* Validation Button */}
                                        <TouchableOpacity style={styles.validationButton} onPress={() => navigation.navigate("AdminValidation")}>
                                                <Ionicons name="shield-checkmark-outline" size={24} color="#fff" />
                                                <Text style={styles.validationButtonText}>फील्ड एजंट मंजुरी</Text>
                                        </TouchableOpacity>
                                </ScrollView>
                        </View>
                )
        }

        if (loading) {
                return (
                        <SafeAreaView style={styles.container}>
                                <StatusBar backgroundColor="#f5f5f5" barStyle="dark-content" />
                                <View style={styles.loadingContainer}>
                                        <ActivityIndicator size="large" color="#2196F3" />
                                        <Text style={styles.loadingText}>डेटा लोड होत आहे...</Text>
                                </View>
                        </SafeAreaView>
                )
        }

        if (selectedUser) {
                return (
                        <SafeAreaView style={styles.container}>
                                <StatusBar backgroundColor="#2196F3" barStyle="light-content" />
                                {renderUserDetail()}
                        </SafeAreaView>
                )
        }

        if (currentView === "users") {
                return <SafeAreaView style={styles.container}>{renderUserManagement()}</SafeAreaView>
        }

        return <SafeAreaView style={styles.container}>{renderDashboard()}</SafeAreaView>
}

const styles = StyleSheet.create({
        container: {
                flex: 1,
                backgroundColor: "#f5f5f5",
                marginTop: 30,
        },
        header: {
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                padding: 16,
                backgroundColor: "#fff",
                elevation: 4,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
        },
        headerTitle: {
                fontSize: 18,
                fontWeight: "600",
                color: "#000",
        },
        logoutButton: {
                backgroundColor: "#FF5722",
                width: 40,
                height: 40,
                borderRadius: 20,
                justifyContent: "center",
                alignItems: "center",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.2,
                shadowRadius: 4,
                elevation: 4,
        },
        content: {
                flex: 1,
                padding: 16,
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
        profileSection: {
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 20,
        },
        profileImage: {
                width: 60,
                height: 60,
                borderRadius: 30,
                marginRight: 16,
        },
        profileInfo: {
                flex: 1,
        },
        profileName: {
                fontSize: 18,
                fontWeight: "600",
                color: "#000",
        },
        profileRole: {
                fontSize: 14,
                color: "#666",
                marginTop: 2,
        },
        statsContainer: {
                flexDirection: "row",
                justifyContent: "space-between",
                marginBottom: 16,
        },
        statCard: {
                backgroundColor: "#fff",
                borderRadius: 12,
                padding: 20,
                alignItems: "center",
                width: "48%",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 3,
        },
        statNumber: {
                fontSize: 28,
                fontWeight: "bold",
                color: "#2196F3",
                marginBottom: 8,
        },
        statLabel: {
                fontSize: 14,
                color: "#666",
                textAlign: "center",
                fontWeight: "500",
        },
        selectionHeader: {
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginTop: 20,
                marginBottom: 16,
        },
        selectionTitle: {
                fontSize: 16,
                fontWeight: "600",
                color: "#000",
        },
        clearButton: {
                backgroundColor: "#FF5722",
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 16,
        },
        clearButtonText: {
                color: "#fff",
                fontSize: 12,
                fontWeight: "500",
        },
        expandableSection: {
                backgroundColor: "#fff",
                borderRadius: 12,
                marginBottom: 16,
                overflow: "hidden",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 3,
        },
        expandableHeader: {
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                padding: 16,
        },
        expandableTitle: {
                fontSize: 16,
                color: "#000",
                fontWeight: "500",
        },
        dropdownContent: {
                borderTopWidth: 1,
                borderTopColor: "#eee",
        },
        dropdownItem: {
                padding: 16,
                borderBottomWidth: 1,
                borderBottomColor: "#f0f0f0",
        },
        dropdownItemText: {
                fontSize: 15,
                color: "#333",
        },
        vibhagLabel: {
                padding: 16,
                fontSize: 16,
                fontWeight: "600",
                color: "#000",
                borderBottomWidth: 1,
                borderBottomColor: "#eee",
        },
        vibhagItem: {
                padding: 16,
                borderBottomWidth: 1,
                borderBottomColor: "#f0f0f0",
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
        },
        vibhagItemSelected: {
                backgroundColor: "#f0f8ff",
        },
        vibhagItemText: {
                fontSize: 15,
                color: "#333",
        },
        manageUsersButton: {
                backgroundColor: "#2196F3",
                borderRadius: 12,
                padding: 16,
                alignItems: "center",
                marginTop: 16,
                flexDirection: "row",
                justifyContent: "center",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 3,
        },
        manageUsersButtonText: {
                color: "#fff",
                fontSize: 16,
                fontWeight: "600",
                marginLeft: 8,
        },
        validationButton: {
                backgroundColor: "#FF9800",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                padding: 16,
                borderRadius: 12,
                marginTop: 16,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.2,
                shadowRadius: 4,
                elevation: 4,
        },
        validationButtonText: {
                color: "#fff",
                fontSize: 16,
                fontWeight: "600",
                marginLeft: 8,
        },
        usersSection: {
                marginTop: 8,
        },
        sectionTitle: {
                fontSize: 18,
                fontWeight: "600",
                color: "#000",
                marginBottom: 16,
        },
        userCard: {
                backgroundColor: "#fff",
                borderRadius: 12,
                padding: 16,
                marginBottom: 12,
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 3,
        },
        userInfo: {
                flex: 1,
        },
        userName: {
                fontSize: 16,
                fontWeight: "600",
                color: "#000",
                marginBottom: 4,
        },
        userPhone: {
                fontSize: 14,
                color: "#666",
                marginBottom: 4,
        },
        userType: {
                fontSize: 12,
                fontWeight: "500",
                paddingHorizontal: 8,
                paddingVertical: 2,
                borderRadius: 12,
                overflow: "hidden",
                marginBottom: 8,
        },
        adminType: {
                backgroundColor: "#E3F2FD",
                color: "#1976D2",
        },
        agentType: {
                backgroundColor: "#E8F5E8",
                color: "#388E3C",
        },
        userActivitySummary: {
                marginTop: 4,
        },
        activityText: {
                fontSize: 12,
                color: "#2196F3",
                fontWeight: "500",
        },
        sessionCountText: {
                fontSize: 11,
                color: "#666",
                marginTop: 2,
        },
        userStatus: {
                alignItems: "center",
                flexDirection: "row",
        },
        statusIndicator: {
                width: 8,
                height: 8,
                borderRadius: 4,
                marginRight: 8,
        },
        activeIndicator: {
                backgroundColor: "#4CAF50",
        },
        inactiveIndicator: {
                backgroundColor: "#F44336",
        },
        statusText: {
                fontSize: 12,
                color: "#666",
                marginRight: 8,
        },
        userDetailContainer: {
                flex: 1,
                backgroundColor: "#f5f5f5",
        },
        userDetailHeader: {
                backgroundColor: "#2196F3",
                padding: 16,
                flexDirection: "row",
                alignItems: "center",
                elevation: 4,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.2,
                shadowRadius: 4,
        },
        backButton: {
                backgroundColor: "rgba(255,255,255,0.2)",
                width: 36,
                height: 36,
                borderRadius: 18,
                justifyContent: "center",
                alignItems: "center",
                marginRight: 16,
        },
        userDetailTitle: {
                fontSize: 18,
                fontWeight: "600",
                color: "#fff",
        },
        userDetailContent: {
                flex: 1,
                padding: 16,
        },
        userInfoCard: {
                backgroundColor: "#fff",
                borderRadius: 12,
                padding: 20,
                marginBottom: 16,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 3,
        },
        userDetailName: {
                fontSize: 24,
                fontWeight: "bold",
                color: "#000",
                marginBottom: 8,
        },
        userDetailPhone: {
                fontSize: 16,
                color: "#666",
                marginBottom: 16,
        },
        userTypeContainer: {
                marginBottom: 16,
        },
        userTypeBadge: {
                fontSize: 14,
                fontWeight: "600",
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 16,
                alignSelf: "flex-start",
        },
        adminBadge: {
                backgroundColor: "#E3F2FD",
                color: "#1976D2",
        },
        agentBadge: {
                backgroundColor: "#E8F5E8",
                color: "#388E3C",
        },
        statusRow: {
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                paddingVertical: 8,
                borderBottomWidth: 1,
                borderBottomColor: "#f0f0f0",
        },
        statusLabel: {
                fontSize: 14,
                color: "#666",
                fontWeight: "500",
        },
        statusValue: {
                fontSize: 14,
                color: "#000",
                fontWeight: "400",
        },
        activeStatus: {
                color: "#4CAF50",
                fontWeight: "600",
        },
        inactiveStatus: {
                color: "#F44336",
                fontWeight: "600",
        },
        autoLogout: {
                color: "#FF9800",
                fontWeight: "600",
        },
        manualLogout: {
                color: "#2196F3",
                fontWeight: "600",
        },
        sessionHistoryCard: {
                backgroundColor: "#fff",
                borderRadius: 12,
                padding: 20,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 3,
        },
        sessionItem: {
                borderBottomWidth: 1,
                borderBottomColor: "#f0f0f0",
                paddingVertical: 12,
                position: "relative",
        },
        sessionHeader: {
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 4,
        },
        sessionNumber: {
                fontSize: 14,
                fontWeight: "600",
                color: "#000",
        },
        sessionStatus: {
                fontSize: 12,
                fontWeight: "500",
                paddingHorizontal: 8,
                paddingVertical: 2,
                borderRadius: 10,
        },
        completedSession: {
                backgroundColor: "#E8F5E8",
                color: "#388E3C",
        },
        activeSession: {
                backgroundColor: "#FFF3E0",
                color: "#F57C00",
        },
        sessionTime: {
                fontSize: 12,
                color: "#666",
                marginBottom: 2,
        },
        sessionDuration: {
                fontSize: 11,
                color: "#999",
                fontStyle: "italic",
                marginBottom: 4,
        },
        sessionStats: {
                marginTop: 8,
                paddingVertical: 4,
                paddingHorizontal: 8,
                backgroundColor: "#f0f0f0",
                borderRadius: 8,
        },
        sessionStatsText: {
                fontSize: 12,
                color: "#333",
                fontWeight: "500",
        },
        sessionChevron: {
                position: "absolute",
                right: 10,
                top: "50%",
                transform: [{ translateY: -8 }],
        },
        noDataText: {
                fontSize: 14,
                color: "#666",
                textAlign: "center",
                fontStyle: "italic",
                paddingVertical: 20,
        },
        emptyContainer: {
                padding: 40,
                alignItems: "center",
        },
        emptyText: {
                fontSize: 16,
                color: "#666",
                textAlign: "center",
        },
        actionStatsCard: {
                backgroundColor: "#fff",
                borderRadius: 12,
                padding: 20,
                marginBottom: 16,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 3,
        },
        statsRow: {
                flexDirection: "row",
                justifyContent: "space-around",
                alignItems: "center",
        },
        statItem: {
                alignItems: "center",
        },
        sessionDetailModal: {
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: "rgba(0, 0, 0, 0.5)",
                justifyContent: "center",
                alignItems: "center",
                zIndex: 1000,
        },
        sessionDetailContent: {
                backgroundColor: "#fff",
                borderRadius: 12,
                width: "90%",
                maxHeight: "80%",
                overflow: "hidden",
        },
        sessionDetailHeader: {
                backgroundColor: "#2196F3",
                padding: 16,
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
        },
        sessionDetailTitle: {
                fontSize: 18,
                fontWeight: "600",
                color: "#fff",
        },
        sessionDetailScroll: {
                padding: 16,
        },
        sessionDetailInfo: {
                flexDirection: "row",
                justifyContent: "space-between",
                marginBottom: 12,
                paddingVertical: 8,
                borderBottomWidth: 1,
                borderBottomColor: "#f0f0f0",
        },
        sessionDetailLabel: {
                fontSize: 14,
                fontWeight: "500",
                color: "#333",
                flex: 1,
        },
        sessionDetailValue: {
                fontSize: 14,
                color: "#666",
                flex: 1,
                textAlign: "right",
        },
        sessionActionStats: {
                marginTop: 16,
                borderTopWidth: 2,
                borderTopColor: "#2196F3",
                paddingTop: 16,
        },
        sessionActionTitle: {
                fontSize: 16,
                fontWeight: "600",
                color: "#000",
                marginBottom: 16,
                textAlign: "center",
        },
        sessionActionGrid: {
                flexDirection: "row",
                justifyContent: "space-between",
                marginBottom: 16,
        },
        sessionActionCard: {
                backgroundColor: "#f8f9fa",
                borderRadius: 8,
                padding: 16,
                flex: 0.48,
                alignItems: "center",
        },
        sessionActionNumber: {
                fontSize: 24,
                fontWeight: "bold",
                color: "#2196F3",
                marginBottom: 4,
        },
        sessionActionLabel: {
                fontSize: 12,
                color: "#666",
                textAlign: "center",
        },
        sessionSummary: {
                backgroundColor: "#e3f2fd",
                borderRadius: 8,
                padding: 16,
                marginTop: 8,
        },
        sessionSummaryTitle: {
                fontSize: 16,
                fontWeight: "bold",
                color: "#1976d2",
                marginBottom: 8,
        },
        sessionSummaryText: {
                fontSize: 14,
                color: "#1565c0",
                lineHeight: 20,
        },
        sessionLocation: {
                fontSize: 11,
                color: "#666",
                marginBottom: 2,
                fontStyle: "italic",
        },
})

export default AdminDashboardScreen
