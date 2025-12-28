// Firebase configuration and initialization
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, signInAnonymously, onAuthStateChanged } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDurAouPSIpquYBMjoO0mBwSx2ZRaHuA5E",
  authDomain: "cf-upsolve.firebaseapp.com",
  projectId: "cf-upsolve",
  storageBucket: "cf-upsolve.firebasestorage.app",
  messagingSenderId: "662968893118",
  appId: "1:662968893118:web:8cb4a3469564bf3348a8ef",
  measurementId: "G-3QWLDRWTW4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Anonymous authentication promise
let authInitialized = false;
const authPromise = new Promise((resolve, reject) => {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      authInitialized = true;
      resolve(user);
    } else if (!authInitialized) {
      // Sign in anonymously if no user
      signInAnonymously(auth)
        .then((userCredential) => {
          authInitialized = true;
          resolve(userCredential.user);
        })
        .catch(reject);
    }
  });
});

export { db, auth, authPromise };
