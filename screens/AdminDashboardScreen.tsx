// screens/AdminDashboardScreen.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { format, parseISO, isToday, isYesterday, differenceInMinutes } from 'date-fns';

type Session = {
        id: string;
        loginTime: string;
        logoutTime: string | null;
};

type User = {
        phone: string;
        currentSession: string | null;
        sessions: Record<string, Session>;
};

type UsersData = Record<string, User>;

const AdminDashboardScreen = ({ navigation }) => {
        // Sample data directly in the component
        const [usersData] = useState<UsersData>({
                "user1": {
                        phone: "+911234567890",
                        currentSession: "session3",
                        sessions: {
                                "session1": {
                                        id: "session1",
                                        loginTime: "2025-07-10T09:00:00Z",
                                        logoutTime: "2025-07-10T13:00:00Z"
                                },
                                "session2": {
                                        id: "session2",
                                        loginTime: "2025-07-10T17:00:00Z",
                                        logoutTime: "2025-07-10T20:00:00Z"
                                },
                                "session3": {
                                        id: "session3",
                                        loginTime: new Date().toISOString(), // Current session
                                        logoutTime: null
                                }
                        }
                },
                "user2": {
                        phone: "+919876543210",
                        currentSession: null,
                        sessions: {
                                "session4": {
                                        id: "session4",
                                        loginTime: "2025-07-11T08:45:00Z",
                                        logoutTime: "2025-07-11T12:30:00Z"
                                },
                                "session5": {
                                        id: "session5",
                                        loginTime: "2025-07-11T14:15:00Z",
                                        logoutTime: "2025-07-11T18:00:00Z"
                                }
                        }
                },
                "user3": {
                        phone: "+917654321098",
                        currentSession: "session6",
                        sessions: {
                                "session6": {
                                        id: "session6",
                                        loginTime: "2025-07-12T07:00:00Z",
                                        logoutTime: null // Active session
                                }
                        }
                }
        });

        const [searchTerm, setSearchTerm] = useState('');
        const [activeOnly, setActiveOnly] = useState(false);

        // Rest of your component logic...
        const filteredUsers = Object.entries(usersData).filter(([userId, user]) => {
                const matchesSearch = user.phone.includes(searchTerm) || userId.includes(searchTerm);
                const matchesActive = !activeOnly || user.currentSession !== null;
                return matchesSearch && matchesActive;
        });

        return (
                <ScrollView style={styles.container}>
                        {/* Your existing UI components */}
                        <View style={styles.header}>
                                <Text style={styles.title}>प्रशासन डैशबोर्ड</Text>
                        </View>

                        {/* Search and filter controls */}
                        <View style={styles.controls}>
                                <TextInput
                                        style={styles.searchInput}
                                        placeholder="खोजें..."
                                        value={searchTerm}
                                        onChangeText={setSearchTerm}
                                />
                                <TouchableOpacity
                                        style={[styles.filterButton, activeOnly && styles.activeFilter]}
                                        onPress={() => setActiveOnly(!activeOnly)}
                                >
                                        <Text style={styles.filterButtonText}>
                                                {activeOnly ? 'सभी दिखाएं' : 'केवल सक्रिय'}
                                        </Text>
                                </TouchableOpacity>
                        </View>

                        {/* User list rendering */}
                        <View style={styles.usersList}>
                                {filteredUsers.map(([userId, user]) => (
                                        <TouchableOpacity
                                                key={userId}
                                                style={styles.userCard}
                                                onPress={() => navigation.navigate('UserDetail', { userId })}
                                        >
                                                <Text style={styles.userPhone}>{user.phone}</Text>
                                                <Text style={styles.userStatus}>
                                                        {user.currentSession ? 'सक्रिय' : 'निष्क्रिय'}
                                                </Text>
                                        </TouchableOpacity>
                                ))}
                        </View>
                </ScrollView>
        );
};

const styles = StyleSheet.create({
        container: {
                flex: 1,
                padding: 16,
                backgroundColor: '#f5f5f5',
        },
        header: {
                marginBottom: 20,
        },
        title: {
                fontSize: 24,
                fontWeight: 'bold',
                textAlign: 'center',
                color: '#333',
        },
        controls: {
                flexDirection: 'row',
                marginBottom: 20,
                gap: 10,
        },
        searchInput: {
                flex: 1,
                backgroundColor: '#fff',
                borderRadius: 8,
                padding: 12,
                fontSize: 16,
        },
        filterButton: {
                paddingHorizontal: 16,
                paddingVertical: 12,
                backgroundColor: '#e0e0e0',
                borderRadius: 8,
        },
        activeFilter: {
                backgroundColor: '#3498db',
        },
        filterButtonText: {
                color: '#333',
        },
        usersList: {
                gap: 12,
        },
        userCard: {
                backgroundColor: '#fff',
                borderRadius: 8,
                padding: 16,
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
        },
        userPhone: {
                fontSize: 16,
        },
        userStatus: {
                color: '#3498db',
                fontWeight: 'bold',
        },
});

export default AdminDashboardScreen;