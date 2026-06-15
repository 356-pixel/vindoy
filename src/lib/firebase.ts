import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyA9PxES8o3KoC89uqHOUWAn7EZKIX9fZLs",
  authDomain: "xcey-video-sharing.firebaseapp.com",
  projectId: "xcey-video-sharing",
  storageBucket: "xcey-video-sharing.firebasestorage.app",
  messagingSenderId: "355683178673",
  appId: "1:355683178673:web:de926b4d22440ac4d4ea90",
  measurementId: "G-7TRNN040WZ"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);
