"use client"

import { useState, useEffect } from "react"
import {
        View,
        Text,
        StyleSheet,
        SafeAreaView,
        TouchableOpacity,
        Image,
        ScrollView,
        ActivityIndicator,
        StatusBar,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useVoters } from "../contexts/VoterContext"
import { ref, onValue } from "firebase/database"
import { database } from "../firebaseConfig"

// Hardcoded data structure based on your requirements
const VILLAGE_DATA = {
        "इंदुरी": {
                "२२३_गावठाण_इंदुरी": [
                        "इंदुरी_गावठाण_इंदुरी",
                        "इंदुरी_बाजारपेठ_इंदुरी",
                        "काशिद_चाळ_इंदुरी",
                        "इंदुरी_बाजारपेठ_मागील_भाग_इंदुरी",
                        "खांदवे_चाळ_इंदुरी",
                        "शिदीया_मागील_भाग_इंदुरी",
                        "विष्णु_मंदिर_इंदुरी",
                        "पवारवाडा_इंदुरी",
                        "काशिद_मळा_इंदुरी",
                        "काशिद_विट_भट्टी_इंदुरी",
                        "राऊत्त_विट_भट्टी_इंदुरी",
                        "गावठाण_इंदुरी"
                ],
                "भाग - २२४": ["गावठाण इंदुरी", "सुतार वस्ती गावठाण इंदुरी", "गायकवाड वाडा गावठाण इंदुरी", "कॅडबरी वस्ती इंदुरी"],
        }
}

