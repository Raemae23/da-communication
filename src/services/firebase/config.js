// src/services/firebase/config.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// TODO: Replace with your actual Firebase project config
const firebaseConfig = {
    apiKey: "AIzaSyA2WA9ia5btDsPkRbp1rt2HctczeWFZ0QA",
    authDomain: "amad-communication.firebaseapp.com",
    projectId: "amad-communication",
    storageBucket: "amad-communication.firebasestorage.app",
    messagingSenderId: "754978309440",
    appId: "1:754978309440:web:a4e6d281ad0abf1f16e6a5",
    measurementId: "G-9FH3LZ0E1V"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);