import {getApps, initializeApp} from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
   apiKey: "AIzaSyBW0POAWbn9oADAxUwM2TITmTreL79LTao",
  authDomain: "edmission-world-crm.firebaseapp.com",
  projectId: "edmission-world-crm",
  storageBucket: "edmission-world-crm.firebasestorage.app",
  messagingSenderId: "896939562747",
  appId: "1:896939562747:web:bafec1e1a74ce0e376025e"
};


const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);