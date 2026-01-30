// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getDatabase } from "firebase/database";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDsMoRJAfinXMAqU-Lm7KDYOm-6qrZ4-_I",
  authDomain: "piewallahapp.firebaseapp.com",
  databaseURL: "https://piewallahapp-default-rtdb.firebaseio.com",
  projectId: "piewallahapp",
  storageBucket: "piewallahapp.firebasestorage.app",
  messagingSenderId: "997945838389",
  appId: "1:997945838389:web:3c3e0f6ae050624d971a7c",
  measurementId: "G-XBB469EE8M"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const database = getDatabase(app);
const auth = getAuth(app);

export { app, analytics, database, auth };
export default app;
