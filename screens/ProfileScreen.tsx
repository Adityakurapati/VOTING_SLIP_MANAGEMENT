import React, { useState, useEffect } from 'react';
import {
        View,
        Text,
        StyleSheet,
        ScrollView,
        TouchableOpacity,
        Image,
        SafeAreaView,
        StatusBar,
        Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getAuth, signOut } from 'firebase/auth';

const ProfileScreen = ({ navigation }) => {
        const auth = getAuth();
        const [user, setUser] = useState({
                name: 'एजंट अॅलेक्स',
                role: 'फोल्ड एजंट',
                id: '९२३४५६०८७०',
                email: 'agent.alex@example.com',
                phone: '+९१ ९२३ ३४५६ ०८७०',
                address: 'जालनगाव, सातपुड गाव क्रमांक ४२',
        });

        const handleLogout = async () => {
                Alert.alert(
                        'लॉगआउट',
                        'तुम्हाला खात्री आहे की तुम्ही लॉगआउट करू इच्छिता?',
                        [
                                {
                                        text: 'रद्द करा',
                                        style: 'cancel',
                                },
                                {
                                        text: 'लॉगआउट',
                                        style: 'destructive',
                                        onPress: async () => {
                                                try {
                                                        await signOut(auth);
                                                        navigation.reset({
                                                                index: 0,
                                                                routes: [{ name: 'Auth' }],
                                                        });
                                                } catch (error) {
                                                        console.error('Logout error:', error);
                                                        Alert.alert('त्रुटी', 'लॉगआउट करताना त्रुटी आली');
                                                }
                                        },
                                },
                        ]
                );
        };

        const handleUpdateProfile = () => {
                Alert.alert('प्रोफाइल अपडेट', 'प्रोफाइल अपडेट करण्याची कार्यक्षमता लवकरच येईल');
        };

        const handleChangePassword = () => {
                Alert.alert('पासवर्ड बदला', 'पासवर्ड बदलण्याची कार्यक्षमता लवकरच येईल');
        };

        return (
                <SafeAreaView style={styles.container}>
                        <StatusBar barStyle="dark-content" backgroundColor="#fff" />

                        {/* Header */}
                        <View style={styles.header}>
                                <TouchableOpacity onPress={() => navigation.goBack()}>
                                        <Ionicons name="arrow-back" size={24} color="#000" />
                                </TouchableOpacity>
                                <Text style={styles.headerTitle}>प्रोफाइल</Text>
                                <View style={styles.headerSpacer} />
                        </View>

                        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                                {/* Profile Section */}
                                <View style={styles.profileSection}>
                                        <Image
                                                source={require('../assets/profile-placeholder.png')}
                                                style={styles.profileImage}
                                        />
                                        <Text style={styles.profileName}>{user.name}</Text>
                                        <Text style={styles.profileRole}>{user.role}</Text>
                                </View>

                                {/* Personal Information */}
                                <View style={styles.infoSection}>
                                        <Text style={styles.sectionTitle}>वैयक्तिक माहिती</Text>

                                        <View style={styles.infoItem}>
                                                <View style={styles.infoIcon}>
                                                        <Ionicons name="mail-outline" size={20} color="#666" />
                                                </View>
                                                <View style={styles.infoContent}>
                                                        <Text style={styles.infoLabel}>ईमेल</Text>
                                                        <Text style={styles.infoValue}>{user.email}</Text>
                                                </View>
                                        </View>

                                        <View style={styles.infoItem}>
                                                <View style={styles.infoIcon}>
                                                        <Ionicons name="call-outline" size={20} color="#666" />
                                                </View>
                                                <View style={styles.infoContent}>
                                                        <Text style={styles.infoLabel}>फोन</Text>
                                                        <Text style={styles.infoValue}>{user.phone}</Text>
                                                </View>
                                        </View>

                                        <View style={styles.infoItem}>
                                                <View style={styles.infoIcon}>
                                                        <Ionicons name="location-outline" size={20} color="#666" />
                                                </View>
                                                <View style={styles.infoContent}>
                                                        <Text style={styles.infoLabel}>पत्ता</Text>
                                                        <Text style={styles.infoValue}>{user.address}</Text>
                                                </View>
                                        </View>
                                </View>

                                {/* Account Actions */}
                                <View style={styles.actionsSection}>
                                        <Text style={styles.sectionTitle}>खाते सेटिंग्ज</Text>

                                        <TouchableOpacity
                                                style={styles.actionItem}
                                                onPress={handleUpdateProfile}
                                        >
                                                <View style={styles.actionIcon}>
                                                        <Ionicons name="person-outline" size={20} color="#666" />
                                                </View>
                                                <Text style={styles.actionText}>प्रोफाइल अपडेट करा</Text>
                                                <Ionicons name="chevron-forward" size={16} color="#ccc" />
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                                style={styles.actionItem}
                                                onPress={handleChangePassword}
                                        >
                                                <View style={styles.actionIcon}>
                                                        <Ionicons name="lock-closed-outline" size={20} color="#666" />
                                                </View>
                                                <Text style={styles.actionText}>पासवर्ड बदला</Text>
                                                <Ionicons name="chevron-forward" size={16} color="#ccc" />
                                        </TouchableOpacity>
                                </View>

                                {/* Logout Button */}
                                <TouchableOpacity
                                        style={styles.logoutButton}
                                        onPress={handleLogout}
                                >
                                        <Text style={styles.logoutButtonText}>लॉगआउट</Text>
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
                justifyContent: 'space-between',
                padding: 16,
                backgroundColor: '#fff',
                borderBottomWidth: 1,
                borderBottomColor: '#e0e0e0',
        },
        headerTitle: {
                fontSize: 18,
                fontWeight: '600',
                color: '#000',
        },
        headerSpacer: {
                width: 24,
        },
        content: {
                flex: 1,
                padding: 16,
        },
        profileSection: {
                backgroundColor: '#fff',
                borderRadius: 12,
                padding: 20,
                alignItems: 'center',
                marginBottom: 16,
        },
        profileImage: {
                width: 100,
                height: 100,
                borderRadius: 50,
                marginBottom: 16,
        },
        profileName: {
                fontSize: 20,
                fontWeight: 'bold',
                color: '#000',
                marginBottom: 4,
        },
        profileRole: {
                fontSize: 16,
                color: '#666',
        },
        infoSection: {
                backgroundColor: '#fff',
                borderRadius: 12,
                padding: 16,
                marginBottom: 16,
        },
        sectionTitle: {
                fontSize: 16,
                fontWeight: '600',
                color: '#000',
                marginBottom: 16,
        },
        infoItem: {
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 12,
                borderBottomWidth: 1,
                borderBottomColor: '#f0f0f0',
        },
        infoIcon: {
                width: 40,
                height: 40,
                borderRadius: 8,
                backgroundColor: '#f5f5f5',
                justifyContent: 'center',
                alignItems: 'center',
                marginRight: 12,
        },
        infoContent: {
                flex: 1,
        },
        infoLabel: {
                fontSize: 14,
                color: '#666',
                marginBottom: 4,
        },
        infoValue: {
                fontSize: 16,
                color: '#000',
                fontWeight: '500',
        },
        actionsSection: {
                backgroundColor: '#fff',
                borderRadius: 12,
                padding: 16,
                marginBottom: 16,
        },
        actionItem: {
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 12,
                borderBottomWidth: 1,
                borderBottomColor: '#f0f0f0',
        },
        actionIcon: {
                width: 40,
                height: 40,
                borderRadius: 8,
                backgroundColor: '#f5f5f5',
                justifyContent: 'center',
                alignItems: 'center',
                marginRight: 12,
        },
        actionText: {
                flex: 1,
                fontSize: 16,
                color: '#000',
                fontWeight: '500',
        },
        logoutButton: {
                backgroundColor: '#ff4444',
                borderRadius: 8,
                padding: 16,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
        },
        logoutButtonText: {
                color: '#fff',
                fontSize: 16,
                fontWeight: '600',
        },
});

export default ProfileScreen;