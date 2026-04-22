// src/services/firebase/firestore.js
import { collection, addDoc, getDocs, doc, deleteDoc, updateDoc, query, orderBy, where } from "firebase/firestore";
import { db, auth } from "./config";

// The name of your collection in the Firebase database
const COLLECTION_NAME = "issuances";

// 1. CREATE: Save a new drafted document to the database
export const saveDocument = async (documentData) => {
  try {
    const user = auth.currentUser;
    // Adds a timestamp and user ID so we can isolate data per user
    const docWithTimestamp = {
      ...documentData,
      createdAt: new Date().toISOString(),
      userId: user ? user.uid : 'anonymous'
    };
    const docRef = await addDoc(collection(db, COLLECTION_NAME), docWithTimestamp);
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error("Error saving document: ", error);
    return { success: false, error: error.message };
  }
};

// 2. READ: Fetch all documents to display on your Dashboard
export const fetchDocuments = async () => {
  try {
    const user = auth.currentUser;
    if (!user) return { success: true, data: [] }; // No user logged in = no documents

    // Query ONLY documents created by the logged-in user
    const q = query(
      collection(db, COLLECTION_NAME),
      where("userId", "==", user.uid)
    );
    const querySnapshot = await getDocs(q);
    
    let documents = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Sort them locally by newest first to avoid Firebase requiring a complex index
    documents.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    return { success: true, data: documents };
  } catch (error) {
    console.error("Error fetching documents: ", error);
    return { success: false, error: error.message, data: [] };
  }
};

// 3. UPDATE: Edit an existing document
export const updateDocument = async (id, updatedData) => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, updatedData);
    return { success: true };
  } catch (error) {
    console.error("Error updating document: ", error);
    return { success: false, error: error.message };
  }
};

// 4. DELETE: Remove a document from the archive
export const deleteDocument = async (id) => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);
    return { success: true };
  } catch (error) {
    console.error("Error deleting document: ", error);
    return { success: false, error: error.message };
  }
};