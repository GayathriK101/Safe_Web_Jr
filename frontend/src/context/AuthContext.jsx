import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  async function signup(email, password, name) {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    await setDoc(doc(db, "users", user.uid), {
      uid: user.uid,
      name,
      email,
      role: "parent",
      createdAt: new Date().toISOString()
    });
    
    // Auto create default settings
    await setDoc(doc(db, 'settings', user.uid), {
      bedtimeEnabled: true,
      bedtimeHour: 21,
      screenTimeLimit: 120,
      recommendedSites: [],
      createdAt: new Date().toISOString()
    });
    
    return userCredential;
  }

  async function login(email, password) {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    const settingsRef = doc(db, 'settings', user.uid);
    const settingsSnap = await getDoc(settingsRef);

    if (!settingsSnap.exists()) {
      // Create default settings if missing
      await setDoc(settingsRef, {
        bedtimeEnabled: true,
        bedtimeHour: 21,
        screenTimeLimit: 120,
        recommendedSites: [],
        createdAt: new Date().toISOString()
      });
      console.log("Created missing settings for:", user.uid);
    }
    
    return userCredential;
  }

  function logout() {
    return signOut(auth);
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const docRef = doc(db, "users", user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setCurrentUser({ ...user, ...docSnap.data() });
          } else {
            setCurrentUser(user);
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          setCurrentUser(user);
        }
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    login,
    signup,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
