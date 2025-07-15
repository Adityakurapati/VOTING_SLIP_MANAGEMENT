"use client"

import { useState, useEffect } from "react"
import {
        View,
        Text,
        StyleSheet,
        TouchableOpacity,
        ScrollView,
        TextInput,
        FlatList,
        ActivityIndicator,
        SafeAreaView,
        StatusBar,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { getDatabase, ref, onValue } from "firebase/database"
import { getAuth, signOut } from "firebase/auth"
import { format, parseISO, isToday, isYesterday, differenceInMinutes } from "date-fns"

type Session = {
        id: string
        loginTime: string
        logoutTime: string | null
}

type User = {
        uid: string
        phone: string
        currentSession: string | null
        lastLogin?: string
        lastLogout?: string
        userType?: string
        sessions: Record<string, Session>
}

const AdminDashboardScreen = ({ navigation }) => {
        const [usersData, setUsersData] = useState<Record<string, User>>({})
        const [loading, setLoading] = useState(true)
        const [searchTerm, setSearchTerm] = useState("")
        const [activeOnly, setActiveOnly] = useState(false)
        const [selectedUser, setSelectedUser] = useState<User | null>(null)
        const database = getDatabase()
        const auth = getAuth()

        useEffect(() => {
                const usersRef = ref(database, "users")
                const unsubscribe = onValue(usersRef, (snapshot) => {
                        if (snapshot.exists()) {
                                const data = snapshot.val()
                                const processedData: Record<string, User> = {}

                                Object.entries(data).forEach(([uid, userData]: [string, any]) => {
                                        processedData[uid] = {
                                                uid,
                                                phone: userData.phone || "N/A",
                                                currentSession: userData.currentSession || null,
                                                lastLogin: userData.lastLogin,
                                                lastLogout: userData.lastLogout,
                                                userType: userData.userType || "फील्ड एजंट",
                                                sessions: userData.sessions || {},
                                        }
                                })

                                setUsersData(processedData)
                        }
                        setLoading(false)
                })

                return () => unsubscribe()
        }, [])

        const handleLogout = async () => {
                try {
                        await signOut(auth)
                        navigation.reset({
                                index: 0,
                                routes: [{ name: "Auth" }],
                        })
                } catch (error) {
                        console.error("Logout error:", error)
                }
        }

        const filteredUsers = Object.entries(usersData).filter(([userId, user]) => {
                const matchesSearch = user.phone.includes(searchTerm) || userId.includes(searchTerm)
                const matchesActive = !activeOnly || user.currentSession !== null
                return matchesSearch && matchesActive
        })

        const formatDateTime = (isoString?: string) => {
                if (!isoString) return "कधीच नाही"
                const date = new Date(isoString)
                return date.toLocaleString("mr-IN", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                })
        }

        const getTotalActiveUsers = () => {
                return Object.values(usersData).filter((user) => user.currentSession).length
        }

        const getTotalUsers = () => {
                return Object.keys(usersData).length
        }

        const renderUserItem = ({ item }: { item: [string, User] }) => {
                const [userId, user] = item
                const isActive = user.currentSession !== null

                return (
                        <TouchableOpacity style={styles.userCard} onPress={() => setSelectedUser(user)}>
                                <View style={styles.userInfo}>
                                        <View style={styles.userHeader}>
                                                <Text style={styles.userPhone}>{user.phone}</Text>
                                                <View style={styles.userTypeAndStatus}>
                                                        <Text style={styles.userTypeText}>{user.userType}</Text>
                                                        <View style={[styles.statusIndicator, { backgroundColor: isActive ? "#4CAF50" : "#FF5722" }]} />
                                                </View>
                                        </View>
                                        <Text style={styles.userId}>ID: {userId.substring(0, 8)}...</Text>
                                        <View style={styles.sessionInfo}>
                                                <Text style={styles.sessionText}>शेवटचे लॉगिन: {formatDateTime(user.lastLogin)}</Text>
                                                <Text style={styles.sessionText}>शेवटचे लॉगआउट: {formatDateTime(user.lastLogout)}</Text>
                                        </View>
                                </View>
                                <Ionicons name="chevron-forward" size={20} color="#666" />
                        </TouchableOpacity>
                )
        }

        if (loading) {
                return (
                        <SafeAreaView style={styles.container}>
                                <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" />
                                <View style={styles.loadingContainer}>
                                        <ActivityIndicator size="large" color="#3B82F6" />
                                        <Text style={styles.loadingText}>डेटा लोड होत आहे...</Text>
                                </View>
                        </SafeAreaView>
                )
        }

        if (selectedUser) {
                return <UserDetailView user={selectedUser} onBack={() => setSelectedUser(null)} />
        }

        return (
                <SafeAreaView style={styles.container}>
                        <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" />

                        <View style={styles.header}>
                                <Text style={styles.title}>प्रशासन डैशबोर्ड</Text>
                                <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
                                        <Ionicons name="log-out-outline" size={20} color="#fff" />
                                </TouchableOpacity>
                        </View>

                        {/* Stats Cards */}
                        <View style={styles.statsContainer}>
                                <View style={styles.statCard}>
                                        <Text style={styles.statNumber}>{getTotalUsers()}</Text>
                                        <Text style={styles.statLabel}>एकूण वापरकर्ते</Text>
                                </View>
                                <View style={styles.statCard}>
                                        <Text style={styles.statNumber}>{getTotalActiveUsers()}</Text>
                                        <Text style={styles.statLabel}>सक्रिय वापरकर्ते</Text>
                                </View>
                        </View>

                        {/* Search and filter controls */}
                        <View style={styles.controls}>
                                <View style={styles.searchContainer}>
                                        <Ionicons name="search" size={20} color="#666" />
                                        <TextInput
                                                style={styles.searchInput}
                                                placeholder="फोन नंबर किंवा ID शोधा..."
                                                value={searchTerm}
                                                onChangeText={setSearchTerm}
                                        />
                                </View>
                                <TouchableOpacity
                                        style={[styles.filterButton, activeOnly && styles.activeFilter]}
                                        onPress={() => setActiveOnly(!activeOnly)}
                                >
                                        <Text style={[styles.filterButtonText, activeOnly && styles.activeFilterText]}>
                                                {activeOnly ? "सर्व" : "सक्रिय"}
                                        </Text>
                                </TouchableOpacity>
                        </View>

                        {/* User list */}
                        <FlatList
                                data={filteredUsers}
                                renderItem={renderUserItem}
                                keyExtractor={([userId]) => userId}
                                style={styles.usersList}
                                showsVerticalScrollIndicator={false}
                                ListEmptyComponent={
                                        <View style={styles.emptyContainer}>
                                                <Text style={styles.emptyText}>कोणतेही वापरकर्ते सापडले नाहीत</Text>
                                        </View>
                                }
                        />
                </SafeAreaView>
        )
}