const DashboardScreen = ({ navigation }) => {
        const [expandedSections, setExpandedSections] = useState({
                village: false,
                division: false,
        })
        const [selectedVillage, setSelectedVillage] = useState<string | null>(null)
        const [selectedBhag, setSelectedBhag] = useState<string | null>(null)
        const [selectedVibhag, setSelectedVibhag] = useState<string | null>(null)
        const [stats, setStats] = useState({
                totalVoters: 0,
                slipIssued: 0,
                votingDone: 0,
        })
        const [bhagTotalVoters, setBhagTotalVoters] = useState(0) // Total voters for entire bhag
        const [bhagTotalSlips, setBhagTotalSlips] = useState(0) // Total slips for entire bhag
        const [bhagTotalVoting, setBhagTotalVoting] = useState(0) // Total voting for entire bhag

        const { refreshVoters, loading } = useVoters()

        // Function to calculate total stats for entire bhag (all vibhags combined)
        const calculateBhagTotalStats = (village: string, bhag: string) => {
                const villagesRef = ref(database, "villages")

                onValue(villagesRef, (snapshot) => {
                        const data = snapshot.val()
                        let totalVoters = 0
                        let totalSlips = 0
                        let totalVoting = 0

                        if (data && data[village] && data[village][bhag]) {
                                // Sum up stats from all vibhags in this bhag
                                Object.values(data[village][bhag]).forEach((vibhagData: any) => {
                                        if (vibhagData && typeof vibhagData === 'object') {
                                                const vibhagVoters = Object.keys(vibhagData).length
                                                totalVoters += vibhagVoters

                                                // Calculate slips and voting for this vibhag
                                                Object.values(vibhagData).forEach((voter: any) => {
                                                        if (voter["स्लिप_जारी_केली"] === true || voter["स्लिप जारी केली"] === true) {
                                                                totalSlips++
                                                        }
                                                        if (voter["मतदान_झाले"] === true || voter["मतदान झाले"] === true) {
                                                                totalVoting++
                                                        }
                                                })
                                        }
                                })
                        }

                        setBhagTotalVoters(totalVoters)
                        setBhagTotalSlips(totalSlips)
                        setBhagTotalVoting(totalVoting)
                })
        }

        // Function to calculate stats for specific vibhag
        const calculateVibhagStats = (village: string, bhag: string, vibhag: string) => {
                const villagesRef = ref(database, "villages")

                onValue(villagesRef, (snapshot) => {
                        const data = snapshot.val()
                        let totalVoters = 0
                        let slipIssued = 0
                        let votingDone = 0

                        if (data && data[village] && data[village][bhag] && data[village][bhag][vibhag]) {
                                const voterList = data[village][bhag][vibhag] || {}
                                totalVoters = Object.keys(voterList).length

                                Object.values(voterList).forEach((voter: any) => {
                                        if (voter["स्लिप_जारी_केली"] === true || voter["स्लिप जारी केली"] === true) {
                                                slipIssued++
                                        }
                                        if (voter["मतदान_झाले"] === true || voter["मतदान झाले"] === true) {
                                                votingDone++
                                        }
                                })
                        }

                        setStats({
                                totalVoters,
                                slipIssued,
                                votingDone,
                        })
                })
        }

        // Update bhag total when village and bhag are selected
        useEffect(() => {
                if (selectedVillage && selectedBhag) {
                        calculateBhagTotalStats(selectedVillage, selectedBhag)

                        // Reset vibhag-specific stats
                        setStats({
                                totalVoters: 0,
                                slipIssued: 0,
                                votingDone: 0,
                        })
                }
        }, [selectedVillage, selectedBhag])

        // Update vibhag-specific stats when vibhag is selected
        useEffect(() => {
                if (selectedVillage && selectedBhag && selectedVibhag) {
                        calculateVibhagStats(selectedVillage, selectedBhag, selectedVibhag)
                }
        }, [selectedVibhag])

        const toggleSection = (section: "village" | "division") => {
                setExpandedSections((prev) => ({
                        ...prev,
                        [section]: !prev[section],
                }))
        }

        if (loading) {
                return (
                        <SafeAreaView style={styles.container}>
                                <StatusBar backgroundColor="#f5f5f5" barStyle="dark-content" />
                                <View style={styles.loadingContainer}>
                                        <ActivityIndicator size="large" color="#007AFF" />
                                        <Text style={styles.loadingText}>डेटा लोड होत आहे...</Text>
                                </View>
                        </SafeAreaView>
                )
        }

        const handleVillageSelect = (village: string) => {
                setSelectedVillage(village)
                setSelectedBhag(null)
                setSelectedVibhag(null)
                setBhagTotalVoters(0)
                setBhagTotalSlips(0)
                setBhagTotalVoting(0)
                setStats({ totalVoters: 0, slipIssued: 0, votingDone: 0 })

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

        const handleBhagSelect = (bhag: string) => {
                setSelectedBhag(bhag)
                setSelectedVibhag(null)
                setStats({ totalVoters: 0, slipIssued: 0, votingDone: 0 })
                setExpandedSections({
                        village: false,
                        division: false,
                })
        }

        const handleVibhagSelect = (vibhag: string) => {
                setSelectedVibhag(vibhag)
        }

        const handleSubmit = () => {
                if (selectedVillage && selectedBhag && selectedVibhag) {
                        refreshVoters(selectedVillage, selectedBhag, selectedVibhag)
                        navigation.navigate("Members", {
                                village: selectedVillage,
                                division: selectedBhag,
                                vibhag: selectedVibhag,
                        })
                }
        }

        const hasMultipleBhags = selectedVillage && Object.keys(VILLAGE_DATA[selectedVillage]).length > 1
        const hasVibhags =
                selectedBhag &&
                selectedVillage &&
                VILLAGE_DATA[selectedVillage][selectedBhag] &&
                VILLAGE_DATA[selectedVillage][selectedBhag].length > 0

        // Determine what to show based on selection
        const showOnlyBhagTotal = selectedVillage && selectedBhag && !selectedVibhag
        const showVibhagStats = selectedVillage && selectedBhag && selectedVibhag

        return (
                <SafeAreaView style={styles.container}>
                        <StatusBar backgroundColor="#f5f5f5" barStyle="dark-content" />
                        <View style={styles.header}>
                                <TouchableOpacity>
                                        <Ionicons name="arrow-back" size={24} color="#000" />
                                </TouchableOpacity>
                                <Text style={styles.headerTitle}>डैशबोर्ड</Text>
                        </View>

                        <ScrollView style={styles.content}>
                                <View style={styles.profileSection}>
                                        <Image source={require("../assets/profile-placeholder.png")} style={styles.profileImage} />
                                        <View style={styles.profileInfo}>
                                                <Text style={styles.profileName}>Rohan Patil</Text>
                                                <Text style={styles.profileRole}>Field Agent</Text>
                                        </View>
                                </View>

                                <View style={styles.statsContainer}>
                                        {/* Total Voters - Show bhag total or vibhag total based on selection */}
                                        <View style={styles.statCard}>
                                                <Text style={styles.statNumber}>
                                                        {showOnlyBhagTotal ? bhagTotalVoters :
                                                                showVibhagStats ? stats.totalVoters : "0"}
                                                </Text>
                                                <Text style={styles.statLabel}>एकूण मतदार</Text>
                                                {showOnlyBhagTotal && (
                                                        <Text style={styles.statSubText}>(संपूर्ण भाग)</Text>
                                                )}
                                                {showVibhagStats && (
                                                        <Text style={styles.statSubText}>(विभाग)</Text>
                                                )}
                                        </View>

                                        {/* Slip Issued - Show bhag total or vibhag total based on selection */}
                                        <View style={styles.statCard}>
                                                <Text style={styles.statNumber}>
                                                        {showOnlyBhagTotal ? bhagTotalSlips :
                                                                showVibhagStats ? stats.slipIssued : "0"}
                                                </Text>
                                                <Text style={styles.statLabel}>स्लिप जारी केली</Text>
                                                {showOnlyBhagTotal && (
                                                        <Text style={styles.statSubText}>(संपूर्ण भाग)</Text>
                                                )}
                                                {showVibhagStats && (
                                                        <Text style={styles.statSubText}>(विभाग)</Text>
                                                )}
                                        </View>
                                </View>

                                {/* Voting Done Card - Show bhag total or vibhag total based on selection */}
                                <View style={[styles.statCard, { width: "100%", marginBottom: 16 }]}>
                                        <Text style={styles.statNumber}>
                                                {showOnlyBhagTotal ? bhagTotalVoting :
                                                        showVibhagStats ? stats.votingDone : "0"}
                                        </Text>
                                        <Text style={styles.statLabel}>मतदान झाले</Text>
                                        {showOnlyBhagTotal && (
                                                <Text style={styles.statSubText}>(संपूर्ण भाग)</Text>
                                        )}
                                        {showVibhagStats && (
                                                <Text style={styles.statSubText}>(विभाग)</Text>
                                        )}
                                </View>

                                {/* Selection Status Indicator */}
                                {showOnlyBhagTotal && (
                                        <View style={styles.selectionStatus}>
                                                <Text style={styles.selectionStatusText}>
                                                        ✅ {selectedVillage} - {selectedBhag} निवडले आहे.
                                                </Text>
                                                <Text style={styles.selectionStatusSubText}>
                                                        {bhagTotalVoters} मतदार, {bhagTotalSlips} स्लिप जारी, {bhagTotalVoting} मतदान झाले.
                                                </Text>
                                        </View>
                                )}

                                {showVibhagStats && (
                                        <View style={[styles.selectionStatus, { backgroundColor: "#E3F2FD", borderLeftColor: "#2196F3" }]}>
                                                <Text style={[styles.selectionStatusText, { color: "#1565C0" }]}>
                                                        ✅ {selectedVillage} - {selectedBhag} - {selectedVibhag} निवडले आहे.
                                                </Text>
                                                <Text style={[styles.selectionStatusSubText, { color: "#1976D2" }]}>
                                                        {stats.totalVoters} मतदार, {stats.slipIssued} स्लिप जारी, {stats.votingDone} मतदान झाले.
                                                </Text>
                                        </View>
                                )}

                                {/* Village Dropdown */}
                                <View style={[styles.expandableSection, { marginTop: 20 }]}>
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

                                <TouchableOpacity
                                        style={[
                                                styles.submitButton,
                                                (!selectedVillage || !selectedBhag || !selectedVibhag) && styles.submitButtonDisabled,
                                        ]}
                                        onPress={handleSubmit}
                                        disabled={!selectedVillage || !selectedBhag || !selectedVibhag}
                                >
                                        <Text style={styles.submitButtonText}>पुढे जा</Text>
                                </TouchableOpacity>
                        </ScrollView>
                </SafeAreaView>
        )
}

// Keep all your existing styles exactly the same
const styles = StyleSheet.create({
        container: {
                flex: 1,
                backgroundColor: "#f5f5f5",
        },
        header: {
                flexDirection: "row",
                alignItems: "center",
                padding: 16,
                backgroundColor: "#fff",
                elevation: 2,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
        },
        headerTitle: {
                fontSize: 18,
                fontWeight: "600",
                marginLeft: 16,
                color: "#000",
        },
        content: {
                flex: 1,
                padding: 16,
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
                marginBottom: 4,
        },
        statLabel: {
                fontSize: 14,
                color: "#666",
                textAlign: "center",
                fontWeight: "500",
        },
        statSubText: {
                fontSize: 10,
                color: "#999",
                textAlign: "center",
                marginTop: 2,
        },
        statHint: {
                fontSize: 10,
                color: "#FF9800",
                textAlign: "center",
                marginTop: 4,
                fontStyle: "italic",
        },
        selectionStatus: {
                backgroundColor: "#E8F5E8",
                padding: 12,
                borderRadius: 8,
                marginBottom: 16,
                borderLeftWidth: 4,
                borderLeftColor: "#4CAF50",
        },
        selectionStatusText: {
                fontSize: 14,
                color: "#2E7D32",
                fontWeight: "500",
                marginBottom: 4,
        },
        selectionStatusSubText: {
                fontSize: 12,
                color: "#388E3C",
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
        submitButton: {
                backgroundColor: "#2196F3",
                borderRadius: 12,
                padding: 16,
                alignItems: "center",
                marginTop: 16,
                marginBottom: 26,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 3,
        },
        submitButtonDisabled: {
                backgroundColor: "#cccccc",
        },
        submitButtonText: {
                color: "#fff",
                fontSize: 16,
                fontWeight: "600",
        },
})

export default DashboardScreen