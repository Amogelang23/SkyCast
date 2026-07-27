import { 
    doc, 
    updateDoc, 
    collection, 
    addDoc, 
    getDocs, 
    deleteDoc, 
    query, 
    orderBy 
} from 'firebase/firestore';
import { db } from './config.js';

/**
 * Updates a user's specific setting preference
 */
export const updateUserSettings = async (userId, settingKey, value) => {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
        [`settings.${settingKey}`]: value
    });
};

/**
 * Adds a new city to the user's favorite locations
 */
export const addFavoriteLocation = async (userId, locationData) => {
    const favRef = collection(db, `users/${userId}/favoriteLocations`);
    const docRef = await addDoc(favRef, {
        ...locationData,
        addedAt: new Date(),
        order: Date.now() 
    });
    return docRef.id;
};

/**
 * Retrieves all favorite locations ordered by user preference
 */
export const getUserFavorites = async (userId) => {
    const favRef = collection(db, `users/${userId}/favoriteLocations`);
    const q = query(favRef, orderBy('order', 'asc'));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    }));
};

/**
 * Removes a location from favorites
 */
export const removeFavoriteLocation = async (userId, locationId) => {
    const docRef = doc(db, `users/${userId}/favoriteLocations`, locationId);
    await deleteDoc(docRef);
};