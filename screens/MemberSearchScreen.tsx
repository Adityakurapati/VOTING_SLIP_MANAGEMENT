import React, { useState } from 'react';
import {
        View,
        Text,
        TextInput,
        StyleSheet,
        SafeAreaView,
        FlatList,
        TouchableOpacity,
        Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const MemberSearchScreen = ({ navigation, route }) => {
        const [searchText, setSearchText] = useState('');
        const [selectedFilter, setSelectedFilter] = useState('सर्व');

        // Get data passed from DashboardScreen
        const { voters = [], village = '', division = '', vibhag = '' } = route?.params || {};

        // Process voters data from Firebase
        // In MemberSearchScreen.tsx
        const members = voters.map(voter => ({
                ...voter,
                firebaseKey: voter.firebaseKey,
                avatar: require('../assets/profile-placeholder.png'),
                // Updated status logic
                status: voter['मतदान झाले'] ? 'मतदान झाले' :
                        voter['स्लिप जारी केली'] ? 'स्लिप जारी केली' : 'प्रलंबित',
                id: voter['मतदार_ओळखपत्र_क्रमांक'],
                name: voter['नाव'],
                address: `${village}, ${division}, ${vibhag}`
        }));

        const filters = ['सर्व', 'स्लिप जारी केली', 'मतदान झाले'];

        const filteredMembers = members.filter(member => {
                const memberName = member.name || '';
                const matchesSearch = memberName.toLowerCase().includes(searchText.toLowerCase()) ||
                        (member.id || '').includes(searchText) ||
                        (member.voterId || '').includes(searchText);
                const matchesFilter = selectedFilter === 'सर्व' || member.status === selectedFilter;
                return matchesSearch && matchesFilter;
        });

        const getStatusColor = (status) => {
                switch (status) {
                        case 'मतदान झाले':
                                return '#4CAF50'; // Green for voting done
                        case 'स्लिप जारी केली':
                                return '#FFA500'; // Orange for slip issued but not voted
                        default:
                                return '#666'; // Gray for pending (neither slip issued nor voted)
                }
        };

        const renderMember = ({ item }) => (
                <TouchableOpacity
                        style={styles.memberCard}
                        onPress={() => navigation.navigate('VoterDetail', {
                                voter: {
                                        ...item,
                                        // Add the Firebase node key (voter1, voter2, etc)
                                        firebaseKey: item.firebaseKey, // This should be 'voter1', 'voter2', etc.
                                        village: route.params.village,
                                        division: route.params.division,
                                        vibhag: route.params.vibhag
                                }
                        })}
                >
                        <Image source={item.avatar} style={styles.memberAvatar} />
                        <View style={styles.memberInfo}>
                                <Text style={styles.memberName}>{item.name}</Text>
                                <Text style={styles.memberId}>मतदार ID: {item.id}</Text>
                                <Text style={styles.memberAddress}>{item.address}</Text>
                                <View style={styles.statusContainer}>
                                        <View style={[styles.statusDot, { backgroundColor: getStatusColor(item.status) }]} />
                                        <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                                                {item.status}
                                        </Text>
                                </View>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#666" />
                </TouchableOpacity>
        );

        return (
                <SafeAreaView style={styles.container}>
                        <View style={styles.header}>
                                <TouchableOpacity onPress={() => navigation.goBack()}>
                                        <Ionicons name="arrow-back" size={24} color="#000" />
                                </TouchableOpacity>
                                <Text style={styles.headerTitle}>
                                        {village && division ? `${village} - ${division}` : 'मतदार शोध'}
                                </Text>
                        </View>

                        <View style={styles.searchContainer}>
                                <View style={styles.searchInputContainer}>
                                        <Ionicons name="search" size={20} color="#666" />
                                        <TextInput
                                                style={styles.searchInput}
                                                placeholder="मतदार शोधा (नाव, ID किंवा मतदार आयडी)"
                                                value={searchText}
                                                onChangeText={setSearchText}
                                        />
                                </View>
                        </View>

                        <View style={styles.filterContainer}>
                                {filters.map((filter) => (
                                        <TouchableOpacity
                                                key={filter}
                                                style={[
                                                        styles.filterButton,
                                                        selectedFilter === filter && styles.filterButtonActive,
                                                ]}
                                                onPress={() => setSelectedFilter(filter)}
                                        >
                                                <Text
                                                        style={[
                                                                styles.filterButtonText,
                                                                selectedFilter === filter && styles.filterButtonTextActive,
                                                        ]}
                                                >
                                                        {filter}
                                                </Text>
                                        </TouchableOpacity>
                                ))}
                        </View>

                        <Text style={styles.resultCount}>
                                सापडलेले मतदार: {filteredMembers.length} (एकूण: {members.length})
                        </Text>

                        <FlatList
                                data={filteredMembers}
                                renderItem={renderMember}
                                keyExtractor={(item) => item.id}
                                style={styles.membersList}
                                showsVerticalScrollIndicator={false}
                                ListEmptyComponent={
                                        <View style={styles.emptyContainer}>
                                                <Text style={styles.emptyText}>कोणतेही मतदार सापडले नाहीत</Text>
                                        </View>
                                }
                        />
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
        searchContainer: {
                paddingHorizontal: 16,
                paddingVertical: 12,
                backgroundColor: '#fff',
        },
        searchInputContainer: {
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: '#f0f0f0',
                borderRadius: 8,
                paddingHorizontal: 12,
                paddingVertical: 8,
        },
        searchInput: {
                flex: 1,
                marginLeft: 8,
                fontSize: 16,
                color: '#000',
        },
        filterContainer: {
                flexDirection: 'row',
                paddingHorizontal: 16,
                paddingVertical: 12,
                backgroundColor: '#fff',
                borderBottomWidth: 1,
                borderBottomColor: '#e0e0e0',
        },
        filterButton: {
                paddingHorizontal: 12,
                paddingVertical: 6,
                marginRight: 8,
                borderRadius: 16,
                backgroundColor: '#f0f0f0',
        },
        filterButtonActive: {
                backgroundColor: '#2196F3',
        },
        filterButtonText: {
                fontSize: 12,
                color: '#666',
        },
        filterButtonTextActive: {
                color: '#fff',
        },
        resultCount: {
                paddingHorizontal: 16,
                paddingVertical: 8,
                fontSize: 14,
                color: '#666',
                backgroundColor: '#fff',
        },
        membersList: {
                flex: 1,
                paddingHorizontal: 16,
                paddingTop: 8,
        },
        memberCard: {
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: '#fff',
                marginBottom: 8,
                padding: 12,
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
        memberAvatar: {
                width: 50,
                height: 50,
                borderRadius: 25,
        },
        memberInfo: {
                flex: 1,
                marginLeft: 12,
        },
        memberName: {
                fontSize: 16,
                fontWeight: '600',
                color: '#000',
                marginBottom: 2,
        },
        memberId: {
                fontSize: 12,
                color: '#666',
                marginBottom: 2,
        },
        memberAddress: {
                fontSize: 12,
                color: '#666',
                marginBottom: 4,
        },
        statusContainer: {
                flexDirection: 'row',
                alignItems: 'center',
        },
        statusDot: {
                width: 8,
                height: 8,
                borderRadius: 4,
                marginRight: 6,
        },
        statusText: {
                fontSize: 12,
                fontWeight: '500',
        },
        emptyContainer: {
                flex: 1,
                justifyContent: 'center',
                alignItems: 'center',
                padding: 20,
        },
        emptyText: {
                fontSize: 16,
                color: '#666',
        },
});

export default MemberSearchScreen;