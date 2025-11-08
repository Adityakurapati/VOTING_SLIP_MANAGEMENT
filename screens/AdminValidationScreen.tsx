"use client"

import { useState, useEffect } from "react"
import {
  View,
  Text,
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
import { ref, onValue, update } from "firebase/database"

const AdminValidationScreen = ({ navigation }) => {
  const [pendingUsers, setPendingUsers] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const usersRef = ref(database, "users")
    const unsubscribe = onValue(usersRef, (snapshot) => {
      const data = snapshot.val()
      if (data) {
        // Filter users who need validation (validated: false)
        const pending = Object.keys(data).reduce((acc, userId) => {
          const user = data[userId]
          if (user.userType === "फील्ड एजंट" && user.validated === false) {
            acc[userId] = {
              ...user,
              uid: userId,
            }
          }
          return acc
        }, {})
        setPendingUsers(pending)
      } else {
        setPendingUsers({})
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const handleApproveUser = async (userId, userName) => {
    Alert.alert("वापरकर्ता मंजूर करा", `${userName} या वापरकर्त्याला मंजूरी द्यायची आहे का?`, [
      { text: "रद्द करा", style: "cancel" },
      {
        text: "मंजूर करा",
        onPress: async () => {
          try {
            await update(ref(database, `users/${userId}`), {
              validated: true,
              validatedAt: new Date().toISOString(),
            })
            Alert.alert("यशस्वी", "वापरकर्त्याला मंजूरी दिली गेली")
          } catch (error) {
            console.error("Error approving user:", error)
            Alert.alert("त्रुटी", "वापरकर्त्याला मंजूरी देताना त्रुटी आली")
          }
        },
      },
    ])
  }

  const handleRejectUser = async (userId, userName) => {
    Alert.alert("वापरकर्ता नाकारा", `${userName} या वापरकर्त्याची नोंदणी नाकारायची आहे का? हे कृती अपरिवर्तनीय आहे.`, [
      { text: "रद्द करा", style: "cancel" },
      {
        text: "नाकारा",
        style: "destructive",
        onPress: async () => {
          try {
            await update(ref(database, `users/${userId}`), {
              validated: false,
              rejected: true,
              rejectedAt: new Date().toISOString(),
            })
            Alert.alert("यशस्वी", "वापरकर्त्याची नोंदणी नाकारली गेली")
          } catch (error) {
            console.error("Error rejecting user:", error)
            Alert.alert("त्रुटी", "वापरकर्त्याची नोंदणी नाकारताना त्रुटी आली")
          }
        },
      },
    ])
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

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#f5f5f5" barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>फील्ड एजंट मंजुरी</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content}>
        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{Object.keys(pendingUsers).length}</Text>
            <Text style={styles.statLabel}>प्रतीक्षेत</Text>
          </View>
        </View>

        {/* Pending Users List */}
        <View style={styles.usersSection}>
          <Text style={styles.sectionTitle}>मंजुरीसाठी प्रतीक्षेत</Text>

          {Object.entries(pendingUsers).map(([userId, user]) => (
            <View key={userId} style={styles.userCard}>
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{user.fullName || "Unknown"}</Text>
                <Text style={styles.userPhone}>{user.phone}</Text>
                <Text style={styles.userType}>{user.userType}</Text>
                <Text style={styles.createdAt}>नोंदणी: {new Date(user.createdAt).toLocaleDateString("hi-IN")}</Text>
              </View>

              <View style={styles.actionButtons}>
                <TouchableOpacity style={styles.approveButton} onPress={() => handleApproveUser(userId, user.fullName)}>
                  <Ionicons name="checkmark" size={20} color="#fff" />
                  <Text style={styles.approveButtonText}>मंजूर करा</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.rejectButton} onPress={() => handleRejectUser(userId, user.fullName)}>
                  <Ionicons name="close" size={20} color="#fff" />
                  <Text style={styles.rejectButtonText}>नाकारा</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}

          {Object.keys(pendingUsers).length === 0 && (
            <View style={styles.emptyContainer}>
              <Ionicons name="checkmark-circle" size={64} color="#4CAF50" />
              <Text style={styles.emptyText}>सर्व नोंदणी मंजूर केल्या आहेत</Text>
              <Text style={styles.emptySubtext}>कोणत्याही नवीन नोंदणी प्रतीक्षेत नाहीत</Text>
            </View>
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
  headerSpacer: {
    width: 24,
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
  statsContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  statCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    width: 150,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#FF9800",
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    fontWeight: "500",
  },
  usersSection: {
    flex: 1,
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  userInfo: {
    marginBottom: 16,
  },
  userName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
    marginBottom: 4,
  },
  userPhone: {
    fontSize: 16,
    color: "#666",
    marginBottom: 4,
  },
  userType: {
    fontSize: 14,
    color: "#2196F3",
    fontWeight: "500",
    marginBottom: 4,
  },
  createdAt: {
    fontSize: 12,
    color: "#999",
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  approveButton: {
    backgroundColor: "#4CAF50",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    flex: 0.48,
    justifyContent: "center",
  },
  approveButtonText: {
    color: "#fff",
    fontWeight: "600",
    marginLeft: 4,
  },
  rejectButton: {
    backgroundColor: "#F44336",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    flex: 0.48,
    justifyContent: "center",
  },
  rejectButtonText: {
    color: "#fff",
    fontWeight: "600",
    marginLeft: 4,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#4CAF50",
    marginTop: 16,
    textAlign: "center",
  },
  emptySubtext: {
    fontSize: 14,
    color: "#666",
    marginTop: 8,
    textAlign: "center",
  },
})

export default AdminValidationScreen
