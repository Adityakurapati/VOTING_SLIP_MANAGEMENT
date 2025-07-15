"use client"

import { useState, useEffect } from "react"
import { View, Text, StyleSheet, TouchableOpacity } from "react-native"
import { getAuth, signOut } from "firebase/auth"
import { getDatabase, ref, onValue } from "firebase/database"

const ProfileScreen = ({ navigation }) => {
        const [userType, setUserType] = useState("")
        const [phoneNumber, setPhoneNumber] = useState("")
        const auth = getAuth()
        const database = getDatabase()

        useEffect(() => {
                const user = auth.currentUser
                if (user) {
                        const userRef = ref(database, `users/${user.uid}`)
                        const unsubscribe = onValue(userRef, (snapshot) => {
                                const userData = snapshot.val()
                                if (userData) {
                                        setUserType(userData.userType || "फील्ड एजंट")
                                        setPhoneNumber(userData.phone || "")
                                }
                        })
                        return () => unsubscribe()
                }
        }, [])

        const handleLogout = async () => {
                try {
                        const user = auth.currentUser
                        if (user) {
                                // Update logout time in database
                                const userRef = ref(database, `users/${user.uid}`)
                                const logoutTime = new Date().toISOString()
                                await update(userRef, {
                                        lastLogout: logoutTime,
                                        currentSession: null
                                })
                        }
                        await signOut(auth)
                        navigation.replace("Login")
                } catch (error) {
                        console.error("Logout error:", error)
                }
        }

        return (
                <View style={styles.container}>
                        <Text style={styles.title}>प्रोफाइल</Text>

                        <View style={styles.infoContainer}>
                                <Text style={styles.label}>वापरकर्ता प्रकार:</Text>
                                <Text style={styles.value}>{userType}</Text>
                        </View>

                        <View style={styles.infoContainer}>
                                <Text style={styles.label}>मोबाईल नंबर:</Text>
                                <Text style={styles.value}>{phoneNumber}</Text>
                        </View>

                        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                                <Text style={styles.logoutButtonText}>लॉगआउट करा</Text>
                        </TouchableOpacity>
                </View>
        )
}

const styles = StyleSheet.create({
        container: {
                flex: 1,
                padding: 20,
                backgroundColor: '#fff',
        },
        title: {
                fontSize: 24,
                fontWeight: 'bold',
                marginBottom: 30,
                textAlign: 'center',
        },
        infoContainer: {
                marginBottom: 20,
                paddingBottom: 10,
                borderBottomWidth: 1,
                borderBottomColor: '#eee',
        },
        label: {
                fontSize: 16,
                color: '#666',
        },
        value: {
                fontSize: 18,
                marginTop: 5,
        },
        logoutButton: {
                marginTop: 30,
                backgroundColor: '#ff4444',
                padding: 15,
                borderRadius: 8,
                alignItems: 'center',
        },
        logoutButtonText: {
                color: 'white',
                fontSize: 18,
                fontWeight: 'bold',
        },
})

export default ProfileScreen