const UserDetailView = ({ user, onBack }: { user: User; onBack: () => void }) => {
        const groupedSessions = Object.values(user.sessions || {}).reduce(
                (acc, session) => {
                        const dateKey = format(parseISO(session.loginTime), "yyyy-MM-dd")
                        if (!acc[dateKey]) {
                                acc[dateKey] = []
                        }
                        acc[dateKey].push(session)
                        return acc
                },
                {} as Record<string, Session[]>,
        )

        const sortedDates = Object.keys(groupedSessions).sort((a, b) => new Date(b).getTime() - new Date(a).getTime())

        const totalSessionTime = Object.values(user.sessions || {}).reduce((total, session) => {
                if (session.logoutTime) {
                        return total + differenceInMinutes(new Date(session.logoutTime), new Date(session.loginTime))
                }
                return total
        }, 0)

        const formatDateLabel = (dateString: string) => {
                const date = new Date(dateString)
                if (isToday(date)) return "आज"
                if (isYesterday(date)) return "काल"
                return format(date, "dd MMM yyyy")
        }

        const formatTime = (isoString: string) => {
                return format(parseISO(isoString), "h:mm a")
        }

        return (
                <SafeAreaView style={styles.container}>
                        <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" />

                        <View style={styles.header}>
                                <TouchableOpacity onPress={onBack} style={styles.backButton}>
                                        <Ionicons name="arrow-back" size={24} color="#333" />
                                </TouchableOpacity>
                                <Text style={styles.title}>वापरकर्ता तपशील</Text>
                                <View style={styles.headerSpacer} />
                        </View>

                        <ScrollView style={styles.detailContent}>
                                {/* User Info */}
                                <View style={styles.userDetailCard}>
                                        <Text style={styles.userDetailPhone}>{user.phone}</Text>
                                        <Text style={styles.userDetailId}>ID: {user.uid.substring(0, 12)}...</Text>
                                        <Text style={styles.userDetailType}>प्रकार: {user.userType}</Text>

                                        <View style={styles.userStats}>
                                                <View style={styles.stat}>
                                                        <Text style={styles.statLabel}>एकूण सेशन</Text>
                                                        <Text style={styles.statValue}>{Object.keys(user.sessions || {}).length}</Text>
                                                </View>

                                                <View style={styles.stat}>
                                                        <Text style={styles.statLabel}>एकूण वेळ</Text>
                                                        <Text style={styles.statValue}>
                                                                {Math.floor(totalSessionTime / 60)}h {totalSessionTime % 60}m
                                                        </Text>
                                                </View>

                                                <View style={styles.stat}>
                                                        <Text style={styles.statLabel}>स्थिती</Text>
                                                        <Text style={[styles.statValue, user.currentSession ? styles.statActive : styles.statInactive]}>
                                                                {user.currentSession ? "सक्रिय" : "निष्क्रिय"}
                                                        </Text>
                                                </View>
                                        </View>
                                </View>

                                {/* Session History */}
                                <View style={styles.sessionHistory}>
                                        <Text style={styles.sectionTitle}>सेशन इतिहास</Text>

                                        {sortedDates.length > 0 ? (
                                                sortedDates.map((date) => (
                                                        <View key={date} style={styles.dateGroup}>
                                                                <Text style={styles.dateLabel}>{formatDateLabel(date)}</Text>

                                                                <View style={styles.sessionsList}>
                                                                        {groupedSessions[date]
                                                                                .sort((a, b) => new Date(b.loginTime).getTime() - new Date(a.loginTime).getTime())
                                                                                .map((session, index) => {
                                                                                        const isCurrent = session.id === user.currentSession
                                                                                        const loginTime = parseISO(session.loginTime)
                                                                                        const logoutTime = session.logoutTime ? parseISO(session.logoutTime) : null
                                                                                        const duration = logoutTime
                                                                                                ? differenceInMinutes(logoutTime, loginTime)
                                                                                                : differenceInMinutes(new Date(), loginTime)

                                                                                        return (
                                                                                                <View key={index} style={[styles.sessionItem, isCurrent && styles.currentSessionItem]}>
                                                                                                        <View style={styles.sessionTimeRow}>
                                                                                                                <Text style={styles.sessionTime}>
                                                                                                                        {formatTime(session.loginTime)} -{" "}
                                                                                                                        {session.logoutTime ? formatTime(session.logoutTime) : "सक्रिय आहे"}
                                                                                                                </Text>
                                                                                                                {isCurrent && (
                                                                                                                        <View style={styles.currentBadge}>
                                                                                                                                <Text style={styles.currentBadgeText}>सक्रिय</Text>
                                                                                                                        </View>
                                                                                                                )}
                                                                                                        </View>
                                                                                                        <Text style={styles.sessionDuration}>
                                                                                                                कालावधी: {Math.floor(duration / 60)}h {duration % 60}m
                                                                                                        </Text>
                                                                                                </View>
                                                                                        )
                                                                                })}
                                                                </View>
                                                        </View>
                                                ))
                                        ) : (
                                                <Text style={styles.noSessions}>कोणताही सेशन इतिहास उपलब्ध नाही</Text>
                                        )}
                                </View>
                        </ScrollView>
                </SafeAreaView>
        )
}

