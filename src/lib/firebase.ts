import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyB3s_iltBctxS7Sq7Iy7KAPBnHLx8n_MfU",
  authDomain: "vindoy-45678.firebaseapp.com",
  projectId: "vindoy-45678",
  storageBucket: "vindoy-45678.firebasestorage.app",
  messagingSenderId: "802062575732",
  appId: "1:802062575732:web:e9c5cf66919ce64665c921",
  measurementId: "G-D41FKXCFK2"
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
