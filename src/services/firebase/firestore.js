// src/services/firebase/firestore.js
import { collection, addDoc, getDocs, doc, deleteDoc, updateDoc, query, orderBy } from "firebase/firestore";
import { db } from "./config";

// The name of your collection in the Firebase database
const COLLECTION_NAME = "issuances";

// 1. CREATE: Save a new drafted document to the database
export const saveDocument = async (documentData) => {
  try {
    // Adds a timestamp so we can sort them later
    const docWithTimestamp = {
      ...documentData,
      createdAt: new Date().toISOString(),
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
    // Query documents ordered by the newest first
    const q = query(collection(db, COLLECTION_NAME), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    
    const documents = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
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