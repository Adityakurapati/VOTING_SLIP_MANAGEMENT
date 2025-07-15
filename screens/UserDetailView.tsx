import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native"
import { format, parseISO, isToday, isYesterday, differenceInMinutes } from "date-fns"

type Session = {
        id: string
        loginTime: string
        logoutTime: string | null
}

type User = {
        id: string
        phone: string
        currentSession: string | null
        sessions: Record<string, Session>
}

const UserDetailView = ({ user, userId, onBack }: { user: User; userId: string; onBack: () => void }) => {
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

        return (
                <ScrollView style={styles.container}>
                        <TouchableOpacity style={styles.backButton} onPress={onBack}>
                                <Text style={styles.backButtonText}>← Back to all users</Text>
                        </TouchableOpacity>

                        <View style={styles.userHeader}>
                                <View style={styles.userInfo}>
                                        <Text style={styles.userPhone}>{user.phone}</Text>
                                        <Text style={styles.userId}>User ID: {userId}</Text>
                                </View>

                                <View style={styles.userStats}>
                                        <View style={styles.stat}>
                                                <Text style={styles.statLabel}>Total Sessions</Text>
                                                <Text style={styles.statValue}>{Object.keys(user.sessions || {}).length}</Text>
                                        </View>

                                        <View style={styles.stat}>
                                                <Text style={styles.statLabel}>Total Time</Text>
                                                <Text style={styles.statValue}>
                                                        {Math.floor(totalSessionTime / 60)}h {totalSessionTime % 60}m
                                                </Text>
                                        </View>

                                        <View style={styles.stat}>
                                                <Text style={styles.statLabel}>Status</Text>
                                                <Text style={[styles.statValue, user.currentSession ? styles.statActive : styles.statInactive]}>
                                                        {user.currentSession ? "Active" : "Inactive"}
                                                </Text>
                                        </View>
                                </View>
                        </View>

                        <View style={styles.sessionHistory}>
                                <Text style={styles.sectionTitle}>Session History</Text>

                                {sortedDates.length > 0 ? (
                                        sortedDates.map((date) => {
                                                const dateObj = new Date(date)
                                                let dateLabel: string

                                                if (isToday(dateObj)) {
                                                        dateLabel = "Today"
                                                } else if (isYesterday(dateObj)) {
                                                        dateLabel = "Yesterday"
                                                } else {
                                                        dateLabel = format(dateObj, "MMMM d, yyyy")
                                                }

                                                return (
                                                        <View key={date} style={styles.dateGroup}>
                                                                <Text style={styles.dateLabel}>{dateLabel}</Text>

                                                                <View style={styles.sessionsList}>
                                                                        {groupedSessions[date]
                                                                                .sort((a, b) => new Date(b.loginTime).getTime() - new Date(a.loginTime).getTime())
                                                                                .map((session) => (
                                                                                        <SessionItem
                                                                                                key={session.loginTime}
                                                                                                session={session}
                                                                                                isCurrent={session.id === user.currentSession}
                                                                                        />
                                                                                ))}
                                                                </View>
                                                        </View>
                                                )
                                        })
                                ) : (
                                        <Text style={styles.noSessions}>No session history available</Text>
                                )}
                        </View>
                </ScrollView>
        )
}

const SessionItem = ({ session, isCurrent }: { session: Session; isCurrent: boolean }) => {
        const loginTime = parseISO(session.loginTime)
        const logoutTime = session.logoutTime ? parseISO(session.logoutTime) : null

        const duration = logoutTime ? differenceInMinutes(logoutTime, loginTime) : differenceInMinutes(new Date(), loginTime)

        return (
                <View style={[styles.sessionItem, isCurrent && styles.currentSessionItem]}>
                        <View style={styles.sessionTimeRow}>
                                <Text style={styles.sessionTime}>
                                        {format(loginTime, "h:mm a")} - {logoutTime ? format(logoutTime, "h:mm a") : "Active now"}
                                </Text>
                                {isCurrent && (
                                        <View style={styles.currentBadge}>
                                                <Text style={styles.currentBadgeText}>CURRENT</Text>
                                        </View>
                                )}
                        </View>

                        <Text style={styles.sessionDuration}>
                                Duration: {Math.floor(duration / 60)}h {duration % 60}m
                        </Text>

                        <Text style={styles.sessionDate}>{format(loginTime, "MMM d, yyyy")}</Text>
                </View>
        )
}

const styles = StyleSheet.create({
        container: {
                flex: 1,
                backgroundColor: "#f5f5f5",
                padding: 16,
        },
        backButton: {
                marginBottom: 20,
                paddingVertical: 8,
        },
        backButtonText: {
                color: "#3498db",
                fontSize: 16,
        },
        userHeader: {
                marginBottom: 24,
                paddingBottom: 16,
                borderBottomWidth: 1,
                borderBottomColor: "#eee",
        },
        userInfo: {
                marginBottom: 16,
        },
        userPhone: {
                fontSize: 22,
                fontWeight: "bold",
                color: "#333",
                marginBottom: 4,
        },
        userId: {
                fontSize: 14,
                color: "#666",
        },
        userStats: {
                flexDirection: "row",
                justifyContent: "space-between",
        },
        stat: {
                alignItems: "center",
                minWidth: 100,
        },
        statLabel: {
                fontSize: 12,
                color: "#666",
                marginBottom: 4,
        },
        statValue: {
                fontSize: 18,
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
                marginBottom: 20,
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
                paddingBottom: 4,
                borderBottomWidth: 1,
                borderBottomColor: "#eee",
        },
        sessionsList: {
                marginBottom: 12,
        },
        sessionItem: {
                backgroundColor: "#f8f9fa",
                borderRadius: 8,
                padding: 16,
                marginBottom: 8,
                borderLeftWidth: 3,
                borderLeftColor: "#3498db",
        },
        currentSessionItem: {
                backgroundColor: "#e8f4fc",
                borderLeftColor: "#2ecc71",
        },
        sessionTimeRow: {
                flexDirection: "row",
                justifyContent: "space-between",
                marginBottom: 8,
        },
        sessionTime: {
                fontWeight: "500",
        },
        currentBadge: {
                backgroundColor: "#2ecc71",
                borderRadius: 10,
                paddingHorizontal: 8,
                paddingVertical: 2,
                alignSelf: "flex-start",
        },
        currentBadgeText: {
                color: "#fff",
                fontSize: 10,
                fontWeight: "bold",
        },
        sessionDuration: {
                fontSize: 14,
                color: "#666",
                marginBottom: 4,
        },
        sessionDate: {
                fontSize: 12,
                color: "#999",
        },
        noSessions: {
                color: "#666",
                fontStyle: "italic",
                textAlign: "center",
                padding: 20,
        },
})

export default UserDetailView
