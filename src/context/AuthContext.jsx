import React, { createContext, useContext, useEffect, useState } from 'react';
import {
    onAuthStateChanged, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword,
    signInWithPopup, updateProfile
} from 'firebase/auth';
import { auth, googleProvider, storage } from '../firebase/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

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

        const token = await userCredential.user.getIdToken();

        await fetch(`${import.meta.env.VITE_API_URL}/api/init-user`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                name,
                email
            })
        });

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
        try {
            const result = await signInWithPopup(auth, googleProvider);
            const user = result.user;

            const token = await user.getIdToken();

            await fetch(`${import.meta.env.VITE_API_URL}/api/init-user`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    name: user.displayName,
                    email: user.email
                })
            });

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
