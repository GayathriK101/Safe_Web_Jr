import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyB8o1SfL1x0jwPtpZXgCYnDSMNtLXQ5Dh4",
  authDomain: "safeweb-jr.firebaseapp.com",
  projectId: "safeweb-jr",
  storageBucket: "safeweb-jr.firebasestorage.app",
  messagingSenderId: "1094364192488",
  appId: "1:1094364192488:web:4e3192e5bfcfd6ff06b35d"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
