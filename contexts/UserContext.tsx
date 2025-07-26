"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { getAuth, onAuthStateChanged, type User } from "firebase/auth"
import { getDatabase, ref, onValue } from "firebase/database"

type UserType = "फील्ड एजंट" | "प्रशासन"

interface UserData {
        uid: string
        phone: string
        userType: UserType
        fullName?: string
        currentSession?: string
        lastLogin?: string
        loginLocation?: any
        isActive?: boolean
        total_slips_issued?: number
        total_voting_done?: number
        sessions?: any
}

interface UserContextType {
        user: UserData | null
        setUser: (user: UserData | null) => void
        userType: UserType
        setUserType: (type: UserType) => void
        userId: string | null
        phoneNumber: string | null
        loading: boolean
}

const UserContext = createContext<UserContextType>({
        user: null,
        setUser: () => { },
        userType: "फील्ड एजंट",
        setUserType: () => { },
        userId: null,
        phoneNumber: null,
        loading: true,
})

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
        const [user, setUser] = useState<UserData | null>(null)
        const [userType, setUserType] = useState<UserType>("फील्ड एजंट")
        const [userId, setUserId] = useState<string | null>(null)
        const [phoneNumber, setPhoneNumber] = useState<string | null>(null)
        const [loading, setLoading] = useState(true)

        useEffect(() => {
                const auth = getAuth()
                const database = getDatabase()

                const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser: User | null) => {
                        if (firebaseUser) {
                                setUserId(firebaseUser.uid)

                                // Fetch user data from Realtime Database
                                const userRef = ref(database, `users/${firebaseUser.uid}`)
                                const unsubscribeDB = onValue(userRef, (snapshot) => {
                                        const userData = snapshot.val()
                                        if (userData) {
                                                const userInfo: UserData = {
                                                        uid: firebaseUser.uid,
                                                        phone: userData.phone || "",
                                                        userType: userData.userType || "फील्ड एजंट",
                                                        fullName: userData.fullName,
                                                        currentSession: userData.currentSession,
                                                        lastLogin: userData.lastLogin,
                                                        loginLocation: userData.loginLocation,
                                                        isActive: userData.isActive,
                                                        total_slips_issued: userData.total_slips_issued || 0,
                                                        total_voting_done: userData.total_voting_done || 0,
                                                        sessions: userData.sessions,
                                                }

                                                setUser(userInfo)
                                                setPhoneNumber(userData.phone || null)
                                                setUserType(userData.userType || "फील्ड एजंट")
                                        }
                                        setLoading(false)
                                })

                                return () => unsubscribeDB()
                        } else {
                                setUser(null)
                                setUserId(null)
                                setPhoneNumber(null)
                                setLoading(false)
                        }
                })

                return () => unsubscribeAuth()
        }, [])

        const value = {
                user,
                setUser,
                userType,
                setUserType,
                userId,
                phoneNumber,
                loading,
        }

        return <UserContext.Provider value={value}>{children}</UserContext.Provider>
}

export const useUser = () => {
        const context = useContext(UserContext)
        if (!context) {
                throw new Error("useUser must be used within a UserProvider")
        }
        return context
}

export { UserContext }
