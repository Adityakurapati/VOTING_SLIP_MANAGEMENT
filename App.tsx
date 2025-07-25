"use client"

import { useState, useEffect } from "react"
import { NavigationContainer } from "@react-navigation/native"
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"
import { createNativeStackNavigator } from "@react-navigation/native-stack"
import { Ionicons } from "@expo/vector-icons"
import { onAuthStateChanged, signOut } from "firebase/auth"
import { AppState } from "react-native"
import { getDatabase, ref, update, get } from "firebase/database"
import { auth } from "./firebaseConfig"
import { VoterProvider } from "./contexts/VoterContext"

// Import screens
import LoginScreen from "./screens/LoginScreen"
import RegisterScreen from "./screens/RegisterScreen"
import DashboardScreen from "./screens/DashboardScreen"
import MemberSearchScreen from "./screens/MemberSearchScreen"
import ProfileScreen from "./screens/ProfileScreen"
import VoterDetailScreen from "./screens/VoterDetailScreen"
import AdminDashboardScreen from "./screens/AdminDashboardScreen"
import SlipIssueScreen from "./screens/SlipIssueScreen"

const Tab = createBottomTabNavigator()
const Stack = createNativeStackNavigator()

function HomeTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName

          if (route.name === "Dashboard") {
            iconName = focused ? "home" : "home-outline"
          } else if (route.name === "Members") {
            iconName = focused ? "people" : "people-outline"
          } else if (route.name === "SlipIssue") {
            iconName = focused ? "document-text" : "document-text-outline"
          } else if (route.name === "Profile") {
            iconName = focused ? "person" : "person-outline"
          }

          return <Ionicons name={iconName} size={size} color={color} />
        },
        tabBarActiveTintColor: "#007AFF",
        tabBarInactiveTintColor: "gray",
        headerShown: false,
        tabBarLabelStyle: {
          fontSize: 12,
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ tabBarLabel: "डैशबोर्ड" }} />
      <Tab.Screen name="Members" component={MemberSearchScreen} options={{ tabBarLabel: "सदस्य" }} />
      <Tab.Screen name="SlipIssue" component={SlipIssueScreen} options={{ tabBarLabel: "स्लिप समस्या" }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarLabel: "प्रोफाइल" }} />
    </Tab.Navigator>
  )
}

function FieldAgentNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomeTabs" component={HomeTabs} />
      <Stack.Screen name="VoterDetail" component={VoterDetailScreen} />
    </Stack.Navigator>
  )
}

function AdminNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
    </Stack.Navigator>
  )
}

function AuthNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  )
}

function AppNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Auth" component={AuthNavigator} />
      <Stack.Screen name="FieldAgent" component={FieldAgentNavigator} />
      <Stack.Screen name="Admin" component={AdminNavigator} />
    </Stack.Navigator>
  )
}

export default function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const database = getDatabase()

  // Handle app state changes for automatic logout
  useEffect(() => {
    const handleAppStateChange = async (nextAppState) => {
      if (nextAppState === "background" || nextAppState === "inactive") {
        // App is going to background or becoming inactive
        const currentUser = auth.currentUser
        if (currentUser) {
          try {
            // Get current user data
            const userRef = ref(database, `users/${currentUser.uid}`)
            const snapshot = await get(userRef)

            if (snapshot.exists()) {
              const userData = snapshot.val()
              if (userData.currentSession) {
                const logoutTime = new Date().toISOString()

                // Update current session with logout time
                await update(ref(database, `users/${currentUser.uid}/sessions/${userData.currentSession}`), {
                  logoutTime,
                })

                // Update user info
                await update(ref(database, `users/${currentUser.uid}`), {
                  currentSession: null,
                  lastLogout: logoutTime,
                })
              }
            }

            // Sign out the user
            await signOut(auth)
          } catch (error) {
            console.error("Auto logout error:", error)
          }
        }
      }
    }

    const subscription = AppState.addEventListener("change", handleAppStateChange)

    return () => {
      subscription?.remove()
    }
  }, [])

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user)
      setLoading(false)
    })

    return unsubscribe
  }, [])

  if (loading) {
    return null
  }

  return (
    <VoterProvider>
      <NavigationContainer>
        <AppNavigator />
      </NavigationContainer>
    </VoterProvider>
  )
}
