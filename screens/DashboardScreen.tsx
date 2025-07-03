import React, { useState, useEffect, useContext } from 'react';
import {
        View,
        Text,
        StyleSheet,
        SafeAreaView,
        TouchableOpacity,
        ActivityIndicator,
        Image,
        ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ref, onValue } from 'firebase/database';
import { database } from '../firebaseConfig';


const DashboardScreen = ({ navigation }) => {
        const [expandedSections, setExpandedSections] = useState({
                village: false,
                division: false
        });
        const [selectedVillage, setSelectedVillage] = useState(null);
        const [selectedBhag, setSelectedBhag] = useState(null);
        const [selectedVibhag, setSelectedVibhag] = useState(null);
        const [villageData, setVillageData] = useState(null);
        const [loading, setLoading] = useState(true);
        const [error, setError] = useState(null);

        useEffect(() => {
                const villagesRef = ref(database, 'villages');

                const fetchData = onValue(villagesRef, (snapshot) => {
                        try {
                                const data = snapshot.val();
                                if (data) {
                                        setVillageData(data);
                                } else {
                                        setError('No data available in database');
                                }
                                setLoading(false);
                        } catch (err) {
                                setError(err.message);
                                setLoading(false);
                        }
                }, (error) => {
                        setError(error.message);
                        setLoading(false);
                });

                return () => {
                        villagesRef.off('value', fetchData);
                };
        }, [database]);

        const toggleSection = (section) => {
                setExpandedSections(prev => ({
                        ...prev,
                        [section]: !prev[section]
                }));
        };

        const handleVillageSelect = (village) => {
                setSelectedVillage(village);
                setSelectedBhag(null);
                setSelectedVibhag(null);

                const bhags = Object.keys(villageData[village]);
                if (bhags.length === 1) {
                        setSelectedBhag(bhags[0]);
                        setExpandedSections({
                                village: false,
                                division: true
                        });
                } else {
                        setExpandedSections({
                                village: false,
                                division: false
                        });
                }
        };

        const handleBhagSelect = (bhag) => {
                setSelectedBhag(bhag);
                setSelectedVibhag(null);
                setExpandedSections({
                        village: false,
                        division: false
                });
        };

        const handleVibhagSelect = (vibhag) => {
                setSelectedVibhag(vibhag);
        };

        // In DashboardScreen.tsx
        const handleSubmit = () => {
                if (selectedVillage && selectedBhag && selectedVibhag) {
                        const vibhagData = villageData[selectedVillage][selectedBhag][selectedVibhag];

                        // Convert voters object to array with keys
                        const votersWithKeys = Object.entries(vibhagData.मतदार_यादी || {}).map(([key, voterData]) => ({
                                ...voterData,
                                firebaseKey: key // This adds voter1, voter2, etc.
                        }));

                        navigation.navigate('Members', {
                                voters: votersWithKeys,
                                village: selectedVillage,
                                division: selectedBhag,
                                vibhag: selectedVibhag,
                                metadata: {
                                        /* your metadata */
                                }
                        });
                }
        };
        if (loading) {
                return (
                        <SafeAreaView style={styles.container}>
                                <View style={styles.loadingContainer}>
                                        <ActivityIndicator size="large" color="#007AFF" />
                                        <Text style={styles.loadingText}>डेटा लोड होत आहे...</Text>
                                </View>
                        </SafeAreaView>
                );
        }

        if (error) {
                return (
                        <SafeAreaView style={styles.container}>
                                <View style={styles.errorContainer}>
                                        <Ionicons name="warning" size={48} color="#FF5722" />
                                        <Text style={styles.errorText}>त्रुटी: {error}</Text>
                                        <Text style={styles.errorSubText}>कृपया नंतर पुन्हा प्रयत्न करा</Text>
                                </View>
                        </SafeAreaView>
                );
        }

        if (!villageData) {
                return (
                        <SafeAreaView style={styles.container}>
                                <View style={styles.errorContainer}>
                                        <Ionicons name="alert-circle" size={48} color="#FFC107" />
                                        <Text style={styles.errorText}>कोणताही डेटा उपलब्ध नाही</Text>
                                </View>
                        </SafeAreaView>
                );
        }

        const hasMultipleBhags = selectedVillage && Object.keys(villageData[selectedVillage]).length > 1;
        const hasVibhags = selectedBhag && selectedVillage &&
                villageData[selectedVillage][selectedBhag] &&
                Object.keys(villageData[selectedVillage][selectedBhag]).length > 0;

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
                                <View style={[styles.expandableSection, { marginTop: 20 }]}>
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
                                                                        <Text style={styles.dropdownItemText}>{village}</Text>
                                                                </TouchableOpacity>
                                                        ))}
                                                </View>
                                        )}
                                </View>

                                {/* Bhag Dropdown */}
                                {hasMultipleBhags && selectedVillage && (
                                        <View style={styles.expandableSection}>
                                                <TouchableOpacity
                                                        style={styles.expandableHeader}
                                                        onPress={() => toggleSection('division')}
                                                >
                                                        <Text style={styles.expandableTitle}>
                                                                {selectedBhag ? selectedBhag : 'भाग निवडा'}
                                                        </Text>
                                                        <Ionicons
                                                                name={expandedSections.division ? 'chevron-up' : 'chevron-down'}
                                                                size={20}
                                                                color="#000"
                                                        />
                                                </TouchableOpacity>

                                                {expandedSections.division && (
                                                        <View style={styles.dropdownContent}>
                                                                {Object.keys(villageData[selectedVillage]).map((bhag) => (
                                                                        <TouchableOpacity
                                                                                key={bhag}
                                                                                style={styles.dropdownItem}
                                                                                onPress={() => handleBhagSelect(bhag)}
                                                                        >
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
                                                {Object.keys(villageData[selectedVillage][selectedBhag]).map((vibhag) => (
                                                        <TouchableOpacity
                                                                key={vibhag}
                                                                style={[
                                                                        styles.vibhagItem,
                                                                        selectedVibhag === vibhag && styles.vibhagItemSelected
                                                                ]}
                                                                onPress={() => handleVibhagSelect(vibhag)}
                                                        >
                                                                <Text style={styles.vibhagItemText}>{vibhag}</Text>
                                                                {selectedVibhag === vibhag && (
                                                                        <Ionicons name="checkmark" size={20} color="green" />
                                                                )}
                                                        </TouchableOpacity>
                                                ))}
                                        </View>
                                )}

                                <TouchableOpacity
                                        style={[
                                                styles.submitButton,
                                                (!selectedVillage || !selectedBhag || !selectedVibhag) && styles.submitButtonDisabled
                                        ]}
                                        onPress={handleSubmit}
                                        disabled={!selectedVillage || !selectedBhag || !selectedVibhag}
                                >
                                        <Text style={styles.submitButtonText}>पुढे जा</Text>
                                </TouchableOpacity>
                        </ScrollView>
                </SafeAreaView>
        );
};

const styles = StyleSheet.create({
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
        container: {
                flex: 1,
                backgroundColor: '#f5f5f5',
        },
        scrollContainer: {
                padding: 16,
                paddingBottom: 32,
        },
        loadingContainer: {
                flex: 1,
                justifyContent: 'center',
                alignItems: 'center',
        },
        loadingText: {
                marginTop: 16,
                fontSize: 16,
                color: '#333',
        },
        errorContainer: {
                flex: 1,
                justifyContent: 'center',
                alignItems: 'center',
                padding: 20,
        },
        errorText: {
                marginTop: 16,
                fontSize: 18,
                color: '#333',
                textAlign: 'center',
        },
        errorSubText: {
                marginTop: 8,
                fontSize: 14,
                color: '#666',
                textAlign: 'center',
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
                fontWeight: '500',
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
        dropdownItemText: {
                fontSize: 15,
                color: '#333',
        },
        vibhagLabel: {
                padding: 16,
                fontSize: 16,
                fontWeight: '600',
                color: '#000',
                borderBottomWidth: 1,
                borderBottomColor: '#eee'
        },
        vibhagItem: {
                padding: 16,
                borderBottomWidth: 1,
                borderBottomColor: '#f0f0f0',
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center'
        },
        vibhagItemSelected: {
                backgroundColor: '#f0f8ff'
        },
        vibhagItemText: {
                fontSize: 15,
                color: '#333',
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