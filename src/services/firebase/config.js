// src/services/firebase/config.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// TODO: Replace with your actual Firebase project config
const firebaseConfig = {
    apiKey: "AIzaSyA8s4O8nCnnrr-ak1-3IOVilsyXZPMqno4",
    authDomain: "da-mimaropa-system.firebaseapp.com",
    projectId: "da-mimaropa-system",
    storageBucket: "da-mimaropa-system.firebasestorage.app",
    messagingSenderId: "1009450341405",
    appId: "1:1009450341405:web:a5d0fa1d335174df03a2f4",
    measurementId: "G-CMZM0CZ1T2"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);