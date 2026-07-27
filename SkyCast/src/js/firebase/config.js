import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics } from "firebase/analytics";

// Firebase console config
const firebaseConfig = {
  apiKey: "AIzaSyCybi6QpAk0gDXYA6aNDFbUagX6WfQlO_c",
  authDomain: "skyflow-c1626.firebaseapp.com",
  databaseURL: "https://skyflow-c1626-default-rtdb.firebaseio.com",
  projectId: "skyflow-c1626",
  storageBucket: "skyflow-c1626.firebasestorage.app",
  messagingSenderId: "126678410276",
  appId: "1:126678410276:web:72c4ccbdeeb176a76fa4b1",
  measurementId: "G-LMD2VYHQ5T"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Export modular services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);