import React, { useState } from 'react';
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

const DashboardScreen = ({ navigation }) => {
        const [expandedSections, setExpandedSections] = useState({
                village: false,
                division: false
        });
        const [selectedVillage, setSelectedVillage] = useState(null);
        const [selectedDivision, setSelectedDivision] = useState(null);

        // Sample data structure
        const villageData = {
                'गाव 1': {
                        'प्रभाग A': [
                                { id: '1', name: 'वोटर 1' },
                                { id: '2', name: 'वोटर 2' },
                        ],
                        'प्रभाग B': [
                                { id: '3', name: 'वोटर 3' },
                                { id: '4', name: 'वोटर 4' },
                        ],
                },
                'गाव 2': {
                        'प्रभाग C': [
                                { id: '5', name: 'वोटर 5' },
                                { id: '6', name: 'वोटर 6' },
                        ],
                        'प्रभाग D': [
                                { id: '7', name: 'वोटर 7' },
                                { id: '8', name: 'वोटर 8' },
                        ],
                },
        };

        const toggleSection = (section) => {
                setExpandedSections(prev => ({
                        ...prev,
                        [section]: !prev[section]
                }));
        };

        const handleVillageSelect = (village) => {
                setSelectedVillage(village);
                setSelectedDivision(null);
                setExpandedSections({
                        village: false,
                        division: true
                });
        };

        const handleDivisionSelect = (division) => {
                setSelectedDivision(division);
                setExpandedSections({
                        village: false,
                        division: false
                });
        };

        const handleSubmit = () => {
                if (selectedVillage && selectedDivision) {
                        const voters = villageData[selectedVillage][selectedDivision];
                        navigation.navigate('VoterSearch', {
                                voters,
                                village: selectedVillage,
                                division: selectedDivision
                        });
                }
        };

        return (
                <SafeAreaView style={styles.container}>
                        <View style={styles.header}>
                                <TouchableOpacity>
                                        <Ionicons name="arrow-back" size={24} color="#000" />
                                </TouchableOpacity>
                                <Text style={styles.headerTitle}>डैशबोर्ड</Text>
                        </View>

                        <ScrollView style={styles.content}>
                                <View style={styles.profileSection}>
                                        <Image
                                                source={require('../assets/profile-placeholder.png')}
                                                style={styles.profileImage}
                                        />
                                        <View style={styles.profileInfo}>
                                                <Text style={styles.profileName}>एजंट अॅलेक्स</Text>
                                                <Text style={styles.profileRole}>फोल्ड एजंट</Text>
                                        </View>
                                </View>

                                <View style={styles.statsContainer}>
                                        <View style={styles.statCard}>
                                                <Text style={styles.statNumber}>₹3,300</Text>
                                                <Text style={styles.statLabel}>एकूण मतदार</Text>
                                        </View>

                                        <View style={styles.statCard}>
                                                <Text style={styles.statNumber}>900</Text>
                                                <Text style={styles.statLabel}>विशेष जाती सदस्य</Text>
                                        </View>
                                </View>

                                <View style={[styles.statCard, { width: '100%' }]}>
                                        <Text style={styles.statNumber}>600</Text>
                                        <Text style={styles.statLabel}>मतदान झाले</Text>
                                </View>

                                {/* Village Dropdown */}
                                <View style={[styles.expandableSection, { marginTop: 20 }]}>  {/* Added marginTop here */}
                                        <TouchableOpacity
                                                style={styles.expandableHeader}
                                                onPress={() => toggleSection('village')}
                                        >
                                                <Text style={styles.expandableTitle}>
                                                        {selectedVillage ? selectedVillage : 'गाव निवडा'}
                                                </Text>
                                                <Ionicons
                                                        name={expandedSections.village ? 'chevron-up' : 'chevron-down'}
                                                        size={20}
                                                        color="#000"
                                                />
                                        </TouchableOpacity>

                                        {expandedSections.village && (
                                                <View style={styles.dropdownContent}>
                                                        {Object.keys(villageData).map((village) => (
                                                                <TouchableOpacity
                                                                        key={village}
                                                                        style={styles.dropdownItem}
                                                                        onPress={() => handleVillageSelect(village)}
                                                                >
                                                                        <Text>{village}</Text>
                                                                </TouchableOpacity>
                                                        ))}
                                                </View>
                                        )}
                                </View>

                                {/* Division Dropdown - Only shown if village is selected */}
                                {selectedVillage && (
                                        <View style={styles.expandableSection}>
                                                <TouchableOpacity
                                                        style={styles.expandableHeader}
                                                        onPress={() => toggleSection('division')}
                                                >
                                                        <Text style={styles.expandableTitle}>
                                                                {selectedDivision ? selectedDivision : 'प्रभाग निवडा'}
                                                        </Text>
                                                        <Ionicons
                                                                name={expandedSections.division ? 'chevron-up' : 'chevron-down'}
                                                                size={20}
                                                                color="#000"
                                                        />
                                                </TouchableOpacity>

                                                {expandedSections.division && (
                                                        <View style={styles.dropdownContent}>
                                                                {Object.keys(villageData[selectedVillage]).map((division) => (
                                                                        <TouchableOpacity
                                                                                key={division}
                                                                                style={styles.dropdownItem}
                                                                                onPress={() => handleDivisionSelect(division)}
                                                                        >
                                                                                <Text>{division}</Text>
                                                                        </TouchableOpacity>
                                                                ))}
                                                        </View>
                                                )}
                                        </View>
                                )}

                                <TouchableOpacity
                                        style={[
                                                styles.submitButton,
                                                (!selectedVillage || !selectedDivision) && styles.submitButtonDisabled
                                        ]}
                                        onPress={handleSubmit}
                                        disabled={!selectedVillage || !selectedDivision}
                                >
                                        <Text style={styles.submitButtonText}>पुढे जा</Text>
                                </TouchableOpacity>
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
                padding: 16,
                backgroundColor: '#fff',
        },
        headerTitle: {
                fontSize: 18,
                fontWeight: '600',
                marginLeft: 16,
                color: '#000',
        },
        content: {
                flex: 1,
                padding: 16,
        },
        profileSection: {
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: 20,
        },
        profileImage: {
                width: 60,
                height: 60,
                borderRadius: 30,
                marginRight: 16,
        },
        profileName: {
                fontSize: 18,
                fontWeight: '600',
                color: '#000',
        },
        profileRole: {
                fontSize: 14,
                color: '#666',
        },
        statsContainer: {
                flexDirection: 'row',
                justifyContent: 'space-between',
                marginBottom: 16,
        },
        statCard: {
                backgroundColor: '#fff',
                borderRadius: 8,
                padding: 16,
                alignItems: 'center',
                width: '48%',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.1,
                shadowRadius: 2,
                elevation: 2,
        },
        statNumber: {
                fontSize: 24,
                fontWeight: 'bold',
                color: '#000',
                marginBottom: 4,
        },
        statLabel: {
                fontSize: 14,
                color: '#666',
        },
        expandableSection: {
                backgroundColor: '#fff',
                borderRadius: 8,
                marginBottom: 16,
                overflow: 'hidden',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.1,
                shadowRadius: 2,
                elevation: 2,
        },
        expandableHeader: {
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: 16,
        },
        expandableTitle: {
                fontSize: 16,
                color: '#000',
        },
        dropdownContent: {
                borderTopWidth: 1,
                borderTopColor: '#eee',
        },
        dropdownItem: {
                padding: 16,
                borderBottomWidth: 1,
                borderBottomColor: '#f0f0f0',
        },
        submitButton: {
                backgroundColor: '#2196F3',
                borderRadius: 8,
                padding: 16,
                alignItems: 'center',
                marginTop: 16,
        },
        submitButtonDisabled: {
                backgroundColor: '#cccccc',
        },
        submitButtonText: {
                color: '#fff',
                fontSize: 16,
                fontWeight: '600',
        },
});

export default DashboardScreen;