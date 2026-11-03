import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
} from 'firebase/auth';
import { auth } from '../config/firebase';
import { UserProfile } from '../types/user';
import { getUserProfile, createUserProfile } from '../services/firestoreService';

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  loginWithGoogle: () => Promise<void>;
  loginWithEmail: (e: string, p: string) => Promise<void>;
  registerWithEmail: (e: string, p: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = async () => {
    if (!currentUser) {
      setUserProfile(null);
      return;
    }
    try {
      let profile = await getUserProfile(currentUser.uid);
      if (!profile) {
        const isAdminUser = currentUser.email === 'benilin76@gmail.com';
        profile = {
          uid: currentUser.uid,
          email: currentUser.email || '',
          displayName: currentUser.displayName || currentUser.email?.split('@')[0] || 'Anime Explorer',
          photoURL: currentUser.photoURL || undefined,
          role: isAdminUser ? 'admin' : 'user',
          theme: 'dark',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await createUserProfile(profile);
      }
      setUserProfile(profile);
    } catch (err) {
      console.warn('Profile sync warning:', err);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        await refreshProfile();
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const loginWithEmail = async (email: string, pass: string) => {
    await signInWithEmailAndPassword(auth, email, pass);
  };

  const registerWithEmail = async (email: string, pass: string, name: string) => {
    const credential = await createUserWithEmailAndPassword(auth, email, pass);
    if (credential.user) {
      await updateProfile(credential.user, { displayName: name });
      const profile: UserProfile = {
        uid: credential.user.uid,
        email,
        displayName: name,
        role: email === 'benilin76@gmail.com' ? 'admin' : 'user',
        theme: 'dark',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await createUserProfile(profile);
      setUserProfile(profile);
    }
  };

  const logout = async () => {
    await signOut(auth);
    setUserProfile(null);
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const isAdmin = userProfile?.role === 'admin' || currentUser?.email === 'benilin76@gmail.com';

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        loading,
        isAdmin,
        loginWithGoogle,
        loginWithEmail,
        registerWithEmail,
        logout,
        resetPassword,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
