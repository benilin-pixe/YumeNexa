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
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  authLoading: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
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
  const [isSuperAdminServerVerified, setIsSuperAdminServerVerified] = useState(false);

  const normalizeEmail = (e?: string | null) => (e || '').trim().toLowerCase();

  const refreshProfile = async (targetUser?: User | null) => {
    const userToSync = targetUser !== undefined ? targetUser : (auth.currentUser || currentUser);
    if (!userToSync) {
      setUserProfile(null);
      setIsSuperAdminServerVerified(false);
      return;
    }

    const emailNorm = normalizeEmail(userToSync.email);
    const isDesignatedSuperAdmin = emailNorm === 'benilin76@gmail.com';

    // When the user is the designated Super Admin, verify & activate server-side
    if (isDesignatedSuperAdmin) {
      try {
        const token = await userToSync.getIdToken(false);
        const res = await fetch('/api/admin/provision-super-admin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            idToken: token,
            uid: userToSync.uid,
            email: userToSync.email,
          }),
        });
        if (res.ok) {
          setIsSuperAdminServerVerified(true);
          await userToSync.getIdToken(true);
        }
      } catch (err) {
        console.warn('[AuthContext] Super admin verification note:', err);
      }
    }

    try {
      let profile = await getUserProfile(userToSync.uid);
      if (!profile) {
        // Safe Missing-Profile Recovery: Create default profile without overwriting existing credentials
        profile = {
          uid: userToSync.uid,
          email: userToSync.email || '',
          displayName: userToSync.displayName || userToSync.email?.split('@')[0] || 'Anime Explorer',
          photoURL: userToSync.photoURL || undefined,
          role: isDesignatedSuperAdmin ? 'admin' : 'user',
          theme: 'dark',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await createUserProfile(profile);
      } else if (isDesignatedSuperAdmin && profile.role !== 'admin' && profile.role !== 'superadmin') {
        // Self-heal designated admin role
        profile = { ...profile, role: 'admin' };
        await createUserProfile(profile);
      }
      setUserProfile(profile);
    } catch (err) {
      console.warn('[AuthContext] Profile sync warning:', err);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        await refreshProfile(user);
      } else {
        setUserProfile(null);
        setIsSuperAdminServerVerified(false);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    const res = await signInWithPopup(auth, provider);
    if (res.user) {
      await refreshProfile(res.user);
    }
  };

  const loginWithEmail = async (email: string, pass: string) => {
    const cleanEmail = email.trim();
    if (!cleanEmail) throw new Error('Email is required');
    if (!pass) throw new Error('Password is required');
    
    const credential = await signInWithEmailAndPassword(auth, cleanEmail, pass);
    if (credential.user) {
      // Immediate missing-profile check & recovery on successful login
      await refreshProfile(credential.user);
    }
  };

  const registerWithEmail = async (email: string, pass: string, name: string) => {
    const cleanEmail = email.trim();
    const cleanName = name.trim();

    if (!cleanEmail) throw new Error('Email is required');
    if (!pass) throw new Error('Password is required');
    if (pass.length < 6) throw new Error('Password must be at least 6 characters long');
    if (!cleanName) throw new Error('Display Name is required');

    // 1. Create Auth account
    const credential = await createUserWithEmailAndPassword(auth, cleanEmail, pass);
    const user = credential.user;

    // 2. Set Firebase Auth displayName
    try {
      await updateProfile(user, { displayName: cleanName });
    } catch (pErr) {
      console.warn('[AuthContext] updateProfile non-fatal note:', pErr);
    }

    // 3. Create Firestore user profile
    const emailNorm = normalizeEmail(cleanEmail);
    const isDesignatedSuperAdmin = emailNorm === 'benilin76@gmail.com';

    const profile: UserProfile = {
      uid: user.uid,
      email: cleanEmail,
      displayName: cleanName,
      role: isDesignatedSuperAdmin ? 'admin' : 'user',
      theme: 'dark',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      await createUserProfile(profile);
      setUserProfile(profile);

      // Trigger server-side initial Super Admin activation if applicable
      if (isDesignatedSuperAdmin) {
        try {
          const idToken = await user.getIdToken();
          await fetch('/api/admin/provision-super-admin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idToken, uid: user.uid, email: cleanEmail }),
          });
          setIsSuperAdminServerVerified(true);
        } catch (e) {
          console.warn('[AuthContext] Registration super admin activation note:', e);
        }
      }
    } catch (profileErr) {
      console.error('[AuthContext] Profile creation error during registration:', profileErr);
      // Retain the authenticated account and state; missing-profile recovery will self-heal
      setUserProfile(profile);
      throw profileErr;
    }
  };

  const logout = async () => {
    await signOut(auth);
    setUserProfile(null);
    setIsSuperAdminServerVerified(false);
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const isDesignatedSuperAdmin = normalizeEmail(currentUser?.email) === 'benilin76@gmail.com';
  const isAdmin = (userProfile?.role === 'admin' && !userProfile?.status?.includes('suspended')) ||
    (isDesignatedSuperAdmin && (isSuperAdminServerVerified || true));

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        user: currentUser,
        userProfile,
        loading,
        authLoading: loading,
        isAdmin,
        isSuperAdmin: isDesignatedSuperAdmin,
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
