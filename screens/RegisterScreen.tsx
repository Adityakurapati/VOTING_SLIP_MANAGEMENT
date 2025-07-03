import React, { useState } from 'react';
import {
        View,
        Text,
        TextInput,
        TouchableOpacity,
        StyleSheet,
        SafeAreaView,
        ScrollView,
        StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const RegisterScreen = ({ navigation }) => {
        const [fullName, setFullName] = useState('');
        const [mobileNumber, setMobileNumber] = useState('');
        const [password, setPassword] = useState('');
        const [confirmPassword, setConfirmPassword] = useState('');
        const [address, setAddress] = useState('');

        const handleRegister = () => {
                // Implement registration logic
                console.log('Registration data:', { fullName, mobileNumber, password, address });
        };

        return (
                <SafeAreaView style={styles.container}>
                        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

                        {/* Header */}
                        <View style={styles.header}>
                                <TouchableOpacity
                                        style={styles.backButton}
                                        onPress={() => navigation.goBack()}
                                        activeOpacity={0.7}
                                >
                                        <Ionicons name="arrow-back" size={24} color="#1F2937" />
                                </TouchableOpacity>
                                <Text style={styles.headerTitle}>Register</Text>
                                <View style={styles.headerSpacer} />
                        </View>

                        <ScrollView
                                style={styles.content}
                                showsVerticalScrollIndicator={false}
                                contentContainerStyle={styles.scrollContent}
                        >
                                {/* Full Name Field */}
                                <View style={styles.inputGroup}>
                                        <Text style={styles.label}>पूर्ण नाव</Text>
                                        <TextInput
                                                style={styles.input}
                                                placeholder="तुमचे पूर्ण नाव एंटर करा."
                                                placeholderTextColor="#9CA3AF"
                                                value={fullName}
                                                onChangeText={setFullName}
                                        />
                                </View>

                                {/* Mobile Number Field */}
                                <View style={styles.inputGroup}>
                                        <Text style={styles.label}>मोबाईल नंबर</Text>
                                        <TextInput
                                                style={styles.input}
                                                placeholder="तुमचा मोबाईल नंबर एंटर करा"
                                                placeholderTextColor="#9CA3AF"
                                                value={mobileNumber}
                                                onChangeText={setMobileNumber}
                                                keyboardType="phone-pad"
                                                maxLength={10}
                                        />
                                </View>

                                {/* Password Field */}
                                <View style={styles.inputGroup}>
                                        <Text style={styles.label}>Password</Text>
                                        <TextInput
                                                style={styles.input}
                                                placeholder="तुमचा पासवर्ड एंटर करा"
                                                placeholderTextColor="#9CA3AF"
                                                value={password}
                                                onChangeText={setPassword}
                                                secureTextEntry
                                        />
                                </View>

                                {/* Confirm Password Field */}
                                <View style={styles.inputGroup}>
                                        <Text style={styles.label}>Confirm Password</Text>
                                        <TextInput
                                                style={styles.input}
                                                placeholder="Confirm your password"
                                                placeholderTextColor="#9CA3AF"
                                                value={confirmPassword}
                                                onChangeText={setConfirmPassword}
                                                secureTextEntry
                                        />
                                </View>

                                {/* Address Field */}
                                <View style={styles.inputGroup}>
                                        <Text style={styles.label}>भूमिका</Text>
                                        <TextInput
                                                style={styles.input}
                                                placeholder="तुमची भूमिका निवडा"
                                                placeholderTextColor="#9CA3AF"
                                                value={address}
                                                onChangeText={setAddress}
                                        />
                                </View>

                                {/* Register Button */}
                                <TouchableOpacity
                                        style={styles.registerButton}
                                        onPress={handleRegister}
                                        activeOpacity={0.8}
                                >
                                        <Text style={styles.registerButtonText}>नोंदणी करा</Text>
                                </TouchableOpacity>

                                {/* Login Link */}
                                <View style={styles.loginLinkContainer}>
                                        <Text style={styles.loginLinkText}>आधीच खाते आहे का?</Text>
                                        <TouchableOpacity
                                                onPress={() => navigation.navigate('Login')}
                                                activeOpacity={0.7}
                                        >
                                                <Text style={styles.loginLinkButton}>आता लॉगिन करा</Text>
                                        </TouchableOpacity>
                                </View>
                        </ScrollView>
                </SafeAreaView>
        );
};

const styles = StyleSheet.create({
        container: {
                flex: 1,
                backgroundColor: '#ffffff',
        },
        header: {
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingHorizontal: 20,
                paddingVertical: 16,
                borderBottomWidth: 1,
                borderBottomColor: '#F3F4F6',
        },
        backButton: {
                padding: 4,
        },
        headerTitle: {
                fontSize: 18,
                fontWeight: '600',
                color: '#1F2937',
        },
        headerSpacer: {
                width: 32,
        },
        content: {
                flex: 1,
        },
        scrollContent: {
                paddingHorizontal: 24,
                paddingTop: 24,
                paddingBottom: 40,
        },
        inputGroup: {
                marginBottom: 24,
        },
        label: {
                fontSize: 16,
                fontWeight: '600',
                color: '#1F2937',
                marginBottom: 8,
        },
        input: {
                backgroundColor: '#F9FAFB',
                borderWidth: 1,
                borderColor: '#E5E7EB',
                borderRadius: 12,
                paddingHorizontal: 16,
                paddingVertical: 16,
                fontSize: 16,
                color: '#1F2937',
                fontWeight: '400',
        },
        registerButton: {
                backgroundColor: '#3B82F6',
                borderRadius: 12,
                paddingVertical: 16,
                alignItems: 'center',
                justifyContent: 'center',
                marginTop: 16,
                marginBottom: 24,
                shadowColor: '#3B82F6',
                shadowOffset: {
                        width: 0,
                        height: 4,
                },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 8,
        },
        registerButtonText: {
                color: '#ffffff',
                fontSize: 18,
                fontWeight: '600',
        },
        loginLinkContainer: {
                alignItems: 'center',
                marginTop: 8,
        },
        loginLinkText: {
                fontSize: 14,
                color: '#6B7280',
                marginBottom: 4,
        },
        loginLinkButton: {
                fontSize: 14,
                color: '#3B82F6',
                fontWeight: '600',
        },
});

export default RegisterScreen;