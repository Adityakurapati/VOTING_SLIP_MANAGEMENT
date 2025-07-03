import React, { useState } from 'react';
import {
        View,
        Text,
        StyleSheet,
        SafeAreaView,
        TouchableOpacity,
        ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const AdminDashboardScreen = () => {
        const [selectedVillage, setSelectedVillage] = useState('');
        const [selectedDivision, setSelectedDivision] = useState('');
        const [showVillageDropdown, setShowVillageDropdown] = useState(false);
        const [showDivisionDropdown, setShowDivisionDropdown] = useState(false);

        const villages = ['गाव अ', 'गाव ब', 'गाव क', 'गाव ड'];

        return (
                <SafeAreaView style={styles.container}>
                        <View style={styles.header}>
                                <TouchableOpacity>
                                        <Ionicons name="menu" size={24} color="#000" />
                                </TouchableOpacity>
                                <Text style={styles.headerTitle}>अॅडमिन डैशबोर्ड</Text>
                                <TouchableOpacity>
                                        <Ionicons name="settings" size={24} color="#000" />
                                </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.content}>
                                <Text style={styles.sectionTitle}>सारांश</Text>

                                <View style={styles.statsContainer}>
                                        <View style={styles.statCard}>
                                                <Text style={styles.statNumber}>१२,५००</Text>
                                                <Text style={styles.statLabel}>एकूण मतदार</Text>
                                        </View>

                                        <View style={styles.statCard}>
                                                <Text style={styles.statNumber}>१०,०००</Text>
                                                <Text style={styles.statLabel}>दिलेप जारी केल्या</Text>
                                        </View>
                                </View>

                                <View style={styles.statCardFull}>
                                        <Text style={styles.statNumber}>८,५००</Text>
                                        <Text style={styles.statLabel}>मतदान झाले</Text>
                                </View>

                                <Text style={styles.sectionTitle}>गावाची प्रगती</Text>

                                <View style={styles.dropdownContainer}>
                                        <TouchableOpacity
                                                style={styles.dropdown}
                                                onPress={() => setShowVillageDropdown(!showVillageDropdown)}
                                        >
                                                <Text style={styles.dropdownText}>गाव निवडा</Text>
                                                <Ionicons
                                                        name={showVillageDropdown ? "chevron-up" : "chevron-down"}
                                                        size={20}
                                                        color="#666"
                                                />
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                                style={styles.dropdown}
                                                onPress={() => setShowDivisionDropdown(!showDivisionDropdown)}
                                        >
                                                <Text style={styles.dropdownText}>प्रभाग निवडा</Text>
                                                <Ionicons
                                                        name={showDivisionDropdown ? "chevron-up" : "chevron-down"}
                                                        size={20}
                                                        color="#666"
                                                />
                                        </TouchableOpacity>
                                </View>

                                <View style={styles.progressSection}>
                                        <Text style={styles.progressTitle}>गावानुसार विपरिण प्रगती</Text>

                                        <View style={styles.progressItem}>
                                                <Text style={styles.progressLabel}>गाव अ</Text>
                                                <View style={styles.progressBarContainer}>
                                                        <View style={[styles.progressBar, { width: '60%' }]} />
                                                </View>
                                        </View>

                                        <View style={styles.progressItem}>
                                                <Text style={styles.progressLabel}>गाव ब</Text>
                                                <View style={styles.progressBarContainer}>
                                                        <View style={[styles.progressBar, { width: '45%' }]} />
                                                </View>
                                        </View>

                                        <View style={styles.progressItem}>
                                                <Text style={styles.progressLabel}>गाव क</Text>
                                                <View style={styles.progressBarContainer}>
                                                        <View style={[styles.progressBar, { width: '30%' }]} />
                                                </View>
                                        </View>

                                        <View style={styles.progressItem}>
                                                <Text style={styles.progressLabel}>गाव ड</Text>
                                                <View style={styles.progressBarContainer}>
                                                        <View style={[styles.progressBar, { width: '25%' }]} />
                                                </View>
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
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: 20,
                backgroundColor: '#fff',
                borderBottomWidth: 1,
                borderBottomColor: '#e0e0e0',
        },
        headerTitle: {
                fontSize: 18,
                fontWeight: 'bold',
        },
        content: {
                flex: 1,
                padding: 20,
        },
        sectionTitle: {
                fontSize: 20,
                fontWeight: 'bold',
                marginBottom: 20,
                color: '#333',
        },
        statsContainer: {
                flexDirection: 'row',
                justifyContent: 'space-between',
                marginBottom: 15,
        },
        statCard: {
                backgroundColor: '#e8f4fd',
                padding: 20,
                borderRadius: 12,
                alignItems: 'center',
                flex: 1,
                marginHorizontal: 5,
        },
        statCardFull: {
                backgroundColor: '#e8f4fd',
                padding: 20,
                borderRadius: 12,
                alignItems: 'center',
                marginBottom: 30,
        },
        statNumber: {
                fontSize: 24,
                fontWeight: 'bold',
                color: '#333',
                marginBottom: 5,
        },
        statLabel: {
                fontSize: 14,
                color: '#666',
                textAlign: 'center',
        },
        dropdownContainer: {
                marginBottom: 30,
        },
        dropdown: {
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: '#fff',
                padding: 15,
                borderRadius: 8,
                marginBottom: 15,
                borderWidth: 1,
                borderColor: '#e0e0e0',
        },
        dropdownText: {
                fontSize: 16,
                color: '#333',
        },
        progressSection: {
                backgroundColor: '#fff',
                padding: 20,
                borderRadius: 12,
        },
        progressTitle: {
                fontSize: 16,
                fontWeight: 'bold',
                marginBottom: 20,
                color: '#333',
        },
        progressItem: {
                marginBottom: 15,
        },
        progressLabel: {
                fontSize: 14,
                fontWeight: '500',
                marginBottom: 8,
                color: '#007AFF',
        },
        progressBarContainer: {
                height: 8,
                backgroundColor: '#e0e0e0',
                borderRadius: 4,
                overflow: 'hidden',
        },
        progressBar: {
                height: '100%',
                backgroundColor: '#007AFF',
                borderRadius: 4,
        },
});


export default AdminDashboardScreen;
