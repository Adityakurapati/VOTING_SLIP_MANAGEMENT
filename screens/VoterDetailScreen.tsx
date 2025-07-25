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
        Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useVoters } from '../contexts/VoterContext';

const VoterDetailScreen = ({ route, navigation }) => {
        const { voter } = route.params;
        const { updateVoterStatus } = useVoters();
        const [currentVoter, setCurrentVoter] = useState(voter);

        if (!currentVoter.firebaseKey) {
                Alert.alert('त्रुटी', 'मतदाराची माहिती अपूर्ण आहे');
                navigation.goBack();
                return null;
        }

        const toggleSlipIssued = async (value) => {
                if (currentVoter['मतदान झाले'] && !value) {
                        Alert.alert(
                                'चूक',
                                'स्लिप रद्द करण्यापूर्वी कृपया मतदान रद्द करा',
                                [
                                        {
                                                text: 'मतदान रद्द करा',
                                                onPress: () => toggleVoted(false)
                                        },
                                        {
                                                text: 'रद्द करा',
                                                style: 'cancel'
                                        }
                                ]
                        );
                        return;
                }

                const success = await updateVoterStatus(currentVoter, 'स्लिप जारी केली', value);
                if (success) {
                        setCurrentVoter(prev => ({
                                ...prev,
                                'स्लिप जारी केली': value
                        }));
                }
        };

        const toggleVoted = async (value) => {
                if (value && !currentVoter['स्लिप जारी केली']) {
                        Alert.alert('चूक', 'प्रथम स्लिप जारी करा');
                        return;
                }
                const success = await updateVoterStatus(currentVoter, 'मतदान झाले', value);
                if (success) {
                        setCurrentVoter(prev => ({
                                ...prev,
                                'मतदान झाले': value
                        }));
                }
        };

        const getStatusText = () => {
                if (currentVoter['मतदान झाले']) return 'मतदान झाले';
                if (currentVoter['स्लिप जारी केली']) return 'स्लिप जारी केली';
                return 'प्रलंबित';
        };

        const getStatusColor = () => {
                if (currentVoter['मतदान झाले']) return '#4CAF50';
                if (currentVoter['स्लिप जारी केली']) return '#FFA500';
                return '#666';
        };

        // Get parent name based on available field
        const getParentName = () => {
                if (currentVoter['पिता_नाव']) {
                        return `पिता: ${currentVoter['पिता_नाव']}`;
                } else if (currentVoter['पती_नाव']) {
                        return `पती: ${currentVoter['पती_नाव']}`;
                }
                return '';
        };

        return (
                <SafeAreaView style={styles.container}>
                        <View style={styles.header}>
                                <TouchableOpacity onPress={() => navigation.goBack()}>
                                        <Ionicons name="arrow-back" size={24} color="#000" />
                                </TouchableOpacity>
                                <Text style={styles.headerTitle}>मतदार तपशील</Text>
                        </View>

                        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                                <View style={styles.voterCard}>
                                        <View style={styles.cardHeader}>
                                                <Text style={styles.voterLabel}>VOTER</Text>
                                        </View>

                                        <View style={styles.voterInfo}>
                                                <View style={styles.avatarContainer}>
                                                        <Image source={require('../assets/default-avatar.png')} style={styles.voterAvatar} />
                                                        <Text style={styles.safearareText}>SAFEARARE</Text>
                                                </View>

                                                <View style={styles.infoLines}>
                                                        <View style={styles.infoLine} />
                                                        <View style={styles.infoLine} />
                                                        <View style={styles.infoLine} />
                                                        <View style={styles.infoLine} />
                                                        <View style={styles.infoLine} />
                                                        <View style={styles.infoLine} />
                                                        <View style={styles.infoLineLong} />
                                                </View>
                                        </View>

                                        <Text style={styles.minimalText}>MINIMAL RESPONSE DONE IF OF WORK</Text>
                                </View>

                                <View style={styles.detailsSection}>
                                        <Text style={styles.sectionTitle}>लोकसंख्याशास्त्रीय माहिती</Text>

                                        <View style={styles.detailsGrid}>
                                                <View style={styles.detailRow}>
                                                        <View style={styles.detailItem}>
                                                                <Text style={styles.detailLabel}>नाव</Text>
                                                                <Text style={styles.detailValue}>{currentVoter['नाव']}</Text>
                                                        </View>
                                                        <View style={styles.detailItem}>
                                                                <Text style={styles.detailLabel}>पत्ता</Text>
                                                                <Text style={styles.detailValue}>{currentVoter.address}</Text>
                                                        </View>
                                                </View>

                                                <View style={styles.detailRow}>
                                                        <View style={styles.detailItem}>
                                                                <Text style={styles.detailLabel}>वय</Text>
                                                                <Text style={styles.detailValue}>{currentVoter['वय']}</Text>
                                                        </View>
                                                        <View style={styles.detailItem}>
                                                                <Text style={styles.detailLabel}>लिंग</Text>
                                                                <Text style={styles.detailValue}>{currentVoter['लिंग']}</Text>
                                                        </View>
                                                </View>

                                                <View style={styles.detailRow}>
                                                        <View style={styles.detailItem}>
                                                                <Text style={styles.detailLabel}>संबंध</Text>
                                                                <Text style={styles.detailValue}>{getParentName()}</Text>
                                                        </View>
                                                        <View style={styles.detailItem}>
                                                                <Text style={styles.detailLabel}>क्रमांक</Text>
                                                                <Text style={styles.detailValue}>{currentVoter['क्रमांक']}</Text>
                                                        </View>
                                                </View>

                                                <View style={styles.voterIdSection}>
                                                        <Text style={styles.detailLabel}>मतदार ओळखपत्र</Text>
                                                        <Text style={styles.voterIdValue}>{currentVoter['मतदार_ओळखपत्र_क्रमांक']}</Text>
                                                </View>
                                        </View>
                                </View>

                                <View style={styles.statusSection}>
                                        <Text style={styles.sectionTitle}>मतदार स्थिती</Text>

                                        <View style={styles.statusContainer}>
                                                <Text style={styles.statusText}>{getStatusText()}</Text>
                                                <View style={[styles.statusIndicator, { backgroundColor: getStatusColor() }]} />
                                        </View>

                                        <View style={styles.toggleContainer}>
                                                <Text style={styles.toggleLabel}>स्लिप जारी केली</Text>
                                                <Switch
                                                        value={currentVoter['स्लिप जारी केली']}
                                                        onValueChange={toggleSlipIssued}
                                                        disabled={currentVoter['मतदान झाले'] && currentVoter['स्लिप जारी केली']}
                                                        thumbColor="#fff"
                                                        trackColor={{
                                                                false: currentVoter['मतदान झाले'] ? '#ccc' : '#767577',
                                                                true: '#4A90A4'
                                                        }}
                                                />
                                        </View>

                                        <View style={styles.toggleContainer}>
                                                <Text style={styles.toggleLabel}>मतदान झाले</Text>
                                                <Switch
                                                        value={currentVoter['मतदान झाले']}
                                                        onValueChange={toggleVoted}
                                                        disabled={!currentVoter['स्लिप जारी केली']}
                                                        thumbColor="#fff"
                                                        trackColor={{
                                                                false: !currentVoter['स्लिप जारी केली'] ? '#ccc' : '#767577',
                                                                true: '#4CAF50'
                                                        }}
                                                />
                                        </View>

                                        {!currentVoter['स्लिप जारी केली'] && (
                                                <Text style={styles.noteText}>
                                                        टीप: प्रथम स्लिप जारी करा, त्यानंतर मतदानाची नोंद करू शकता
                                                </Text>
                                        )}
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
        statusContainer: {
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 20,
                padding: 10,
                backgroundColor: '#f5f5f5',
                borderRadius: 8,
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
        toggleContainer: {
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 16,
        },
        toggleLabel: {
                fontSize: 14,
                color: '#000',
        },
        noteText: {
                color: '#FF8F00',
                fontSize: 14,
                textAlign: 'center',
                marginTop: 10,
        },
});

export default VoterDetailScreen;