const styles = StyleSheet.create({
        container: {
                flex: 1,
                backgroundColor: "#f5f5f5",
                marginTop: 25,
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
                paddingHorizontal: 20,
                paddingVertical: 16,
                backgroundColor: "#fff",
                borderBottomWidth: 1,
                borderBottomColor: "#e0e0e0",
                shadowColor: "#000",
                shadowOffset: {
                        width: 0,
                        height: 2,
                },
                shadowOpacity: 0.1,
                shadowRadius: 3,
                elevation: 3,
        },
        title: {
                fontSize: 20,
                fontWeight: "bold",
                color: "#333",
                flex: 1,
                textAlign: "center",
        },
        logoutButton: {
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: "#FF5722",
                justifyContent: "center",
                alignItems: "center",
                shadowColor: "#FF5722",
                shadowOffset: {
                        width: 0,
                        height: 2,
                },
                shadowOpacity: 0.3,
                shadowRadius: 4,
                elevation: 4,
        },
        backButton: {
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: "#f0f0f0",
                justifyContent: "center",
                alignItems: "center",
        },
        headerSpacer: {
                width: 40,
        },
        statsContainer: {
                flexDirection: "row",
                paddingHorizontal: 20,
                paddingVertical: 20,
                gap: 16,
        },
        statCard: {
                flex: 1,
                backgroundColor: "#fff",
                borderRadius: 16,
                padding: 24,
                alignItems: "center",
                shadowColor: "#000",
                shadowOffset: {
                        width: 0,
                        height: 2,
                },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 3,
        },
        statNumber: {
                fontSize: 28,
                fontWeight: "bold",
                color: "#333",
                marginBottom: 8,
        },
        statLabel: {
                fontSize: 14,
                color: "#666",
                textAlign: "center",
                fontWeight: "500",
        },
        controls: {
                flexDirection: "row",
                paddingHorizontal: 20,
                marginBottom: 20,
                gap: 12,
        },
        searchContainer: {
                flex: 1,
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: "#fff",
                borderRadius: 12,
                paddingHorizontal: 16,
                paddingVertical: 12,
                shadowColor: "#000",
                shadowOffset: {
                        width: 0,
                        height: 1,
                },
                shadowOpacity: 0.1,
                shadowRadius: 2,
                elevation: 2,
        },
        searchInput: {
                flex: 1,
                marginLeft: 12,
                fontSize: 16,
                color: "#333",
        },
        filterButton: {
                paddingHorizontal: 20,
                paddingVertical: 12,
                backgroundColor: "#e0e0e0",
                borderRadius: 12,
                justifyContent: "center",
                alignItems: "center",
        },
        activeFilter: {
                backgroundColor: "#3498db",
        },
        filterButtonText: {
                color: "#333",
                fontWeight: "600",
                fontSize: 14,
        },
        activeFilterText: {
                color: "#fff",
        },
        usersList: {
                flex: 1,
                paddingHorizontal: 20,
        },
        userCard: {
                backgroundColor: "#fff",
                borderRadius: 12,
                padding: 16,
                marginBottom: 12,
                flexDirection: "row",
                alignItems: "center",
                shadowColor: "#000",
                shadowOffset: {
                        width: 0,
                        height: 1,
                },
                shadowOpacity: 0.1,
                shadowRadius: 2,
                elevation: 2,
        },
        userInfo: {
                flex: 1,
        },
        userHeader: {
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 6,
        },
        userPhone: {
                fontSize: 16,
                fontWeight: "600",
                color: "#333",
        },
        userTypeAndStatus: {
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
        },
        userTypeText: {
                fontSize: 11,
                color: "#666",
                backgroundColor: "#f0f0f0",
                paddingHorizontal: 8,
                paddingVertical: 3,
                borderRadius: 12,
                fontWeight: "500",
        },
        statusIndicator: {
                width: 10,
                height: 10,
                borderRadius: 5,
        },
        userId: {
                fontSize: 12,
                color: "#666",
                marginBottom: 8,
        },
        sessionInfo: {
                gap: 3,
        },
        sessionText: {
                fontSize: 12,
                color: "#666",
        },
        emptyContainer: {
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
                padding: 40,
        },
        emptyText: {
                fontSize: 16,
                color: "#666",
                textAlign: "center",
        },
        detailContent: {
                flex: 1,
                paddingHorizontal: 20,
        },
        userDetailCard: {
                backgroundColor: "#fff",
                borderRadius: 16,
                padding: 24,
                marginTop: 20,
                marginBottom: 24,
                shadowColor: "#000",
                shadowOffset: {
                        width: 0,
                        height: 2,
                },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 3,
        },
        userDetailPhone: {
                fontSize: 22,
                fontWeight: "bold",
                color: "#333",
                marginBottom: 6,
        },
        userDetailId: {
                fontSize: 14,
                color: "#666",
                marginBottom: 6,
        },
        userDetailType: {
                fontSize: 14,
                color: "#3498db",
                marginBottom: 20,
                fontWeight: "500",
        },
        userStats: {
                flexDirection: "row",
                justifyContent: "space-between",
        },
        stat: {
                alignItems: "center",
                minWidth: 80,
        },
        statValue: {
                fontSize: 16,
                fontWeight: "bold",
                color: "#333",
        },
        statActive: {
                color: "#2ecc71",
        },
        statInactive: {
                color: "#e74c3c",
        },
        sessionHistory: {
                marginBottom: 30,
        },
        sectionTitle: {
                fontSize: 18,
                fontWeight: "bold",
                color: "#333",
                marginBottom: 16,
        },
        dateGroup: {
                marginBottom: 20,
        },
        dateLabel: {
                fontSize: 16,
                color: "#3498db",
                marginBottom: 12,
                paddingBottom: 6,
                borderBottomWidth: 1,
                borderBottomColor: "#eee",
                fontWeight: "600",
        },
        sessionsList: {
                marginBottom: 12,
        },
        sessionItem: {
                backgroundColor: "#f8f9fa",
                borderRadius: 12,
                padding: 16,
                marginBottom: 8,
                borderLeftWidth: 4,
                borderLeftColor: "#3498db",
        },
        currentSessionItem: {
                backgroundColor: "#e8f4fc",
                borderLeftColor: "#2ecc71",
        },
        sessionTimeRow: {
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 8,
        },
        sessionTime: {
                fontWeight: "500",
                color: "#333",
                fontSize: 14,
        },
        currentBadge: {
                backgroundColor: "#2ecc71",
                borderRadius: 12,
                paddingHorizontal: 10,
                paddingVertical: 4,
        },
        currentBadgeText: {
                color: "#fff",
                fontSize: 10,
                fontWeight: "bold",
        },
        sessionDuration: {
                fontSize: 13,
                color: "#666",
        },
        noSessions: {
                color: "#666",
                fontStyle: "italic",
                textAlign: "center",
                padding: 20,
                fontSize: 14,
        },
})

export default AdminDashboardScreen
