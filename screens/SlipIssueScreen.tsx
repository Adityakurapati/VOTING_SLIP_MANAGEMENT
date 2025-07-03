import React from 'react';
import {
        View,
        Text,
        StyleSheet,
        ScrollView,
        TouchableOpacity,
        Image,
        SafeAreaView,
        StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const SlipIssueScreen = ({ navigation }) => {
        // Sample data for slip issues
        const completedIssues = [
                {
                        id: 1,
                        name: 'Ethan Harper',
                        date: '२०२४-०२-१२',
                        avatar: require('../assets/avatars/ethan.png'), // You'll need to add avatar images
                },
                {
                        id: 2,
                        name: 'Olivia Bennett',
                        date: '२०२४-०२-१६',
                        avatar: require('../assets/avatars/olivia.png'),
                },
                {
                        id: 3,
                        name: 'Noah Carter',
                        date: '२०२४-०२-१',
                        avatar: require('../assets/avatars/noah.png'),
                },
        ];

        const pendingIssues = [
                {
                        id: 4,
                        name: 'Ava Thompson',
                        date: '२०२४-०२-१८',
                        avatar: require('../assets/avatars/ava.png'),
                },
        ];

        const renderIssueItem = (item) => (
                <TouchableOpacity key={item.id} style={styles.issueItem}>
                        <Image source={item.avatar} style={styles.avatar} />
                        <View style={styles.issueInfo}>
                                <Text style={styles.recipientText}>Recipient: {item.name}</Text>
                                <Text style={styles.dateText}>जारी करण्याची तारीख: {item.date}</Text>
                        </View>
                </TouchableOpacity>
        );

        return (
                <SafeAreaView style={styles.container}>
                        <StatusBar barStyle="dark-content" backgroundColor="#fff" />

                        {/* Header */}
                        <View style={styles.header}>
                                <TouchableOpacity onPress={() => navigation.goBack()}>
                                        <Ionicons name="arrow-back" size={24} color="#000" />
                                </TouchableOpacity>
                                <Text style={styles.headerTitle}>स्लिप समस्या</Text>
                                <View style={styles.headerSpacer} />
                        </View>

                        <ScrollView style={styles.content}>
                                {/* Completed Issues Section */}
                                <View style={styles.section}>
                                        <Text style={styles.sectionTitle}>पूर्ण झाले</Text>
                                        {completedIssues.map(renderIssueItem)}
                                </View>

                                {/* Pending Issues Section */}
                                <View style={styles.section}>
                                        <Text style={styles.sectionTitle}>प्रलंबित</Text>
                                        {pendingIssues.map(renderIssueItem)}
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
                justifyContent: 'space-between',
                paddingHorizontal: 16,
                paddingVertical: 12,
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
                paddingHorizontal: 16,
        },
        section: {
                marginTop: 20,
        },
        sectionTitle: {
                fontSize: 16,
                fontWeight: '600',
                color: '#000',
                marginBottom: 12,
        },
        issueItem: {
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: '#fff',
                padding: 16,
                marginBottom: 12,
                borderRadius: 8,
                shadowColor: '#000',
                shadowOffset: {
                        width: 0,
                        height: 1,
                },
                shadowOpacity: 0.1,
                shadowRadius: 2,
                elevation: 2,
        },
        avatar: {
                width: 48,
                height: 48,
                borderRadius: 24,
                marginRight: 12,
        },
        issueInfo: {
                flex: 1,
        },
        recipientText: {
                fontSize: 16,
                fontWeight: '500',
                color: '#000',
                marginBottom: 4,
        },
        dateText: {
                fontSize: 14,
                color: '#666',
        },
});

export default SlipIssueScreen;