import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, updateProfile } from 'firebase/auth';
import { auth, googleProvider } from '../firebase/firebase'; // Import Google provider
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'; // Import required functions from Firebase storage


const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setCurrentUser(user);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const login = (email, password) => {
        return signInWithEmailAndPassword(auth, email, password);
    };

    const signup = async (email, password, name) => {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName: name });

        // Write user data to Firestore with default plan "free"
        await setDoc(doc(db, 'users', userCredential.user.uid), {
            name: name,
            email: email,
            plan: 'free',
            createdAt: new Date()
        });

        return userCredential;
    };

    const logout = () => {
        return signOut(auth);
    };
    const updateProfilePicture = async (file) => {
        if (!currentUser) return;

        const storageRef = ref(storage, `profilePics/${currentUser.uid}`); // Adjust the path as needed
        await uploadBytes(storageRef, file); // Upload the file to Firebase Storage

        // Get the download URL
        const photoURL = await getDownloadURL(storageRef);

        // Update user profile in Firestore
        const userRef = doc(db, 'users', currentUser.uid); // Adjust according to your Firestore structure
        await updateDoc(userRef, { photoURL });

        // Update the current user state
        setCurrentUser((prev) => ({ ...prev, photoURL }));
    };

    // Add Google login function
    const googleLogin = async () => {
        try {
            const result = await signInWithPopup(auth, googleProvider);
            const user = result.user;

            // Check if user exists in Firestore
            const userRef = doc(db, 'users', user.uid);
            const docSnap = await getDoc(userRef);

            if (!docSnap.exists()) {
                // If user doesn't exist, create them with free plan
                await setDoc(userRef, {
                    name: user.displayName,
                    email: user.email,
                    plan: 'free',
                    createdAt: new Date()
                });
            }

            console.log('User Info:', user);
        } catch (error) {
            console.error('Google Sign-In Error:', error);
        }
    };
    return (
        <AuthContext.Provider value={{ currentUser, login, signup, logout, googleLogin, updateProfilePicture }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
