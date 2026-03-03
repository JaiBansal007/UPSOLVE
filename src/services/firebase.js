// Firebase configuration and initialization
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { 
  getDatabase, 
  ref, 
  set, 
  get,
  onValue, 
  onDisconnect, 
  serverTimestamp as rtdbServerTimestamp,
  increment,
  update
} from "firebase/database";
import { 
  getAuth, 
  signInAnonymously, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,
  onAuthStateChanged 
} from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDurAouPSIpquYBMjoO0mBwSx2ZRaHuA5E",
  authDomain: "cf-upsolve.firebaseapp.com",
  projectId: "cf-upsolve",
  storageBucket: "cf-upsolve.firebasestorage.app",
  messagingSenderId: "662968893118",
  appId: "1:662968893118:web:8cb4a3469564bf3348a8ef",
  measurementId: "G-3QWLDRWTW4",
  databaseURL: "https://cf-upsolve-default-rtdb.firebaseio.com"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const rtdb = getDatabase(app);
const auth = getAuth(app);

// Google Auth Provider
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Auth functions
export const signInWithGoogle = () => {
  return signInWithPopup(auth, googleProvider);
};

export const signOutUser = () => {
  return signOut(auth);
};

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

// Presence System
export const setupPresence = (userId, cfHandle = null) => {
  const userStatusRef = ref(rtdb, `presence/${userId}`);
  const connectedRef = ref(rtdb, '.info/connected');

  onValue(connectedRef, (snapshot) => {
    if (snapshot.val() === true) {
      // User is connected
      set(userStatusRef, {
        online: true,
        lastSeen: rtdbServerTimestamp(),
        cfHandle: cfHandle
      });

      // When user disconnects, update their status
      onDisconnect(userStatusRef).set({
        online: false,
        lastSeen: rtdbServerTimestamp(),
        cfHandle: cfHandle
      });
    }
  });
};

export const getOnlineUsersRef = () => ref(rtdb, 'presence');

// Stats tracking
export const getStatsRef = () => ref(rtdb, 'stats');

export const incrementVisitCount = async () => {
  const statsRef = ref(rtdb, 'stats/totalVisits');
  try {
    await update(ref(rtdb, 'stats'), {
      totalVisits: increment(1)
    });
  } catch (error) {
    console.error('Error incrementing visit count:', error);
  }
};

export const registerUser = async (cfHandle) => {
  const usersRef = ref(rtdb, `registeredUsers/${cfHandle}`);
  try {
    const snapshot = await get(usersRef);
    if (!snapshot.exists()) {
      // New user, add them and increment count
      await set(usersRef, {
        registeredAt: rtdbServerTimestamp(),
        cfHandle: cfHandle
      });
      await update(ref(rtdb, 'stats'), {
        registeredUsers: increment(1)
      });
    }
  } catch (error) {
    console.error('Error registering user:', error);
  }
};

// Bug Report System
export const submitBugReport = async (userId, userEmail, cfHandle, reportText) => {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
  const userReportsRef = ref(rtdb, `bugReportCounts/${userId}/${today}`);
  
  try {
    // Check daily limit
    const countSnapshot = await get(userReportsRef);
    const currentCount = countSnapshot.exists() ? countSnapshot.val() : 0;
    
    if (currentCount >= 5) {
      throw new Error('Daily report limit reached (5 reports per day)');
    }
    
    // Submit the report
    const reportId = Date.now().toString();
    const reportRef = ref(rtdb, `bugReports/${reportId}`);
    await set(reportRef, {
      id: reportId,
      userId: userId,
      userEmail: userEmail,
      cfHandle: cfHandle || 'Anonymous',
      reportText: reportText,
      createdAt: rtdbServerTimestamp(),
      status: 'pending'
    });
    
    // Increment daily count
    await set(userReportsRef, currentCount + 1);
    
    return { success: true, reportId };
  } catch (error) {
    console.error('Error submitting bug report:', error);
    throw error;
  }
};

export const getBugReports = async () => {
  const reportsRef = ref(rtdb, 'bugReports');
  try {
    const snapshot = await get(reportsRef);
    if (snapshot.exists()) {
      const reports = [];
      snapshot.forEach((child) => {
        reports.push(child.val());
      });
      // Sort by createdAt descending
      return reports.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    }
    return [];
  } catch (error) {
    console.error('Error fetching bug reports:', error);
    return [];
  }
};

export const deleteBugReport = async (reportId) => {
  const reportRef = ref(rtdb, `bugReports/${reportId}`);
  try {
    await set(reportRef, null);
    return { success: true };
  } catch (error) {
    console.error('Error deleting bug report:', error);
    throw error;
  }
};

export const getUserDailyReportCount = async (userId) => {
  const today = new Date().toISOString().split('T')[0];
  const userReportsRef = ref(rtdb, `bugReportCounts/${userId}/${today}`);
  try {
    const snapshot = await get(userReportsRef);
    return snapshot.exists() ? snapshot.val() : 0;
  } catch (error) {
    console.error('Error getting report count:', error);
    return 0;
  }
};

export { rtdb, ref, onValue, get };
