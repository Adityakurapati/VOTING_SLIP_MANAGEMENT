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

// Import the local dataset
import localDataset from "../contexts/dataset.json"

// Hardcoded data structure based on your requirements
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

        const { refreshVoters, loading } = useVoters()

        // Function to calculate statistics from local dataset
        const calculateStats = (village: string, bhag: string, vibhag: string) => {
                try {
                        const villageData = localDataset[village as keyof typeof localDataset]

                        if (!villageData) {
                                setStats({ totalVoters: 0, slipIssued: 0, votingDone: 0 })
                                return
                        }

                        const divisionData = villageData[bhag as keyof typeof villageData]
                        if (!divisionData) {
                                setStats({ totalVoters: 0, slipIssued: 0, votingDone: 0 })
                                return
                        }

                        const vibhagData = divisionData[vibhag as keyof typeof divisionData]
                        if (!vibhagData) {
                                setStats({ totalVoters: 0, slipIssued: 0, votingDone: 0 })
                                return
                        }

                        const voterList = vibhagData["मतदार_यादी"]
                        if (!voterList || !Array.isArray(voterList)) {
                                setStats({ totalVoters: 0, slipIssued: 0, votingDone: 0 })
                                return
                        }

                        let totalVoters = 0
                        let slipIssued = 0
                        let votingDone = 0

                        voterList.forEach((voter: any) => {
                                totalVoters++
                                if (voter["स्लिप जारी केली"] === true) {
                                        slipIssued++
                                }
                                if (voter["मतदान झाले"] === true) {
                                        votingDone++
                                }
                        })

                        setStats({
                                totalVoters,
                                slipIssued,
                                votingDone,
                        })
                } catch (error) {
                        console.error("Error calculating stats:", error)
                        setStats({ totalVoters: 0, slipIssued: 0, votingDone: 0 })
                }
        }

        // Update stats when selection changes
        useEffect(() => {
                if (selectedVillage && selectedBhag && selectedVibhag) {
                        calculateStats(selectedVillage, selectedBhag, selectedVibhag)
                }
        }, [selectedVillage, selectedBhag, selectedVibhag])

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
                                                <Text style={styles.profileName}>एजंट अॅलेक्स</Text>
                                                <Text style={styles.profileRole}>फोल्ड एजंट</Text>
                                        </View>
                                </View>

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
                marginBottom: 8,
        },
        statLabel: {
                fontSize: 14,
                color: "#666",
                textAlign: "center",
                fontWeight: "500",
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