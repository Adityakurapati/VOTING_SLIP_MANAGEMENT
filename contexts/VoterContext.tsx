"use client"

import type React from "react"
import { createContext, useContext, useState, useCallback } from "react"
import AsyncStorage from "@react-native-async-storage/async-storage"

// Import the local dataset
import localDataset from "./dataset.json"

interface Voter {
        firebaseKey: string
        village: string
        division: string
        vibhag: string
        [key: string]: any
}

interface VoterContextType {
        voters: Voter[]
        loading: boolean
        error: string | null
        currentVillage: string | null
        currentDivision: string | null
        currentVibhag: string | null
        refreshVoters: (village: string, division: string, vibhag: string) => Promise<void>
        updateVoterStatus: (voter: Voter, field: string, value: any) => Promise<boolean>
        clearError: () => void
}

const VoterContext = createContext<VoterContextType>({
        voters: [],
        loading: false,
        error: null,
        currentVillage: null,
        currentDivision: null,
        currentVibhag: null,
        refreshVoters: async () => { },
        updateVoterStatus: async () => false,
        clearError: () => { },
})

export const VoterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
        const [voters, setVoters] = useState<Voter[]>([])
        const [currentVillage, setCurrentVillage] = useState<string | null>(null)
        const [currentDivision, setCurrentDivision] = useState<string | null>(null)
        const [currentVibhag, setCurrentVibhag] = useState<string | null>(null)
        const [loading, setLoading] = useState<boolean>(false)
        const [error, setError] = useState<string | null>(null)

        const clearError = useCallback(() => setError(null), [])

        const sanitizeKey = (key: string) =>
                (key || "")
                        .replaceAll(".", "_")
                        .replaceAll("$", "_")
                        .replaceAll("#", "_")
                        .replaceAll("[", "_")
                        .replaceAll("]", "_")
                        .replaceAll("/", "_")
                        .trim()

        const refreshVoters = useCallback(
                async (village: string, division: string, vibhag: string) => {
                        if (!village || !division || !vibhag) {
                                setError("Invalid village, division, or vibhag")
                                return
                        }

                        setLoading(true)
                        clearError()
                        setCurrentVillage(village)
                        setCurrentDivision(division)
                        setCurrentVibhag(vibhag)

                        try {
                                // Use local dataset instead of Firebase
                                const villageData = localDataset[village as keyof typeof localDataset]

                                if (!villageData) {
                                        setVoters([])
                                        setError("Village not found in dataset")
                                        setLoading(false)
                                        return
                                }

                                const divisionData = villageData[division as keyof typeof villageData]
                                if (!divisionData) {
                                        setVoters([])
                                        setError("Division not found in dataset")
                                        setLoading(false)
                                        return
                                }

                                const vibhagData = divisionData[vibhag as keyof typeof divisionData]
                                if (!vibhagData) {
                                        setVoters([])
                                        setError("Vibhag not found in dataset")
                                        setLoading(false)
                                        return
                                }

                                const voterList = vibhagData["मतदार_यादी"]
                                if (!voterList || !Array.isArray(voterList)) {
                                        setVoters([])
                                        setError("No voters found in this area")
                                        setLoading(false)
                                        return
                                }

                                // Transform the data to match the expected structure
                                const votersData = voterList.map((voter: any, index: number) => ({
                                        ...voter,
                                        firebaseKey: index.toString(),
                                        village,
                                        division,
                                        vibhag,
                                        // Map field names to match the expected structure in the app
                                        "नाव": voter["मतदाराचे_पूर्ण_नांव"] || voter["नाव"] || "",
                                        "मोबाईल_नंबर": voter["मोबाईल_नंबर"] || "",
                                        "पत्ता": voter["पत्ता"] || "",
                                        "वय": voter["वय"] || "",
                                        "लिंग": voter["लिंग"] || "",
                                        "क्रमांक": voter["क्रमांक"] || "",
                                        "मतदार_ओळखपत्र_क्रमांक": voter["मतदार_ओळखपत्र_क्रमांक"] || "",
                                        "स्लिप जारी केली": voter["स्लिप जारी केली"] || false,
                                        "मतदान झाले": voter["मतदान झाले"] || false,
                                        // Handle parent names
                                        "पिता_नाव": voter["वडिलांचे_नाव"] || voter["पिता_नाव"] || "",
                                        "पती_नाव": voter["पतीचे_नाव"] || voter["पती_नाव"] || "",
                                }))

                                setVoters(votersData)
                                setLoading(false)
                        } catch (err: any) {
                                setError(err.message)
                                setLoading(false)
                                throw err
                        }
                },
                [clearError],
        )

        const updateVoterStatus = useCallback(
                async (voter: Voter, field: string, value: any) => {
                        if (!voter?.firebaseKey) {
                                setError("Invalid voter data")
                                return false
                        }

                        setLoading(true)
                        clearError()

                        try {
                                // Since we're using local data, we'll just update the local state
                                // Optimistic update for the local list
                                setVoters((prevVoters) =>
                                        prevVoters.map((v) => (v.firebaseKey === voter.firebaseKey ? { ...v, [field]: value } : v)),
                                )

                                try {
                                        // Determine if this change corresponds to "slip issued" or "voting done"
                                        const isSlipField = field.includes("स्लिप")
                                        const isVotingField = field.includes("मतदान")
                                        if (!isSlipField && !isVotingField) {
                                                setLoading(false)
                                                return true // nothing else to track
                                        }

                                        // Compute delta (+1 when turning true, -1 when turning false)
                                        const prevVal = Boolean(voter[field])
                                        const newVal = Boolean(value)
                                        let delta = 0
                                        if (newVal && !prevVal) delta = 1
                                        else if (!newVal && prevVal) delta = -1

                                        if (delta === 0) {
                                                setLoading(false)
                                                return true // no counter change
                                        }

                                        // Read current agent session (userId and sessionId)
                                        const raw = await AsyncStorage.getItem("session")
                                        const sessionData = raw ? (JSON.parse(raw) as { userId?: string; currentSession?: string }) : null
                                        const userId = sessionData?.userId
                                        const sessionId = sessionData?.currentSession

                                        if (!userId || !sessionId) {
                                                // No active session to attribute work to
                                                setLoading(false)
                                                return true
                                        }

                                        // For local storage, we'll use AsyncStorage to track metrics
                                        const metricKey = isSlipField ? "slips_issued" : "voting_done"
                                        const userTotalKey = isSlipField ? "total_slips_issued" : "total_voting_done"

                                        // Update session metrics in AsyncStorage
                                        const sessionMetricsKey = `session_${sessionId}_metrics`
                                        const sessionMetricsRaw = await AsyncStorage.getItem(sessionMetricsKey)
                                        const sessionMetrics = sessionMetricsRaw ? JSON.parse(sessionMetricsRaw) : {}

                                        sessionMetrics[metricKey] = (sessionMetrics[metricKey] || 0) + delta
                                        await AsyncStorage.setItem(sessionMetricsKey, JSON.stringify(sessionMetrics))

                                        // Update user total metrics
                                        const userMetricsKey = `user_${userId}_metrics`
                                        const userMetricsRaw = await AsyncStorage.getItem(userMetricsKey)
                                        const userMetrics = userMetricsRaw ? JSON.parse(userMetricsRaw) : {}

                                        userMetrics[userTotalKey] = (userMetrics[userTotalKey] || 0) + delta
                                        await AsyncStorage.setItem(userMetricsKey, JSON.stringify(userMetrics))

                                        // Track per-section counters
                                        const vVillage = sanitizeKey(voter.village)
                                        const vDivision = sanitizeKey(voter.division)
                                        const vVibhag = sanitizeKey(voter.vibhag)

                                        const sectionKey = `section_${vVillage}_${vDivision}_${vVibhag}_${metricKey}`
                                        const sectionCountRaw = await AsyncStorage.getItem(sectionKey)
                                        const sectionCount = sectionCountRaw ? parseInt(sectionCountRaw) : 0
                                        await AsyncStorage.setItem(sectionKey, (sectionCount + delta).toString())

                                        // Store activity log
                                        const activityKey = `activity_${sessionId}_${Date.now()}`
                                        const activity = {
                                                type: metricKey,
                                                voterKey: voter.firebaseKey || null,
                                                voterName: voter["नाव"] || voter["मतदाराचे_पूर्ण_नांव"] || null,
                                                village: voter.village || null,
                                                division: voter.division || null,
                                                vibhag: voter.vibhag || null,
                                                change: delta,
                                                at: new Date().toISOString(),
                                        }
                                        await AsyncStorage.setItem(activityKey, JSON.stringify(activity))

                                } catch (trackingErr) {
                                        // Do not fail the main operation if tracking fails
                                        console.warn("[VoterContext] tracking error:", trackingErr)
                                }

                                setLoading(false)
                                return true
                        } catch (err: any) {
                                setError(err.message)
                                // Revert optimistic update if needed
                                setVoters((prevVoters) => [...prevVoters])
                                setLoading(false)
                                return false
                        }
                },
                [clearError],
        )

        const contextValue = {
                voters,
                loading,
                error,
                currentVillage,
                currentDivision,
                currentVibhag,
                refreshVoters,
                updateVoterStatus,
                clearError,
        }

        return <VoterContext.Provider value={contextValue}>{children}</VoterContext.Provider>
}

export const useVoters = () => {
        const context = useContext(VoterContext)
        if (!context) {
                throw new Error("useVoters must be used within a VoterProvider")
        }
        return context
}