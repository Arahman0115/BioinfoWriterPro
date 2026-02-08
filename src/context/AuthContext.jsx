import React, { createContext, useContext, useEffect, useState } from 'react';
import {
    onAuthStateChanged, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword,
    signInWithPopup, updateProfile
} from 'firebase/auth';
import { auth, googleProvider, storage, functions } from '../firebase/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { httpsCallable } from 'firebase/functions';

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

        try {
            await httpsCallable(functions, 'initUser')({ name, email });
        } catch (error) {
            console.warn('Backend initialization failed, continuing with Firebase auth:', error.message);
        }

        return userCredential;
    };

    const logout = () => {
        return signOut(auth);
    };

    const updateProfilePicture = async (file) => {
        if (!currentUser) return;

        const storageRef = ref(storage, `profilePics/${currentUser.uid}`);
        await uploadBytes(storageRef, file);

        const photoURL = await getDownloadURL(storageRef);
        setCurrentUser((prev) => ({ ...prev, photoURL }));
    };

    const googleLogin = async () => {
        const result = await signInWithPopup(auth, googleProvider);
        const user = result.user;

        try {
            await httpsCallable(functions, 'initUser')({ name: user.displayName, email: user.email });
        } catch (error) {
            console.warn('Backend initialization failed, continuing with Firebase auth:', error.message);
        }
    };

    return (
        <AuthContext.Provider value={{ currentUser, login, signup, logout, googleLogin, updateProfilePicture }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
