import React, { useState } from 'react';
import {
        View,
        Text,
        StyleSheet,
        SafeAreaView,
        TouchableOpacity,
        Image,
        ScrollView,
        Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ref, update } from 'firebase/database';
import { database } from '../firebaseConfig';
const VoterDetailScreen = ({ route, navigation }) => {
        const { voter } = route.params;

        // Debug: Log the received voter data
        console.log('Received voter data:', voter);

        if (!voter.firebaseKey) {
                Alert.alert('त्रुटी', 'मतदाराची माहिती अपूर्ण आहे');
                navigation.goBack();
                return null;
        }

        const [currentVoter, setCurrentVoter] = useState(voter);

        const updateStatus = async (field, value) => {
                try {
                        console.log('Updating:', field, value, 'for key:', voter.firebaseKey);

                        const voterRef = ref(database,
                                `villages/${voter.village}/${voter.division}/${voter.vibhag}/मतदार_यादी/${voter.firebaseKey}`
                        );

                        await update(voterRef, {
                                [field]: value
                        });

                        setCurrentVoter(prev => ({
                                ...prev,
                                [field]: value
                        }));

                        Alert.alert('यशस्वी', 'स्थिती अद्यतनित केली');
                } catch (error) {
                        console.error('Update failed:', error);
                        Alert.alert('त्रुटी', 'अद्यतन अयशस्वी');
                }
        };

        const toggleSlipIssued = async () => {
                const newValue = !currentVoter['स्लिप जारी केली'];
                await updateStatus('स्लिप जारी केली', newValue);
        };

        const toggleVoted = async () => {
                if (!currentVoter['स्लिप जारी केली']) {
                        Alert.alert('चूक', 'प्रथम स्लिप जारी करा');
                        return;
                }
                const newValue = !currentVoter['मतदान झाले'];
                await updateStatus('मतदान झाले', newValue);
        };

        return (
                <SafeAreaView style={styles.container}>
                        {/* Header */}
                        <View style={styles.header}>
                                <TouchableOpacity onPress={() => navigation.goBack()}>
                                        <Ionicons name="arrow-back" size={24} color="#000" />
                                </TouchableOpacity>
                                <Text style={styles.headerTitle}>मतदार तपशील</Text>
                        </View>

                        <ScrollView style={styles.content}>
                                {/* Voter Info Section */}
                                <View style={styles.statusSection}>
                                        <Text style={styles.sectionTitle}>स्थिती</Text>

                                        <View style={styles.statusRow}>
                                                <Text style={styles.statusLabel}>सद्य स्थिती:</Text>
                                                <View style={styles.statusDisplay}>
                                                        <Text style={styles.statusText}>
                                                                {currentVoter['मतदान झाले'] ? 'मतदान झाले' :
                                                                        currentVoter['स्लिप जारी केली'] ? 'स्लिप जारी केली' : 'प्रलंबित'}
                                                        </Text>
                                                        <View style={[styles.statusIndicator, {
                                                                backgroundColor: currentVoter['मतदान झाले'] ? '#4CAF50' :
                                                                        currentVoter['स्लिप जारी केली'] ? '#FFA500' : '#666'
                                                        }]} />
                                                </View>
                                        </View>

                                        {/* Toggle Buttons */}
                                        <View style={styles.toggleContainer}>
                                                <Text style={styles.toggleLabel}>स्लिप जारी करा:</Text>
                                                <TouchableOpacity
                                                        style={[
                                                                styles.toggleButton,
                                                                currentVoter['स्लिप जारी केली'] && styles.toggleActive
                                                        ]}
                                                        onPress={toggleSlipIssued}
                                                >
                                                        <Text style={styles.toggleText}>
                                                                {currentVoter['स्लिप जारी केली'] ? 'होय' : 'नाही'}
                                                        </Text>
                                                </TouchableOpacity>
                                        </View>

                                        <View style={styles.toggleContainer}>
                                                <Text style={styles.toggleLabel}>मतदान झाले:</Text>
                                                <TouchableOpacity
                                                        style={[
                                                                styles.toggleButton,
                                                                currentVoter['मतदान झाले'] && styles.toggleActive,
                                                                !currentVoter['स्लिप जारी केली'] && styles.toggleDisabled
                                                        ]}
                                                        onPress={toggleVoted}
                                                        disabled={!currentVoter['स्लिप जारी केली']}
                                                >
                                                        <Text style={[
                                                                styles.toggleText,
                                                                !currentVoter['स्लिप जारी केली'] && styles.toggleTextDisabled
                                                        ]}>
                                                                {currentVoter['मतदान झाले'] ? 'होय' : 'नाही'}
                                                        </Text>
                                                </TouchableOpacity>
                                        </View>
                                </View>
                        </ScrollView>
                </SafeAreaView>
        );
};

