// firebaseConfig.js

// Firebase core functions
import { getApp, getApps, initializeApp } from "firebase/app";
// Firebase Auth for React Native
import ReactNativeAsyncStorage from "@react-native-async-storage/async-storage";
import { getReactNativePersistence, initializeAuth } from 'firebase/auth/react-native';
import { getFirestore } from "firebase/firestore";
//  Firestore





// Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyDTsopipE0qvwCksuyUH-awC3YhWe3ZxBY",
  authDomain: "colftrack.firebaseapp.com",
  projectId: "colftrack",
  storageBucket: "colftrack.firebasestorage.app",
  messagingSenderId: "747142445314",
  appId: "1:747142445314:web:5464fda2448e18481dea1b"
};

// Prevent multiple app initializations
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Auth with persistence using AsyncStorage
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage),

});

// Initialize Firestore
const db = getFirestore(app);

// Export Firebase services
export { app, auth, db };


