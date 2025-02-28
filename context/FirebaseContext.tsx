// context/FirebaseContext.tsx
'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { 
  User as FirebaseUser, 
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut 
} from 'firebase/auth';
import { auth, db } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { User } from '@/lib/types';

interface AuthState {
  firebaseUser: FirebaseUser | null;
  user: User | null;
  loading: boolean;
  error: string | null;
}

interface FirebaseContextType extends AuthState {
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const FirebaseContext = createContext<FirebaseContextType | undefined>(undefined);

export function FirebaseProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    firebaseUser: null,
    user: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (firebaseUser) => {
        if (firebaseUser) {
          try {
            // Get the user data from Firestore
            const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
            
            if (userDoc.exists()) {
              const userData = userDoc.data() as User;
              setAuthState({
                firebaseUser,
                user: userData,
                loading: false,
                error: null,
              });
            } else {
              // User document not found in Firestore
              setAuthState({
                firebaseUser,
                user: null,
                loading: false,
                error: 'User profile not found',
              });
            }
          } catch (error) {
            console.error('Error fetching user data:', error);
            setAuthState({
              firebaseUser,
              user: null,
              loading: false,
              error: 'Failed to load user profile',
            });
          }
        } else {
          // No user is signed in
          setAuthState({
            firebaseUser: null,
            user: null,
            loading: false,
            error: null,
          });
        }
      },
      (error) => {
        console.error('Auth state change error:', error);
        setAuthState({
          firebaseUser: null,
          user: null,
          loading: false,
          error: error.message,
        });
      }
    );

    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      await signInWithEmailAndPassword(auth, email, password);
      // Auth state listener will handle updating the state
    } catch (error: any) {
      console.error('Sign in error:', error);
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Failed to sign in',
      }));
      throw error;
    }
  };

  const signOut = async () => {
    try {
      setAuthState(prev => ({ ...prev, loading: true }));
      await firebaseSignOut(auth);
      // Auth state listener will handle updating the state
    } catch (error: any) {
      console.error('Sign out error:', error);
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Failed to sign out',
      }));
      throw error;
    }
  };

  return (
    <FirebaseContext.Provider
      value={{
        ...authState,
        signIn,
        signOut,
      }}
    >
      {children}
    </FirebaseContext.Provider>
  );
}

export const useFirebase = () => {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }
  return context;
};