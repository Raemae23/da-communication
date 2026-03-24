import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../services/firebase/config';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null); // 'admin' or 'staff'
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        
        // Fetch or create user role in Firestore
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const userDocSnap = await getDoc(userDocRef);

          if (userDocSnap.exists()) {
             // User exists, read their role
             setUserRole(userDocSnap.data().role || 'staff'); 
          } else {
             // New user! Let's assign a role. 
             // We'll make anyone with 'admin' in their email an admin by default.
             const isDefaultAdmin = user.email && user.email.toLowerCase().includes('admin');
             const assignedRole = isDefaultAdmin ? 'admin' : 'staff';
             
             await setDoc(userDocRef, {
               email: user.email,
               role: assignedRole, 
               createdAt: new Date().toISOString()
             });
             
             setUserRole(assignedRole);
          }
        } catch (error) {
          console.error("Error fetching user role:", error);
          setUserRole('staff'); // Fallback to lowest permission
        }

      } else {
        // Logged out
        setCurrentUser(null);
        setUserRole(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userRole,
    isAdmin: userRole === 'admin',
    isStaff: userRole === 'staff'
  };

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-600 border-t-transparent"></div>
          <p className="text-slate-600 font-bold animate-pulse text-sm uppercase tracking-widest">
            Initializing DA-MIMAROPA System...
          </p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
