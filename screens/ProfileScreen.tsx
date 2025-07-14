import React from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { getAuth, signOut } from 'firebase/auth';
import { getDatabase, ref, update } from 'firebase/database';

const ProfileScreen = ({ navigation }) => {
        const auth = getAuth();
        const db = getDatabase();

        const handleLogout = async () => {
                try {
                        const user = auth.currentUser;
                        if (user) {
                                const logoutTime = new Date().toISOString();

                                // Find the most recent session with no logout time
                                const sessionsRef = ref(db, `users/${user.uid}/sessions`);
                                const snapshot = await get(sessionsRef);

                                if (snapshot.exists()) {
                                        const sessions = Object.entries(snapshot.val()).reverse();
                                        for (const [key, session] of sessions) {
                                                if (!session.logoutTime) {
                                                        await update(ref(db, `users/${user.uid}/sessions/${key}`), {
                                                                logoutTime
                                                        });
                                                        break;
                                                }
                                        }
                                }
                        }

                        await signOut(auth);
                        navigation.reset({
                                index: 0,
                                routes: [{ name: 'Auth' }],
                        });
                } catch (error) {
                        Alert.alert('Error', 'Logout failed');
                }
        };

        return (
                <View>
                        <TouchableOpacity onPress={handleLogout}>
                                <Text>Logout</Text>
                        </TouchableOpacity>
                </View>
        );
};

export default ProfileScreen;

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