// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCuH8Oq8XoUdGYVHm81_KeIPJXKg-Qtsp0",
    authDomain: "financial-freedom-e3ed4.firebaseapp.com",
    projectId: "financial-freedom-e3ed4",
    storageBucket: "financial-freedom-e3ed4.firebasestorage.app",
    messagingSenderId: "541508011318",
    appId: "1:541508011318:web:f75b02d8d7ebf8db8b9f97"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

//auth
export const auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
})

//db
export const firestore = getFirestore(app);