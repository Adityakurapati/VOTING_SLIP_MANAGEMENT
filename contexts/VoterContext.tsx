"use client"

import type React from "react"
import { createContext, useContext, useState, useCallback } from "react"
import { ref, onValue, update, runTransaction, push } from "firebase/database" // add runTransaction (and push if needed) for safe counter updates
import { database } from "../firebaseConfig"
import AsyncStorage from "@react-native-async-storage/async-storage" // read agent session info for per-session tracking

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
                                const votersRef = ref(database, `villages/${village}/${division}/${vibhag}`)

                                return new Promise<void>((resolve, reject) => {
                                        const unsubscribe = onValue(
                                                votersRef,
                                                (snapshot) => {
                                                        try {
                                                                const data = snapshot.val()
                                                                if (data) {
                                                                        const votersData = Object.entries(data).map(([key, value]) => ({
                                                                                ...(value as any),
                                                                                firebaseKey: key,
                                                                                village,
                                                                                division,
                                                                                vibhag,
                                                                        }))
                                                                        setVoters(votersData)
                                                                        resolve()
                                                                } else {
                                                                        setVoters([])
                                                                        setError("No voters found in this area")
                                                                        reject("No voters found")
                                                                }
                                                        } catch (err: any) {
                                                                setError(err.message)
                                                                reject(err)
                                                        } finally {
                                                                setLoading(false)
                                                        }
                                                },
                                                (error) => {
                                                        setError(error.message)
                                                        setLoading(false)
                                                        reject(error)
                                                },
                                        )

                                        return () => unsubscribe()
                                })
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
                                // Update the voter record first
                                const voterRef = ref(
                                        database,
                                        `villages/${voter.village}/${voter.division}/${voter.vibhag}/${voter.firebaseKey}`,
                                )

                                await update(voterRef, { [field]: value })

                                // Optimistic update for the local list
                                setVoters((prevVoters) =>
                                        prevVoters.map((v) => (v.firebaseKey === voter.firebaseKey ? { ...v, [field]: value } : v)),
                                )

                                try {
                                        // Determine if this change corresponds to "slip issued" or "voting done"
                                        const isSlipField = field.includes("स्लिप")
                                        const isVotingField = field.includes("मतदान")
                                        if (!isSlipField && !isVotingField) {
                                                return true // nothing else to track
                                        }

                                        // Compute delta (+1 when turning true, -1 when turning false)
                                        const prevVal = Boolean(voter[field])
                                        const newVal = Boolean(value)
                                        let delta = 0
                                        if (newVal && !prevVal) delta = 1
                                        else if (!newVal && prevVal) delta = -1

                                        if (delta === 0) {
                                                return true // no counter change
                                        }

                                        // Read current agent session (userId and sessionId)
                                        const raw = await AsyncStorage.getItem("session")
                                        const sessionData = raw ? (JSON.parse(raw) as { userId?: string; currentSession?: string }) : null
                                        const userId = sessionData?.userId
                                        const sessionId = sessionData?.currentSession

                                        if (!userId || !sessionId) {
                                                // No active session to attribute work to
                                                return true
                                        }

                                        const metricKey = isSlipField ? "slips_issued" : "voting_done"

                                        // Transactionally update session-level aggregate counter
                                        await runTransaction(ref(database, `users/${userId}/sessions/${sessionId}/${metricKey}`), (current) =>
                                                typeof current === "number" ? current + delta : delta,
                                        )

                                        // Also maintain user-level total counters
                                        const userTotalKey = isSlipField ? "total_slips_issued" : "total_voting_done"
                                        await runTransaction(ref(database, `users/${userId}/${userTotalKey}`), (current) =>
                                                typeof current === "number" ? current + delta : delta,
                                        )

                                        // Track per-section counters for this session to support admin breakdowns
                                        const vVillage = sanitizeKey(voter.village)
                                        const vDivision = sanitizeKey(voter.division)
                                        const vVibhag = sanitizeKey(voter.vibhag)

                                        await runTransaction(
                                                ref(
                                                        database,
                                                        `users/${userId}/sessions/${sessionId}/sections/${vVillage}/${vDivision}/${vVibhag}/${metricKey}`,
                                                ),
                                                (current) => (typeof current === "number" ? current + delta : delta),
                                        )

                                        // Optional: Append a lightweight activity log entry (helps with auditing)
                                        const activityRef = push(ref(database, `users/${userId}/sessions/${sessionId}/activities`))
                                        await update(activityRef, {
                                                type: metricKey,
                                                voterKey: voter.firebaseKey || null,
                                                voterName: voter["नाव"] || null,
                                                village: voter.village || null,
                                                division: voter.division || null,
                                                vibhag: voter.vibhag || null,
                                                change: delta,
                                                at: new Date().toISOString(),
                                        })
                                } catch (trackingErr) {
                                        // Do not fail the main operation if tracking fails
                                        console.warn("[VoterContext] tracking error:", trackingErr)
                                }

                                return true
                        } catch (err: any) {
                                setError(err.message)
                                // Revert optimistic update if needed
                                setVoters((prevVoters) => [...prevVoters])
                                return false
                        } finally {
                                setLoading(false)
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
