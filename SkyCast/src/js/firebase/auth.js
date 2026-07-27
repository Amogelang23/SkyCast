import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signInWithPopup, 
    GoogleAuthProvider, 
    signOut 
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from './config.js';

const googleProvider = new GoogleAuthProvider();

// Initialize user profile in Firestore if it doesn't exist
const initializeUserProfile = async (user) => {
    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
        await setDoc(userRef, {
            email: user.email,
            displayName: user.displayName || 'Sky Watcher',
            photoURL: user.photoURL || '',
            createdAt: new Date(),
            settings: {
                theme: 'dark',
                units: 'metric',
                defaultCity: 'London',
                language: 'en'
            }
        });
    }
};

export const registerUser = async (email, password) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await initializeUserProfile(userCredential.user);
    return userCredential.user;
};

export const loginWithGoogle = async () => {
    const result = await signInWithPopup(auth, googleProvider);
    await initializeUserProfile(result.user);
    return result.user;
};

export const logoutUser = () => signOut(auth);