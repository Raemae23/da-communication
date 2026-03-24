// src/services/firebase/auth.js
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider
} from "firebase/auth";
import { auth } from "./config";

// Login function
export const loginUser = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { success: true, user: userCredential.user };
  } catch (error) {
    console.error("Login failed:", error.message);
    // Return custom error messages based on Firebase error codes
    let errorMessage = "Failed to log in.";
    if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
      errorMessage = "Invalid email or password.";
    }
    return { success: false, error: errorMessage };
  }
};

// Register function (FOR TESTING RBAC ONLY)
export const registerUser = async (email, password) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return { success: true, user: userCredential.user };
  } catch (error) {
    console.error("Registration failed:", error.message);
    let errorMessage = "Failed to create account.";
    if (error.code === 'auth/email-already-in-use') {
      errorMessage = "This email is already registered.";
    } else if (error.code === 'auth/weak-password') {
      errorMessage = "Password should be at least 6 characters.";
    }
    return { success: false, error: errorMessage };
  }
};

// Logout function
export const logoutUser = async () => {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error) {
    console.error("Logout failed:", error.message);
    return { success: false, error: error.message };
  }
};

// Update display name
export const updateUserProfile = async (displayName) => {
  try {
    await updateProfile(auth.currentUser, { displayName });
    return { success: true };
  } catch (error) {
    console.error("Profile update failed:", error.message);
    return { success: false, error: error.message };
  }
};

// Update password (requires current password for re-auth)
export const updateUserPassword = async (currentPassword, newPassword) => {
  try {
    const user = auth.currentUser;
    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, credential);
    await updatePassword(user, newPassword);
    return { success: true };
  } catch (error) {
    console.error("Password update failed:", error.message);
    let errorMessage = "Failed to update password.";
    if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
      errorMessage = "Current password is incorrect.";
    } else if (error.code === 'auth/weak-password') {
      errorMessage = "New password must be at least 6 characters.";
    } else if (error.code === 'auth/requires-recent-login') {
      errorMessage = "Session expired. Please log out and log in again.";
    }
    return { success: false, error: errorMessage };
  }
};