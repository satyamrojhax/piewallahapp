// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
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

export { app, analytics };
