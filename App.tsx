import React, { useState, useEffect } from 'react';
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { initializeAuth, getReactNativePersistence, onAuthStateChanged } from 'firebase/auth';
import { initializeApp } from 'firebase/app';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import screens
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import DashboardScreen from './screens/DashboardScreen';
import MemberSearchScreen from './screens/MemberSearchScreen';
import ProfileScreen from './screens/ProfileScreen';
import VoterDetailScreen from './screens/VoterDetailScreen';
import AdminDashboardScreen from './screens/AdminDashboardScreen';
import SlipIssueScreen from './screens/SlipIssueScreen'; // New screen import

// Firebase config
const firebaseConfig = {
        apiKey: "AIzaSyD04GBzKKyxBrSGL7LeLq99Y37YsEB6aOg",
        authDomain: "thirdeye-c5b2e.firebaseapp.com",
        databaseURL: "https://thirdeye-c5b2e-default-rtdb.firebaseio.com",
        projectId: "thirdeye-c5b2e",
        storageBucket: "thirdeye-c5b2e.firebasestorage.app",
        messagingSenderId: "97667042020",
        appId: "1:97667042020:web:4178bc2c8e9d6818fb7af1",
        measurementId: "G-FE8WSFS1B7"
};

const app = initializeApp(firebaseConfig);
const auth = initializeAuth(app, {
        persistence: getReactNativePersistence(AsyncStorage)
});

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function TabNavigator() {
        return (
                <Tab.Navigator
                        screenOptions={({ route }) => ({
                                tabBarIcon: ({ focused, color, size }) => {
                                        let iconName;

                                        if (route.name === "Dashboard") {
                                                iconName = focused ? "home" : "home-outline";
                                        } else if (route.name === "Members") {
                                                iconName = focused ? "people" : "people-outline";
                                        } else if (route.name === "SlipIssue") {
                                                iconName = focused ? "document-text" : "document-text-outline";
                                        } else if (route.name === "Profile") {
                                                iconName = focused ? "person" : "person-outline";
                                        }

                                        return <Ionicons name={iconName} size={size} color={color} />;
                                },
                                tabBarActiveTintColor: '#007AFF',
                                tabBarInactiveTintColor: 'gray',
                                headerShown: false,
                                tabBarLabelStyle: {
                                        fontSize: 12,
                                },
                        })}
                >
                        <Tab.Screen
                                name="Dashboard"
                                component={DashboardScreen}
                                options={{ tabBarLabel: 'डैशबोर्ड' }}
                        />
                        <Tab.Screen
                                name="Members"
                                component={MemberSearchScreen}
                                options={{ tabBarLabel: 'सदस्य' }}
                        />
                        <Tab.Screen
                                name="SlipIssue"
                                component={SlipIssueScreen}
                                options={{ tabBarLabel: 'स्लिप समस्या' }}
                        />
                        <Tab.Screen
                                name="Profile"
                                component={ProfileScreen}
                                options={{ tabBarLabel: 'प्रोफाइल' }}
                        />
                </Tab.Navigator>
        );
}

function AuthNavigator() {
        return (
                <Stack.Navigator screenOptions={{ headerShown: false }}>
                        <Stack.Screen name="Login" component={LoginScreen} />
                        <Stack.Screen name="Register" component={RegisterScreen} />
                        <Stack.Screen name="MainApp" component={TabNavigator} />
                        <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
                        <Stack.Screen name="MemberSearch" component={MemberSearchScreen} />
                        <Stack.Screen name="VoterDetail" component={VoterDetailScreen} />
                </Stack.Navigator>
        );
}

export default function App() {
        const [user, setUser] = useState(null);
        const [loading, setLoading] = useState(true);

        useEffect(() => {
                const unsubscribe = onAuthStateChanged(auth, (user) => {
                        setUser(user);
                        setLoading(false);
                });

                return unsubscribe;
        }, []);

        if (loading) {
                return null;
        }

        return (
                <NavigationContainer>
                        <Stack.Navigator screenOptions={{ headerShown: false }}>
                                <Stack.Screen name="Auth" component={AuthNavigator} />
                        </Stack.Navigator>
                </NavigationContainer>
        );
}