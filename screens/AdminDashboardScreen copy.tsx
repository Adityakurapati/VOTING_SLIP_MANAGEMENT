import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList } from 'react-native';
import { getDatabase, ref, onValue } from 'firebase/database';

const AdminDashboardScreen = () => {
        const [users, setUsers] = useState([]);
        const [selectedUser, setSelectedUser] = useState(null);
        const [userSessions, setUserSessions] = useState([]);

        useEffect(() => {
                const db = getDatabase();
                const usersRef = ref(db, 'users');

                const unsubscribe = onValue(usersRef, (snapshot) => {
                        const usersData = snapshot.val() || {};
                        const usersList = Object.keys(usersData).map(uid => ({
                                uid,
                                ...usersData[uid],
                                phoneNumber: usersData[uid].phoneNumber || 'N/A'
                        }));
                        setUsers(usersList);
                });

                return () => unsubscribe();
        }, []);

        const loadUserSessions = (uid) => {
                const db = getDatabase();
                const sessionsRef = ref(db, `users/${uid}/sessions`);

                onValue(sessionsRef, (snapshot) => {
                        const sessionsData = snapshot.val() || {};
                        const sessionsList = Object.entries(sessionsData).map(([id, session]) => ({
                                id,
                                ...session
                        }));

                        // Group sessions by date
                        const groupedSessions = groupSessionsByDate(sessionsList);
                        setUserSessions(groupedSessions);
                });
        };

        const groupSessionsByDate = (sessions) => {
                const grouped = {};

                sessions.forEach(session => {
                        if (!session.loginTime) return;

                        const date = new Date(session.loginTime);
                        const dateKey = date.toLocaleDateString();

                        if (!grouped[dateKey]) {
                                grouped[dateKey] = [];
                        }

                        const timeRange = `${formatTime(session.loginTime)} - ${session.logoutTime ? formatTime(session.logoutTime) : 'Active'}`;
                        grouped[dateKey].push(timeRange);
                });

                return Object.entries(grouped).map(([date, sessions]) => ({
                        date,
                        sessions
                }));
        };

        const formatTime = (isoString) => {
                const date = new Date(isoString);
                return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        };

        return (
                <View>
                        <Text>User Sessions</Text>

                        {!selectedUser ? (
                                <FlatList
                                        data={users}
                                        keyExtractor={(item) => item.uid}
                                        renderItem={({ item }) => (
                                                <TouchableOpacity onPress={() => {
                                                        setSelectedUser(item);
                                                        loadUserSessions(item.uid);
                                                }}>
                                                        <Text>{item.phoneNumber}</Text>
                                                        <Text>Last login: {item.lastLogin ? new Date(item.lastLogin).toLocaleString() : 'Never'}</Text>
                                                        <Text>Last logout: {item.lastLogout ? new Date(item.lastLogout).toLocaleString() : 'Active'}</Text>
                                                </TouchableOpacity>
                                        )}
                                />
                        ) : (
                                <View>
                                        <TouchableOpacity onPress={() => setSelectedUser(null)}>
                                                <Text>Back to list</Text>
                                        </TouchableOpacity>

                                        <Text>User: {selectedUser.phoneNumber}</Text>

                                        {userSessions.map((day) => (
                                                <View key={day.date}>
                                                        <Text>{day.date}</Text>
                                                        {day.sessions.map((session, i) => (
                                                                <Text key={i}>{session}</Text>
                                                        ))}
                                                </View>
                                        ))}
                                </View>
                        )}
                </View>
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
