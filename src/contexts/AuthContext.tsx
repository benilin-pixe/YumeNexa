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

  const refreshProfile = async () => {
    if (!currentUser) {
      setUserProfile(null);
      setIsSuperAdminServerVerified(false);
      return;
    }

    const emailNorm = normalizeEmail(currentUser.email);
    const isDesignatedSuperAdmin = emailNorm === 'benilin76@gmail.com';

    // When the user is the designated Super Admin, verify & activate server-side
    if (isDesignatedSuperAdmin) {
      try {
        const token = await currentUser.getIdToken(false);
        const res = await fetch('/api/admin/provision-super-admin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            idToken: token,
            uid: currentUser.uid,
            email: currentUser.email,
          }),
        });
        if (res.ok) {
          setIsSuperAdminServerVerified(true);
          // Force refresh token to pull updated custom claims if Admin SDK set them
          await currentUser.getIdToken(true);
        }
      } catch (err) {
        console.warn('[AuthContext] Super admin verification note:', err);
      }
    }

    try {
      let profile = await getUserProfile(currentUser.uid);
      if (!profile) {
        profile = {
          uid: currentUser.uid,
          email: currentUser.email || '',
          displayName: currentUser.displayName || currentUser.email?.split('@')[0] || 'Anime Explorer',
          photoURL: currentUser.photoURL || undefined,
          role: isDesignatedSuperAdmin ? 'admin' : 'user',
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
        setIsSuperAdminServerVerified(false);
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
      const emailNorm = normalizeEmail(email);
      const isDesignatedSuperAdmin = emailNorm === 'benilin76@gmail.com';

      const profile: UserProfile = {
        uid: credential.user.uid,
        email,
        displayName: name,
        role: isDesignatedSuperAdmin ? 'admin' : 'user',
        theme: 'dark',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await createUserProfile(profile);
      setUserProfile(profile);

      // Trigger server-side initial Super Admin activation
      if (isDesignatedSuperAdmin) {
        try {
          const idToken = await credential.user.getIdToken();
          await fetch('/api/admin/provision-super-admin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idToken, uid: credential.user.uid, email }),
          });
          setIsSuperAdminServerVerified(true);
        } catch (e) {
          console.warn('[AuthContext] Registration super admin activation note:', e);
        }
      }
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
        userProfile,
        loading,
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
