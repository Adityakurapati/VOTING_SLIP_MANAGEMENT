import React, { useState } from 'react';
import {
        View,
        Text,
        TextInput,
        TouchableOpacity,
        StyleSheet,
        SafeAreaView,
        Image,
        Alert,
        StatusBar,
} from 'react-native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { getAuth } from 'firebase/auth';

const LoginScreen = ({ navigation }) => {
        const [mobileNumber, setMobileNumber] = useState('');
        const [otp, setOtp] = useState('');
        const [userType, setUserType] = useState('फील्ड एजंट'); // Default selection
        const auth = getAuth();

        const handleLogin = async () => {
                try {
                        // For demo purposes, using email/password auth
                        // In production, implement OTP authentication
                        const userCredential = await signInWithEmailAndPassword(auth, mobileNumber + '@gmail.com', '123456');

                        // Set user type in user profile or use navigation params
                        // For now, we'll use navigation state to pass user type
                        if (userType === 'प्रशासन') {
                                // Navigate to admin interface
                                navigation.navigate('AdminDashboard');
                        } else {
                                // Navigate to field agent interface (existing logic)
                                navigation.navigate('MainApp');
                        }
                } catch (error) {
                        Alert.alert('Error', 'Invalid credentials');
                }
        };

        return (
                <SafeAreaView style={styles.container}>
                        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
                        <View style={styles.content}>
                                {/* Celebration Image */}
                                <View style={styles.imageContainer}>
                                        <Image
                                                source={require('../assets/celebration.png')} // Add your celebration image
                                                style={styles.celebrationImage}
                                                resizeMode="contain"
                                        />
                                </View>

                                {/* Title */}
                                <Text style={styles.title}>पुणे जिल्हा परिषद निवडणूका 2025</Text>

                                {/* User Type Selection */}
                                <View style={styles.userTypeContainer}>
                                        <TouchableOpacity
                                                style={[
                                                        styles.userTypeButton,
                                                        userType === 'फील्ड एजंट' && styles.userTypeButtonActive
                                                ]}
                                                onPress={() => setUserType('फील्ड एजंट')}
                                                activeOpacity={0.7}
                                        >
                                                <Text style={[
                                                        styles.userTypeText,
                                                        userType === 'फील्ड एजंट' && styles.userTypeTextActive
                                                ]}>
                                                        फील्ड एजंट
                                                </Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                                style={[
                                                        styles.userTypeButton,
                                                        userType === 'प्रशासन' && styles.userTypeButtonActive
                                                ]}
                                                onPress={() => setUserType('प्रशासन')}
                                                activeOpacity={0.7}
                                        >
                                                <Text style={[
                                                        styles.userTypeText,
                                                        userType === 'प्रशासन' && styles.userTypeTextActive
                                                ]}>
                                                        प्रशासन
                                                </Text>
                                        </TouchableOpacity>
                                </View>

                                {/* Input Fields */}
                                <View style={styles.inputContainer}>
                                        <TextInput
                                                style={styles.input}
                                                placeholder="मोबाईल नंबर"
                                                placeholderTextColor="#9CA3AF"
                                                value={mobileNumber}
                                                onChangeText={setMobileNumber}
                                                keyboardType="phone-pad"
                                                maxLength={10}
                                        />

                                        <TextInput
                                                style={styles.input}
                                                placeholder="ओटीपी"
                                                placeholderTextColor="#9CA3AF"
                                                value={otp}
                                                onChangeText={setOtp}
                                                keyboardType="numeric"
                                                maxLength={6}
                                        />
                                </View>

                                {/* Login Button */}
                                <TouchableOpacity
                                        style={styles.loginButton}
                                        onPress={handleLogin}
                                        activeOpacity={0.8}
                                >
                                        <Text style={styles.loginButtonText}>लॉगिन करा</Text>
                                </TouchableOpacity>

                                {/* Register Button */}
                                <TouchableOpacity
                                        style={styles.registerButton}
                                        onPress={() => navigation.navigate('Register')}
                                        activeOpacity={0.7}
                                >
                                        <Text style={styles.registerButtonText}>खाते नाहीये का? आता नोंदणी करा.</Text>
                                </TouchableOpacity>
                        </View>
                </SafeAreaView>
        );
};

const styles = StyleSheet.create({
        container: {
                flex: 1,
                backgroundColor: '#ffffff',
        },
        content: {
                flex: 1,
                paddingHorizontal: 24,
                paddingTop: 40,
                paddingBottom: 32,
        },
        imageContainer: {
                alignItems: 'center',
                marginBottom: 32,
                paddingTop: 20,
        },
        celebrationImage: {
                width: 200,
                height: 160,
        },
        title: {
                fontSize: 24,
                fontWeight: '700',
                color: '#1F2937',
                textAlign: 'center',
                marginBottom: 40,
                lineHeight: 32,
        },
        userTypeContainer: {
                flexDirection: 'row',
                marginBottom: 32,
                backgroundColor: '#F3F4F6',
                borderRadius: 12,
                padding: 4,
        },
        userTypeButton: {
                flex: 1,
                paddingVertical: 12,
                paddingHorizontal: 16,
                borderRadius: 8,
                alignItems: 'center',
                justifyContent: 'center',
        },
        userTypeButtonActive: {
                backgroundColor: '#374151',
                shadowColor: '#000',
                shadowOffset: {
                        width: 0,
                        height: 2,
                },
                shadowOpacity: 0.1,
                shadowRadius: 3,
                elevation: 3,
        },
        userTypeText: {
                fontSize: 16,
                fontWeight: '600',
                color: '#6B7280',
        },
        userTypeTextActive: {
                color: '#ffffff',
        },
        inputContainer: {
                marginBottom: 24,
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
                marginBottom: 16,
                fontWeight: '400',
        },
        loginButton: {
                backgroundColor: '#3B82F6',
                borderRadius: 12,
                paddingVertical: 16,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
                shadowColor: '#3B82F6',
                shadowOffset: {
                        width: 0,
                        height: 4,
                },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 8,
        },
        loginButtonText: {
                color: '#ffffff',
                fontSize: 18,
                fontWeight: '600',
        },
        registerButton: {
                backgroundColor: '#9CA3AF',
                borderRadius: 12,
                paddingVertical: 16,
                alignItems: 'center',
                justifyContent: 'center',
        },
        registerButtonText: {
                color: '#ffffff',
                fontSize: 16,
                fontWeight: '500',
        },
});

export default LoginScreen;