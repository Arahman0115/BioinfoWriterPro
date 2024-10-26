// src/utils/firebaseSequences.js
import { db } from '../firebase/firebase';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';

export const saveSequence = async (userId, name, accession, sequence, source = 'GenBank') => {
    try {
        const docRef = await addDoc(collection(db, "sequences"), {
            userId,
            name,
            accession,
            sequence,
            dateAdded: new Date(),
            source
        });
        console.log("Sequence saved with ID: ", docRef.id);
        return docRef.id;
    } catch (e) {
        console.error("Error adding sequence: ", e);
        throw e;
    }
};

export const getUserSequences = async (userId) => {
    const q = query(collection(db, "sequences"), where("userId", "==", userId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