const styles = StyleSheet.create({
        container: {
                flex: 1,
                backgroundColor: '#f5f5f5',
        },
        header: {
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 16,
                paddingVertical: 12,
                backgroundColor: '#fff',
                borderBottomWidth: 1,
                borderBottomColor: '#e0e0e0',
        },
        headerTitle: {
                fontSize: 18,
                fontWeight: '600',
                marginLeft: 16,
                color: '#000',
        },
        content: {
                flex: 1,
                paddingHorizontal: 16,
        },
        voterCard: {
                backgroundColor: '#4A90A4',
                borderRadius: 12,
                padding: 20,
                marginTop: 16,
                marginBottom: 24,
        },
        cardHeader: {
                alignItems: 'center',
                marginBottom: 20,
        },
        voterLabel: {
                color: '#000',
                fontSize: 16,
                fontWeight: 'bold',
        },
        voterInfo: {
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: '#E8F4F8',
                borderRadius: 8,
                padding: 16,
                marginBottom: 16,
        },
        avatarContainer: {
                alignItems: 'center',
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
                fontWeight: 'bold',
                color: '#000',
        },
        infoLines: {
                flex: 1,
        },
        infoLine: {
                height: 8,
                backgroundColor: '#A8DADC',
                borderRadius: 4,
                marginBottom: 6,
                width: '80%',
        },
        infoLineLong: {
                height: 8,
                backgroundColor: '#A8DADC',
                borderRadius: 4,
                width: '60%',
        },
        minimalText: {
                color: '#000',
                fontSize: 10,
                textAlign: 'center',
                opacity: 0.7,
        },
        detailsSection: {
                backgroundColor: '#fff',
                borderRadius: 12,
                padding: 20,
                marginBottom: 20,
        },
        sectionTitle: {
                fontSize: 16,
                fontWeight: 'bold',
                color: '#000',
                marginBottom: 16,
        },
        detailsGrid: {
                gap: 16,
        },
        detailRow: {
                flexDirection: 'row',
                gap: 16,
        },
        detailItem: {
                flex: 1,
        },
        detailLabel: {
                fontSize: 12,
                color: '#666',
                marginBottom: 4,
        },
        detailValue: {
                fontSize: 14,
                color: '#000',
                fontWeight: '500',
        },
        voterIdSection: {
                marginTop: 8,
        },
        voterIdValue: {
                fontSize: 16,
                color: '#2196F3',
                fontWeight: 'bold',
        },
        statusSection: {
                backgroundColor: '#fff',
                borderRadius: 12,
                padding: 20,
                marginBottom: 20,
        },
        statusRow: {
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
        },
        statusText: {
                fontSize: 14,
                color: '#000',
        },
        statusIndicator: {
                width: 16,
                height: 16,
                borderRadius: 8,
        },
        buttonContainer: {
                gap: 12,
                paddingBottom: 20,
        },
        primaryButton: {
                backgroundColor: '#2196F3',
                borderRadius: 8,
                paddingVertical: 14,
                alignItems: 'center',
        },
        primaryButtonText: {
                color: '#fff',
                fontSize: 16,
                fontWeight: '600',
        },
        secondaryButton: {
                backgroundColor: '#f0f0f0',
                borderRadius: 8,
                paddingVertical: 14,
                alignItems: 'center',
        },
        secondaryButtonText: {
                color: '#666',
                fontSize: 16,
                fontWeight: '600',
        },

        statusSection: {
                backgroundColor: '#fff',
                borderRadius: 12,
                padding: 20,
                marginBottom: 20,
        },
        statusContainer: {
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 20,
                padding: 10,
                backgroundColor: '#f5f5f5',
                borderRadius: 8,
        },
        statusToggleContainer: {
                flexDirection: 'row',
                justifyContent: 'space-between',
                marginBottom: 10,
        },
        statusOption: {
                flex: 1,
                padding: 12,
                marginHorizontal: 4,
                borderRadius: 8,
                backgroundColor: '#f0f0f0',
                alignItems: 'center',
        },
        statusOptionActive: {
                backgroundColor: '#4A90A4',
        },
        statusOptionText: {
                color: '#333',
                fontWeight: '500',
        },
        statusOptionTextActive: {
                color: '#fff',
        },
        statusOptionDisabled: {
                color: '#999',
        },
        noteText: {
                color: '#FF8F00',
                fontSize: 14,
                textAlign: 'center',
                marginTop: 10,
        },
});

export default VoterDetailScreen;