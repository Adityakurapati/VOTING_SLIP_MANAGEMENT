// firebaseConfig.ts
import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getDatabase } from 'firebase/database';

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
const database = getDatabase(app);

export { app, auth, database };
