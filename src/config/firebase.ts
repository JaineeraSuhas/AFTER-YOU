import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCzwdJkZmCKvfytnfkcHf8rc12Txgqd_kU",
    authDomain: "foryou-eb07a.firebaseapp.com",
    projectId: "foryou-eb07a",
    storageBucket: "foryou-eb07a.firebasestorage.app",
    messagingSenderId: "794988043175",
    appId: "1:794988043175:web:b911b2fe9d132e8ee67482",
    // Realtime Database URL
    databaseURL: "https://foryou-eb07a-default-rtdb.asia-southeast1.firebasedatabase.app"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Realtime Database and get a reference to the service
export const database = getDatabase(app);

export default app;
