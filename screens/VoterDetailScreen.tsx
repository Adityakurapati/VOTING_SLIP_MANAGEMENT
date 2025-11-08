"use client"

import React, { useState } from "react"
import {
        View,
        Text,
        StyleSheet,
        SafeAreaView,
        TouchableOpacity,
        Image,
        ScrollView,
        Alert,
        Switch,
        TextInput,
        ActivityIndicator,
        Platform,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useVoters } from "../contexts/VoterContext"
import { getAuth } from "firebase/auth"
import { getDatabase, ref, update, get } from "firebase/database"
import * as FileSystem from "expo-file-system"
import * as Sharing from "expo-sharing"
import * as MediaLibrary from "expo-media-library"
import { captureRef } from "react-native-view-shot"

const VoterDetailScreen = ({ route, navigation }) => {
        const { voter } = route.params
        const { updateVoterStatus } = useVoters()
        const [currentVoter, setCurrentVoter] = useState(voter)
        const [mobileNumber, setMobileNumber] = useState(voter["मोबाईल_नंबर"] || "")
        const [address, setAddress] = useState(voter["पत्ता"] || "")
        const [isEditing, setIsEditing] = useState(false)
        const [isSaving, setSaving] = useState(false)
        const [isDownloading, setIsDownloading] = useState(false)
        const slipRef = React.useRef()

        const auth = getAuth()
        const database = getDatabase()

        if (!currentVoter.firebaseKey) {
                Alert.alert("त्रुटी", "मतदाराची माहिती अपूर्ण आहे")
                navigation.goBack()
                return null
        }

        const updateUserActionCount = async (actionType) => {
                const user = auth.currentUser
                if (!user) return

                try {
                        const userRef = ref(database, `users/${user.uid}`)
                        const snapshot = await get(userRef)

                        if (snapshot.exists()) {
                                const userData = snapshot.val()
                                const currentSession = userData.currentSession

                                if (currentSession) {
                                        // Update session-specific counts
                                        const sessionRef = ref(database, `users/${user.uid}/sessions/${currentSession}`)
                                        const sessionSnapshot = await get(sessionRef)

                                        if (sessionSnapshot.exists()) {
                                                const sessionData = sessionSnapshot.val()
                                                const currentCount = sessionData[actionType] || 0

                                                await update(sessionRef, {
                                                        [actionType]: currentCount + 1,
                                                })
                                        }
                                }

                                // Update overall user counts
                                const currentTotalCount = userData[`total_${actionType}`] || 0
                                await update(userRef, {
                                        [`total_${actionType}`]: currentTotalCount + 1,
                                })
                        }
                } catch (error) {
                        console.error("Error updating user action count:", error)
                }
        }

        const saveVoterDetails = async () => {
                if (mobileNumber && mobileNumber.length !== 10) {
                        Alert.alert("त्रुटी", "कृपया वैध 10 अंकी मोबाईल नंबर भरा")
                        return
                }

                setSaving(true)
                try {
                        const updates = {}
                        if (mobileNumber !== (currentVoter["मोबाईल_नंबर"] || "")) {
                                updates["मोबाईल_नंबर"] = mobileNumber
                        }
                        if (address !== (currentVoter["पत्ता"] || "")) {
                                updates["पत्ता"] = address
                        }

                        if (Object.keys(updates).length > 0) {
                                const voterRef = ref(
                                        database,
                                        `villages/${currentVoter.village}/${currentVoter.division}/${currentVoter.vibhag}/${currentVoter.firebaseKey}`,
                                )
                                await update(voterRef, updates)

                                setCurrentVoter((prev) => ({
                                        ...prev,
                                        ...updates,
                                }))
                        }

                        setIsEditing(false)
                        Alert.alert("यशस्वी", "मतदाराची माहिती अपडेट झाली")
                } catch (error) {
                        console.error("Error updating voter details:", error)
                        Alert.alert("त्रुटी", "माहिती अपडेट करताना समस्या आली")
                } finally {
                        setSaving(false)
                }
        }

        const toggleSlipIssued = async (value) => {
                if (currentVoter["मतदान झाले"] && !value) {
                        Alert.alert("चूक", "स्लिप रद्द करण्यापूर्वी कृपया मतदान रद्द करा", [
                                {
                                        text: "मतदान रद्द करा",
                                        onPress: () => toggleVoted(false),
                                },
                                {
                                        text: "रद्द करा",
                                        style: "cancel",
                                },
                        ])
                        return
                }

                const success = await updateVoterStatus(currentVoter, "स्लिप जारी केली", value)
                if (success) {
                        setCurrentVoter((prev) => ({
                                ...prev,
                                "स्लिप जारी केली": value,
                        }))

                        if (value) {
                                await updateUserActionCount("slips_issued")
                        }
                }
        }

        const toggleVoted = async (value) => {
                if (value && !currentVoter["स्लिप जारी केली"]) {
                        Alert.alert("चूक", "प्रथम स्लिप जारी करा")
                        return
                }

                const success = await updateVoterStatus(currentVoter, "मतदान झाले", value)
                if (success) {
                        setCurrentVoter((prev) => ({
                                ...prev,
                                "मतदान झाले": value,
                        }))

                        if (value) {
                                await updateUserActionCount("voting_done")
                        }
                }
        }

        const downloadSlip = async () => {
                setIsDownloading(true)
                try {
                        // Capture the slip view first
                        const uri = await captureRef(slipRef, {
                                format: "png",
                                quality: 1,
                                result: "tmpfile",
                                height: 800,
                                width: 600,
                        })

                        const fileName = `voter_slip_${currentVoter["मतदार_ओळखपत्र_क्रमांक"]}_${Date.now()}.png`

                        // Try to save to gallery with proper permission handling
                        let savedToGallery = false

                        if (Platform.OS === "android") {
                                try {
                                        // Check if we have permissions
                                        const { status } = await MediaLibrary.getPermissionsAsync()
                                        let finalStatus = status

                                        if (status !== 'granted') {
                                                const { status: newStatus } = await MediaLibrary.requestPermissionsAsync()
                                                finalStatus = newStatus
                                        }

                                        if (finalStatus === 'granted') {
                                                const asset = await MediaLibrary.createAssetAsync(uri)
                                                await MediaLibrary.createAlbumAsync("Voter Slips", asset, false)
                                                savedToGallery = true
                                        }
                                } catch (galleryError) {
                                        console.log("Gallery save failed, continuing with share only:", galleryError)
                                        // Continue with sharing even if gallery save fails
                                }
                        }

                        // Always try to share the file
                        if (await Sharing.isAvailableAsync()) {
                                await Sharing.shareAsync(uri, {
                                        mimeType: "image/png",
                                        dialogTitle: "मतदार स्लिप शेअर करा",
                                        UTI: "image/png"
                                })
                        } else {
                                // If sharing is not available, show appropriate message
                                if (savedToGallery) {
                                        Alert.alert("यशस्वी", "स्लिप गॅलरीमध्ये सेव्ह झाली")
                                } else {
                                        Alert.alert("माहिती", "स्लिप तयार झाली आहे. शेअरिंग पर्याय उपलब्ध नाहीत.")
                                }
                        }

                } catch (error) {
                        console.error("Error downloading slip:", error)
                        // Show user-friendly error message
                        if (error.message.includes('permission') || error.message.includes('AUDIO')) {
                                Alert.alert(
                                        "परवानगी आवश्यक",
                                        "स्लिप सेव्ह करण्यासाठी परवानगी आवश्यक आहे. कृपया सेटिंगमधून परवानगी द्या.",
                                        [
                                                { text: "ठीक आहे", style: "cancel" },
                                                {
                                                        text: "सेटिंग",
                                                        onPress: () => {
                                                                // You can add navigation to app settings here if needed
                                                        }
                                                }
                                        ]
                                )
                        } else {
                                Alert.alert("त्रुटी", "स्लिप डाउनलोड करताना समस्या आली. कृपया पुन्हा प्रयत्न करा.")
                        }
                } finally {
                        setIsDownloading(false)
                }
        }

        const getStatusText = () => {
                if (currentVoter["मतदान झाले"]) return "मतदान झाले"
                if (currentVoter["स्लिप जारी केली"]) return "स्लिप जारी केली"
                return "प्रलंबित"
        }

        const getStatusColor = () => {
                if (currentVoter["मतदान झाले"]) return "#4CAF50"
                if (currentVoter["स्लिप जारी केली"]) return "#FFA500"
                return "#666"
        }

        const getParentName = () => {
                if (currentVoter["पिता_नाव"]) {
                        return `पिता: ${currentVoter["पिता_नाव"]}`
                } else if (currentVoter["पती_नाव"]) {
                        return `पती: ${currentVoter["पती_नाव"]}`
                }
                return ""
        }

        const getCurrentDate = () => {
                return new Date().toLocaleDateString("hi-IN")
        }

        const getCurrentTime = () => {
                return new Date().toLocaleTimeString("hi-IN")
        }

        return (
                <SafeAreaView style={styles.container}>
                        <View style={styles.header}>
                                <TouchableOpacity onPress={() => navigation.goBack()}>
                                        <Ionicons name="arrow-back" size={24} color="#000" />
                                </TouchableOpacity>
                                <Text style={styles.headerTitle}>मतदार तपशील</Text>
                                <TouchableOpacity
                                        onPress={downloadSlip}
                                        disabled={isDownloading}
                                        style={[
                                                styles.downloadButton,
                                                isDownloading && styles.downloadButtonDisabled
                                        ]}
                                >
                                        {isDownloading ? (
                                                <ActivityIndicator size="small" color="#2196F3" />
                                        ) : (
                                                <Ionicons name="download-outline" size={24} color="#2196F3" />
                                        )}
                                </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                                {/* Your existing JSX content remains the same */}
                                {/* 1. Voter Information Card */}
                                {/* 1. Voter Information Card */}
                                {/* 1. Voter Information Card */}
                                <Image
                                        source={require("../assets/banner.jpeg")}
                                        style={styles.fullWidthImage}
                                        resizeMode="cover"
                                />
                                {/* 2. Demographic Information */}
                                <View style={styles.detailsSection}>
                                        <Text style={styles.sectionTitle}>लोकसंख्याशास्त्रीय माहिती</Text>

                                        <View style={styles.detailsGrid}>
                                                <View style={styles.detailRow}>
                                                        <View style={styles.detailItem}>
                                                                <Text style={styles.detailLabel}>नाव</Text>
                                                                <Text style={styles.detailValue}>{currentVoter["मतदाराचे_पूर्ण_नांव"]}</Text>
                                                        </View>
                                                        <View style={styles.detailItem}>
                                                                <Text style={styles.detailLabel}>पत्ता</Text>
                                                                <Text style={styles.detailValue}>{address || currentVoter.address}</Text>
                                                        </View>
                                                </View>

                                                <View style={styles.detailRow}>
                                                        <View style={styles.detailItem}>
                                                                <Text style={styles.detailLabel}>वय</Text>
                                                                <Text style={styles.detailValue}>{currentVoter["वय"]}</Text>
                                                        </View>
                                                        <View style={styles.detailItem}>
                                                                <Text style={styles.detailLabel}>लिंग</Text>
                                                                <Text style={styles.detailValue}>{currentVoter["लिंग"]}</Text>
                                                        </View>
                                                </View>

                                                <View style={styles.detailRow}>
                                                        <View style={styles.detailItem}>
                                                                <Text style={styles.detailLabel}>संबंध</Text>
                                                                <Text style={styles.detailValue}>{getParentName()}</Text>
                                                        </View>
                                                        <View style={styles.detailItem}>
                                                                <Text style={styles.detailLabel}>क्रमांक</Text>
                                                                <Text style={styles.detailValue}>{currentVoter["क्रमांक"]}</Text>
                                                        </View>
                                                </View>

                                                <View style={styles.voterIdSection}>
                                                        <Text style={styles.detailLabel}>मतदार ओळखपत्र</Text>
                                                        <Text style={styles.voterIdValue}>{currentVoter["मतदार_ओळखपत्र_क्रमांक"]}</Text>
                                                </View>
                                        </View>
                                </View>

                                {/* 3. Contact Information Section */}
                                <View style={styles.contactSection}>
                                        <View style={styles.sectionHeader}>
                                                <Text style={styles.sectionTitle}>संपर्क माहिती</Text>
                                                <TouchableOpacity
                                                        onPress={() => (isEditing ? saveVoterDetails() : setIsEditing(true))}
                                                        disabled={isSaving}
                                                        style={styles.editButton}
                                                >
                                                        {isSaving ? (
                                                                <ActivityIndicator size="small" color="#2196F3" />
                                                        ) : (
                                                                <Ionicons name={isEditing ? "checkmark" : "pencil"} size={20} color="#2196F3" />
                                                        )}
                                                </TouchableOpacity>
                                        </View>

                                        <View style={styles.inputContainer}>
                                                <Text style={styles.inputLabel}>मोबाईल नंबर</Text>
                                                <TextInput
                                                        style={[styles.input, !isEditing && styles.inputDisabled]}
                                                        value={mobileNumber}
                                                        onChangeText={setMobileNumber}
                                                        placeholder="मोबाईल नंबर भरा"
                                                        keyboardType="phone-pad"
                                                        maxLength={10}
                                                        editable={isEditing}
                                                />
                                        </View>

                                        <View style={styles.inputContainer}>
                                                <Text style={styles.inputLabel}>पत्ता</Text>
                                                <TextInput
                                                        style={[styles.input, styles.textArea, !isEditing && styles.inputDisabled]}
                                                        value={address}
                                                        onChangeText={setAddress}
                                                        placeholder="पत्ता भरा"
                                                        multiline
                                                        numberOfLines={3}
                                                        editable={isEditing}
                                                />
                                        </View>

                                        {isEditing && (
                                                <TouchableOpacity onPress={() => setIsEditing(false)} style={styles.cancelButton}>
                                                        <Text style={styles.cancelButtonText}>रद्द करा</Text>
                                                </TouchableOpacity>
                                        )}
                                </View>

                                {/* 4. Voter Status Section */}
                                <View style={styles.statusSection}>
                                        <Text style={styles.sectionTitle}>मतदार स्थिती</Text>

                                        <View style={styles.statusContainer}>
                                                <Text style={styles.statusText}>{getStatusText()}</Text>
                                                <View style={[styles.statusIndicator, { backgroundColor: getStatusColor() }]} />
                                        </View>

                                        <View style={styles.toggleContainer}>
                                                <Text style={styles.toggleLabel}>स्लिप जारी केली</Text>
                                                <Switch
                                                        value={currentVoter["स्लिप जारी केली"]}
                                                        onValueChange={toggleSlipIssued}
                                                        disabled={currentVoter["मतदान झाले"] && currentVoter["स्लिप जारी केली"]}
                                                        thumbColor="#fff"
                                                        trackColor={{
                                                                false: currentVoter["मतदान झाले"] ? "#ccc" : "#767577",
                                                                true: "#4A90A4",
                                                        }}
                                                />
                                        </View>

                                        <View style={styles.toggleContainer}>
                                                <Text style={styles.toggleLabel}>मतदान झाले</Text>
                                                <Switch
                                                        value={currentVoter["मतदान झाले"]}
                                                        onValueChange={toggleVoted}
                                                        disabled={!currentVoter["स्लिप जारी केली"]}
                                                        thumbColor="#fff"
                                                        trackColor={{
                                                                false: !currentVoter["स्लिप जारी केली"] ? "#ccc" : "#767577",
                                                                true: "#4CAF50",
                                                        }}
                                                />
                                        </View>

                                        {!currentVoter["स्लिप जारी केली"] && (
                                                <Text style={styles.noteText}>टीप: प्रथम स्लिप जारी करा, त्यानंतर मतदानाची नोंद करू शकता</Text>
                                        )}
                                </View>

                                {/* 5. Visible Slip Preview */}
                                <View style={styles.slipPreviewSection}>
                                        <Text style={styles.sectionTitle}>मतदार स्लिप पूर्वावलोकन</Text>

                                        <View style={styles.slipPreviewContainer}>
                                                <View style={styles.slipPreviewHeader}>
                                                        <Text style={styles.slipPreviewTitle}>मतदार स्लिप</Text>
                                                        <Text style={styles.slipPreviewSubtitle}>Voter Slip</Text>
                                                        <Text style={styles.slipPreviewDate}>दिनांक: {getCurrentDate()}</Text>
                                                </View>

                                                <View style={styles.slipPreviewContent}>
                                                        <View style={styles.slipPreviewRow}>
                                                                <Text style={styles.slipPreviewLabel}>नाव:</Text>
                                                                <Text style={styles.slipPreviewValue}>{currentVoter["नाव"]}</Text>
                                                        </View>

                                                        <View style={styles.slipPreviewRow}>
                                                                <Text style={styles.slipPreviewLabel}>मतदार ID:</Text>
                                                                <Text style={styles.slipPreviewValue}>{currentVoter["मतदार_ओळखपत्र_क्रमांक"]}</Text>
                                                        </View>

                                                        <View style={styles.slipPreviewRow}>
                                                                <Text style={styles.slipPreviewLabel}>वय:</Text>
                                                                <Text style={styles.slipPreviewValue}>{currentVoter["वय"]} वर्षे</Text>
                                                        </View>

                                                        <View style={styles.slipPreviewRow}>
                                                                <Text style={styles.slipPreviewLabel}>लिंग:</Text>
                                                                <Text style={styles.slipPreviewValue}>{currentVoter["लिंग"]}</Text>
                                                        </View>

                                                        <View style={styles.slipPreviewRow}>
                                                                <Text style={styles.slipPreviewLabel}>पत्ता:</Text>
                                                                <Text style={styles.slipPreviewValue}>{address || currentVoter.address || "N/A"}</Text>
                                                        </View>

                                                        <View style={styles.slipPreviewRow}>
                                                                <Text style={styles.slipPreviewLabel}>मोबाईल:</Text>
                                                                <Text style={styles.slipPreviewValue}>{mobileNumber || "N/A"}</Text>
                                                        </View>

                                                        <View style={styles.slipPreviewRow}>
                                                                <Text style={styles.slipPreviewLabel}>गाव:</Text>
                                                                <Text style={styles.slipPreviewValue}>{currentVoter.village}</Text>
                                                        </View>

                                                        <View style={styles.slipPreviewDivider} />

                                                        <View style={styles.slipPreviewStatusSection}>
                                                                <Text style={styles.slipPreviewStatusTitle}>स्थिती</Text>

                                                                <View style={styles.slipPreviewStatusRow}>
                                                                        <Text style={styles.slipPreviewStatusLabel}>स्लिप जारी:</Text>
                                                                        <Text
                                                                                style={[
                                                                                        styles.slipPreviewStatusValue,
                                                                                        { color: currentVoter["स्लिप जारी केली"] ? "#4CAF50" : "#F44336" },
                                                                                ]}
                                                                        >
                                                                                {currentVoter["स्लिप जारी केली"] ? "✓ होय" : "✗ नाही"}
                                                                        </Text>
                                                                </View>

                                                                <View style={styles.slipPreviewStatusRow}>
                                                                        <Text style={styles.slipPreviewStatusLabel}>मतदान झाले:</Text>
                                                                        <Text
                                                                                style={[
                                                                                        styles.slipPreviewStatusValue,
                                                                                        { color: currentVoter["मतदान झाले"] ? "#4CAF50" : "#F44336" },
                                                                                ]}
                                                                        >
                                                                                {currentVoter["मतदान झाले"] ? "✓ होय" : "✗ नाही"}
                                                                        </Text>
                                                                </View>
                                                        </View>
                                                </View>

                                                <View style={styles.slipPreviewFooter}>
                                                        <Text style={styles.slipPreviewFooterText}>मेघाताई प्रशांत भागवत</Text>
                                                        <Text style={styles.slipPreviewFooterSubText}>Voting Management System</Text>
                                                </View>
                                        </View>
                                </View>

                                {/* Hidden Downloadable Slip View - Positioned off-screen but rendered */}
                                <View style={styles.hiddenSlipContainer}>
                                        <View ref={slipRef} style={styles.slipContainer} collapsable={false}>
                                                {/* Your existing hidden slip JSX remains the same */}
                                                <View style={styles.slipHeader}>
                                                        <Text style={styles.slipTitle}>मतदार स्लिप</Text>
                                                        <Text style={styles.slipSubtitle}>Voter Slip</Text>
                                                        <View style={styles.slipDateContainer}>
                                                                <Text style={styles.slipDate}>दिनांक: {getCurrentDate()}</Text>
                                                                <Text style={styles.slipTime}>वेळ: {getCurrentTime()}</Text>
                                                        </View>
                                                </View>

                                                <View style={styles.slipContent}>
                                                        <View style={styles.slipInfoRow}>
                                                                <Text style={styles.slipLabel}>नाव / Name:</Text>
                                                                <Text style={styles.slipValue}>{currentVoter["मतदाराचे_पूर्ण_नांव"]}</Text>
                                                        </View>

                                                        <View style={styles.slipInfoRow}>
                                                                <Text style={styles.slipLabel}>मतदार ID / Voter ID:</Text>
                                                                <Text style={styles.slipValue}>{currentVoter["मतदार_ओळखपत्र_क्रमांक"]}</Text>
                                                        </View>

                                                        <View style={styles.slipInfoRow}>
                                                                <Text style={styles.slipLabel}>वय / Age:</Text>
                                                                <Text style={styles.slipValue}>{currentVoter["वय"]} वर्षे</Text>
                                                        </View>

                                                        <View style={styles.slipInfoRow}>
                                                                <Text style={styles.slipLabel}>लिंग / Gender:</Text>
                                                                <Text style={styles.slipValue}>{currentVoter["लिंग"]}</Text>
                                                        </View>

                                                        <View style={styles.slipInfoRow}>
                                                                <Text style={styles.slipLabel}>संबंध / Relation:</Text>
                                                                <Text style={styles.slipValue}>{getParentName()}</Text>
                                                        </View>

                                                        <View style={styles.slipInfoRow}>
                                                                <Text style={styles.slipLabel}>पत्ता / Address:</Text>
                                                                <Text style={styles.slipValue}>{address || currentVoter.address || "N/A"}</Text>
                                                        </View>

                                                        <View style={styles.slipInfoRow}>
                                                                <Text style={styles.slipLabel}>मोबाईल / Mobile:</Text>
                                                                <Text style={styles.slipValue}>{mobileNumber || "N/A"}</Text>
                                                        </View>

                                                        <View style={styles.slipInfoRow}>
                                                                <Text style={styles.slipLabel}>गाव / Village:</Text>
                                                                <Text style={styles.slipValue}>{currentVoter.village}</Text>
                                                        </View>

                                                        <View style={styles.slipInfoRow}>
                                                                <Text style={styles.slipLabel}>विभाग / Division:</Text>
                                                                <Text style={styles.slipValue}>{currentVoter.division}</Text>
                                                        </View>

                                                        <View style={styles.slipInfoRow}>
                                                                <Text style={styles.slipLabel}>क्रमांक / Serial No:</Text>
                                                                <Text style={styles.slipValue}>{currentVoter["क्रमांक"]}</Text>
                                                        </View>

                                                        <View style={styles.slipDivider} />

                                                        <View style={styles.slipStatusSection}>
                                                                <Text style={styles.slipStatusTitle}>स्थिती / Status</Text>

                                                                <View style={styles.slipStatusRow}>
                                                                        <Text style={styles.slipStatusLabel}>स्लिप जारी / Slip Issued:</Text>
                                                                        <View style={styles.slipStatusIndicator}>
                                                                                <Text
                                                                                        style={[styles.slipStatusValue, { color: currentVoter["स्लिप जारी केली"] ? "#4CAF50" : "#F44336" }]}
                                                                                >
                                                                                        {currentVoter["स्लिप जारी केली"] ? "✓ होय / Yes" : "✗ नाही / No"}
                                                                                </Text>
                                                                        </View>
                                                                </View>

                                                                <View style={styles.slipStatusRow}>
                                                                        <Text style={styles.slipStatusLabel}>मतदान झाले / Voted:</Text>
                                                                        <View style={styles.slipStatusIndicator}>
                                                                                <Text
                                                                                        style={[styles.slipStatusValue, { color: currentVoter["मतदान झाले"] ? "#4CAF50" : "#F44336" }]}
                                                                                >
                                                                                        {currentVoter["मतदान झाले"] ? "✓ होय / Yes" : "✗ नाही / No"}
                                                                                </Text>
                                                                        </View>
                                                                </View>
                                                        </View>

                                                        <View style={styles.slipFooter}>
                                                                <Text style={styles.slipFooterText}>मेघाताई प्रशांत भागवत</Text>
                                                                <Text style={styles.slipFooterSubText}>Voting Management System</Text>
                                                                <Text style={styles.slipGeneratedText}>
                                                                        Generated on: {getCurrentDate()} at {getCurrentTime()}
                                                                </Text>
                                                        </View>
                                                </View>
                                        </View>
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
                alignItems: "center",
                justifyContent: "space-between",
                paddingHorizontal: 16,
                paddingVertical: 12,
                backgroundColor: "#fff",
                borderBottomWidth: 1,
                borderBottomColor: "#e0e0e0",
        },
        headerTitle: {
                fontSize: 18,
                fontWeight: "600",
                color: "#000",
                flex: 1,
                marginLeft: 16,
        },
        downloadButton: {
                padding: 8,
        },
        content: {
                flex: 1,
                paddingHorizontal: 16,
        },
        fullWidthImage: {
                width: '100%',
                height: 120,
                borderRadius: 12,
                marginTop: 16,
                marginBottom: 24,
        },
        // Voter Card Styles
        voterCard: {
                borderRadius: 12,
                marginTop: 16,
                marginBottom: 24,
                height: 200, // Fixed height
                overflow: 'hidden', // Ensure image doesn't overflow the rounded corners
                backgroundColor: "#4A90A4", // Fallback background color
        },
        voterAvatar: {
                width: '100%', // Make image take full width
                height: '100%', // Make image take full height
        },
        cardHeader: {
                alignItems: "center",
                marginBottom: 20,
        },
        voterLabel: {
                color: "#000",
                fontSize: 16,
                fontWeight: "bold",
        },
        voterInfo: {
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: "#E8F4F8",
                borderRadius: 8,
                padding: 16,
                marginBottom: 16,
        },
        avatarContainer: {
                alignItems: "center",
                marginRight: 20,
        },
        voterAvatar: {
                width: 80,
                height: 80,
                borderRadius: 8,
                marginBottom: 8,
        },
        safearareText: {
                fontSize: 12,
                fontWeight: "bold",
                color: "#000",
        },
        infoLines: {
                flex: 1,
        },
        infoLine: {
                height: 8,
                backgroundColor: "#A8DADC",
                borderRadius: 4,
                marginBottom: 6,
                width: "80%",
        },
        infoLineLong: {
                height: 8,
                backgroundColor: "#A8DADC",
                borderRadius: 4,
                width: "60%",
        },
        minimalText: {
                color: "#000",
                fontSize: 10,
                textAlign: "center",
                opacity: 0.7,
        },
        // Details Section Styles
        detailsSection: {
                backgroundColor: "#fff",
                borderRadius: 12,
                padding: 20,
                marginBottom: 20,
        },
        sectionTitle: {
                fontSize: 16,
                fontWeight: "bold",
                color: "#000",
                marginBottom: 16,
        },
        detailsGrid: {
                gap: 16,
        },
        detailRow: {
                flexDirection: "row",
                gap: 16,
        },
        detailItem: {
                flex: 1,
        },
        detailLabel: {
                fontSize: 12,
                color: "#666",
                marginBottom: 4,
        },
        detailValue: {
                fontSize: 14,
                color: "#000",
                fontWeight: "500",
        },
        voterIdSection: {
                marginTop: 8,
        },
        voterIdValue: {
                fontSize: 16,
                color: "#2196F3",
                fontWeight: "bold",
        },
        // Contact Section Styles
        contactSection: {
                backgroundColor: "#fff",
                borderRadius: 12,
                padding: 20,
                marginBottom: 20,
        },
        sectionHeader: {
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 16,
        },
        editButton: {
                padding: 8,
        },
        inputContainer: {
                marginBottom: 16,
        },
        inputLabel: {
                fontSize: 14,
                fontWeight: "600",
                color: "#333",
                marginBottom: 8,
        },
        input: {
                borderWidth: 1,
                borderColor: "#ddd",
                borderRadius: 8,
                padding: 12,
                fontSize: 16,
                backgroundColor: "#fff",
        },
        inputDisabled: {
                backgroundColor: "#f5f5f5",
                color: "#666",
        },
        textArea: {
                height: 80,
                textAlignVertical: "top",
        },
        cancelButton: {
                backgroundColor: "#f44336",
                borderRadius: 8,
                padding: 12,
                alignItems: "center",
                marginTop: 10,
        },
        cancelButtonText: {
                color: "#fff",
                fontSize: 16,
                fontWeight: "600",
        },
        // Status Section Styles
        statusSection: {
                backgroundColor: "#fff",
                borderRadius: 12,
                padding: 20,
                marginBottom: 20,
        },
        statusContainer: {
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 20,
                padding: 10,
                backgroundColor: "#f5f5f5",
                borderRadius: 8,
        },
        statusText: {
                fontSize: 14,
                color: "#000",
        },
        statusIndicator: {
                width: 16,
                height: 16,
                borderRadius: 8,
        },
        toggleContainer: {
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 16,
        },
        toggleLabel: {
                fontSize: 14,
                color: "#000",
        },
        noteText: {
                color: "#FF8F00",
                fontSize: 14,
                textAlign: "center",
                marginTop: 10,
        },
        // Slip Preview Styles
        slipPreviewSection: {
                backgroundColor: "#fff",
                borderRadius: 12,
                padding: 20,
                marginBottom: 20,
        },
        slipPreviewContainer: {
                backgroundColor: "#ffffff",
                borderRadius: 12,
                padding: 20,
                borderWidth: 2,
                borderColor: "#2196F3",
        },
        slipPreviewHeader: {
                alignItems: "center",
                marginBottom: 20,
                borderBottomWidth: 2,
                borderBottomColor: "#2196F3",
                paddingBottom: 15,
        },
        slipPreviewTitle: {
                fontSize: 24,
                fontWeight: "bold",
                color: "#2196F3",
                marginBottom: 5,
        },
        slipPreviewSubtitle: {
                fontSize: 18,
                color: "#666",
                marginBottom: 10,
        },
        slipPreviewDate: {
                fontSize: 14,
                color: "#333",
                fontWeight: "500",
        },
        slipPreviewContent: {
                gap: 12,
        },
        slipPreviewRow: {
                flexDirection: "row",
                justifyContent: "space-between",
                paddingVertical: 8,
                borderBottomWidth: 1,
                borderBottomColor: "#f0f0f0",
                alignItems: "center",
        },
        slipPreviewLabel: {
                fontSize: 14,
                fontWeight: "600",
                color: "#333",
                flex: 1,
        },
        slipPreviewValue: {
                fontSize: 14,
                color: "#000",
                flex: 1.5,
                textAlign: "right",
                fontWeight: "500",
        },
        slipPreviewDivider: {
                height: 2,
                backgroundColor: "#2196F3",
                marginVertical: 15,
        },
        slipPreviewStatusSection: {
                backgroundColor: "#f8f9fa",
                padding: 15,
                borderRadius: 8,
                marginVertical: 10,
        },
        slipPreviewStatusTitle: {
                fontSize: 16,
                fontWeight: "bold",
                color: "#333",
                textAlign: "center",
                marginBottom: 12,
        },
        slipPreviewStatusRow: {
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 8,
        },
        slipPreviewStatusLabel: {
                fontSize: 14,
                fontWeight: "600",
                color: "#333",
                flex: 1,
        },
        slipPreviewStatusValue: {
                fontSize: 14,
                fontWeight: "bold",
                flex: 1,
                textAlign: "right",
        },
        slipPreviewFooter: {
                alignItems: "center",
                marginTop: 20,
                paddingTop: 15,
                borderTopWidth: 2,
                borderTopColor: "#2196F3",
        },
        slipPreviewFooterText: {
                fontSize: 16,
                fontWeight: "bold",
                color: "#2196F3",
                marginBottom: 5,
        },
        slipPreviewFooterSubText: {
                fontSize: 14,
                color: "#666",
        },
        // Hidden Slip Styles (for export)
        hiddenSlipContainer: {
                position: "absolute",
                left: -9999,
                top: -9999,
                opacity: 0,
        },
        slipContainer: {
                backgroundColor: "#ffffff",
                width: 600,
                padding: 30,
                borderWidth: 3,
                borderColor: "#2196F3",
                borderRadius: 0,
        },
        slipHeader: {
                alignItems: "center",
                marginBottom: 25,
                borderBottomWidth: 2,
                borderBottomColor: "#2196F3",
                paddingBottom: 15,
        },
        slipTitle: {
                fontSize: 28,
                fontWeight: "bold",
                color: "#2196F3",
                marginBottom: 5,
        },
        slipSubtitle: {
                fontSize: 20,
                color: "#666",
                marginBottom: 10,
        },
        slipDateContainer: {
                flexDirection: "row",
                justifyContent: "space-between",
                width: "100%",
        },
        slipDate: {
                fontSize: 16,
                color: "#333",
                fontWeight: "500",
        },
        slipTime: {
                fontSize: 16,
                color: "#333",
                fontWeight: "500",
        },
        slipContent: {
                gap: 15,
        },
        slipInfoRow: {
                flexDirection: "row",
                justifyContent: "space-between",
                paddingVertical: 8,
                borderBottomWidth: 1,
                borderBottomColor: "#f0f0f0",
                alignItems: "center",
        },
        slipLabel: {
                fontSize: 16,
                fontWeight: "600",
                color: "#333",
                flex: 1.2,
        },
        slipValue: {
                fontSize: 16,
                color: "#000",
                flex: 1.8,
                textAlign: "right",
                fontWeight: "500",
        },
        slipDivider: {
                height: 2,
                backgroundColor: "#2196F3",
                marginVertical: 20,
        },
        slipStatusSection: {
                backgroundColor: "#f8f9fa",
                padding: 20,
                borderRadius: 8,
                marginVertical: 10,
        },
        slipStatusTitle: {
                fontSize: 20,
                fontWeight: "bold",
                color: "#333",
                textAlign: "center",
                marginBottom: 15,
        },
        slipStatusRow: {
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 12,
        },
        slipStatusLabel: {
                fontSize: 16,
                fontWeight: "600",
                color: "#333",
                flex: 1,
        },
        slipStatusIndicator: {
                flex: 1,
                alignItems: "flex-end",
        },
        slipStatusValue: {
                fontSize: 16,
                fontWeight: "bold",
        },
        slipFooter: {
                alignItems: "center",
                marginTop: 25,
                paddingTop: 20,
                borderTopWidth: 2,
                borderTopColor: "#2196F3",
        },
        slipFooterText: {
                fontSize: 18,
                fontWeight: "bold",
                color: "#2196F3",
                marginBottom: 5,
        },
        slipFooterSubText: {
                fontSize: 16,
                color: "#666",
                marginBottom: 10,
        },
        slipGeneratedText: {
                fontSize: 12,
                color: "#999",
                fontStyle: "italic",
        },
})

export default VoterDetailScreen
