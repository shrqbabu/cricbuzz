import React, { createContext, useContext, useEffect, useState } from "react";
import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db, handleFirestoreError, OperationType } from "@/src/firebase/config";
import { UserProfile, UserRole } from "@/src/types";

interface AuthContextType {
  user: FirebaseUser | null;
  profile: UserProfile | null;
  loading: boolean;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string, displayName: string, requestedRole: UserRole) => Promise<void>;
  signInWithGoogle: (requestedRole?: UserRole) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Bootstrapped admin email
  const BOOTSTRAPPED_ADMIN_EMAIL = "shariqbabu134@gmail.com";

  const fetchProfile = async (uid: string): Promise<UserProfile | null> => {
    const userRef = doc(db, "users", uid);
    try {
      const docSnap = await getDoc(userRef);
      if (docSnap.exists()) {
        return docSnap.data() as UserProfile;
      }
      return null;
    } catch (error) {
      // Graceful error handling for missing permissions during profile load
      handleFirestoreError(error, OperationType.GET, `users/${uid}`);
    }
  };

  const createOrUpdateUserProfile = async (
    uid: string,
    email: string,
    displayName: string,
    chosenRole: UserRole
  ) => {
    // Determine the actual role (bootstrap user 'shariqbabu134@gmail.com' as admin always)
    let assignedRole: UserRole = chosenRole;
    if (email.toLowerCase() === BOOTSTRAPPED_ADMIN_EMAIL.toLowerCase()) {
      assignedRole = "admin";
    }

    const newProfile: UserProfile = {
      uid,
      email,
      displayName: displayName || email.split("@")[0],
      role: assignedRole,
      createdAt: new Date().toISOString(),
    };

    const userRef = doc(db, "users", uid);
    try {
      await setDoc(userRef, newProfile);
      setProfile(newProfile);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${uid}`);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        // Fetch or create profile
        let userProfile = await fetchProfile(firebaseUser.uid);
        if (!userProfile) {
          // If profile does not exist yet (e.g. was created earlier but doc deleted, or google login first time)
          // Profile defaults to 'public' or let's create it with 'public' role
          await createOrUpdateUserProfile(
            firebaseUser.uid,
            firebaseUser.email || "",
            firebaseUser.displayName || "",
            "public"
          );
        } else {
          // Boostrap admin check on existing login just in case
          if (
            firebaseUser.email?.toLowerCase() === BOOTSTRAPPED_ADMIN_EMAIL.toLowerCase() &&
            userProfile.role !== "admin"
          ) {
            await createOrUpdateUserProfile(
              firebaseUser.uid,
              firebaseUser.email || "",
              userProfile.displayName || "",
              "admin"
            );
          } else {
            setProfile(userProfile);
          }
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithEmail = async (email: string, pass: string) => {
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (err) {
      setLoading(false);
      throw err;
    }
  };

  const signUpWithEmail = async (
    email: string,
    pass: string,
    displayName: string,
    requestedRole: UserRole
  ) => {
    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, pass);
      await createOrUpdateUserProfile(cred.user.uid, email, displayName, requestedRole);
    } catch (err) {
      setLoading(false);
      throw err;
    }
  };

  const signInWithGoogle = async (requestedRole: UserRole = "public") => {
    setLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      const cred = await signInWithPopup(auth, provider);
      // Try to check if profile exists, if not create one with requestedRole
      const existingProfile = await fetchProfile(cred.user.uid);
      if (!existingProfile) {
        await createOrUpdateUserProfile(
          cred.user.uid,
          cred.user.email || "",
          cred.user.displayName || "",
          requestedRole
        );
      }
    } catch (err) {
      setLoading(false);
      throw err;
    }
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const logout = async () => {
    setLoading(true);
    await signOut(auth);
    setProfile(null);
    setUser(null);
    setLoading(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        loginWithEmail,
        signUpWithEmail,
        signInWithGoogle,
        resetPassword,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
