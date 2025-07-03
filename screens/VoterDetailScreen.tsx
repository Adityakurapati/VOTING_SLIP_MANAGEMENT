import React from 'react';
import {
        View,
        Text,
        StyleSheet,
        SafeAreaView,
        TouchableOpacity,
        Image,
        ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const VoterDetailScreen = ({ route, navigation }) => {
        const { voter } = route.params;

        const getStatusColor = (status) => {
                switch (status) {
                        case 'स्लिप जारी केली':
                                return '#4CAF50'; // Green
                        case 'मतदान झाले':
                                return '#4CAF50'; // Green
                        default:
                                return '#666';
                }
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
                                                        <Image source={voter.avatar} style={styles.voterAvatar} />
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
                                                                <Text style={styles.detailValue}>{voter.name}</Text>
                                                        </View>
                                                        <View style={styles.detailItem}>
                                                                <Text style={styles.detailLabel}>पत्ता</Text>
                                                                <Text style={styles.detailValue}>{voter.address}</Text>
                                                        </View>
                                                </View>

                                                <View style={styles.detailRow}>
                                                        <View style={styles.detailItem}>
                                                                <Text style={styles.detailLabel}>Age</Text>
                                                                <Text style={styles.detailValue}>{voter.age}</Text>
                                                        </View>
                                                        <View style={styles.detailItem}>
                                                                <Text style={styles.detailLabel}>Gender</Text>
                                                                <Text style={styles.detailValue}>{voter.gender}</Text>
                                                        </View>
                                                </View>

                                                <View style={styles.voterIdSection}>
                                                        <Text style={styles.detailLabel}>Voter ID</Text>
                                                        <Text style={styles.voterIdValue}>{voter.voterId}</Text>
                                                </View>
                                        </View>
                                </View>

                                <View style={styles.statusSection}>
                                        <Text style={styles.sectionTitle}>स्लिप स्थिती</Text>

                                        <View style={styles.statusRow}>
                                                <Text style={styles.statusText}>स्लिप जारी केली</Text>
                                                <View style={[styles.statusIndicator, { backgroundColor: getStatusColor(voter.status) }]} />
                                        </View>
                                </View>

                                <View style={styles.buttonContainer}>
                                        <TouchableOpacity style={styles.primaryButton}>
                                                <Text style={styles.primaryButtonText}>रेकॉर्ड स्लिप स्थिती</Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity style={styles.secondaryButton}>
                                                <Text style={styles.secondaryButtonText}>रद्द करा</Text>
                                        </TouchableOpacity>
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
});

export default VoterDetailScreen;