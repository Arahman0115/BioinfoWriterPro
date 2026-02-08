import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getFunctions } from "firebase/functions";

const firebaseConfig = {

  apiKey: "AIzaSyBuGG_AhkheFurIlZsODNlSmHWSuPnexzE",

  authDomain: "bioinfowritpro.firebaseapp.com",

  projectId: "bioinfowritpro",

  storageBucket: "bioinfowritpro.appspot.com",

  messagingSenderId: "520528881526",

  appId: "1:520528881526:web:cc3ac910b4716c26643c57",

  measurementId: "G-0RHBK6EWTV"

};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);
export const googleProvider = new GoogleAuthProvider();
