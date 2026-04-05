import { useState, useEffect } from 'react';
import { getOnlineUsersRef, getStatsRef, onValue, setupPresence, auth, incrementVisitCount, authPromise } from '../services/firebase';

export function useOnlinePresence(cfHandle) {
  const [onlineCount, setOnlineCount] = useState(0);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [totalVisits, setTotalVisits] = useState(0);
  const [registeredUsers, setRegisteredUsers] = useState(0);

  // Increment visit count on mount (once per session)
  useEffect(() => {
    const sessionKey = 'cf_upsolve_visited';
    if (!sessionStorage.getItem(sessionKey)) {
      incrementVisitCount();
      sessionStorage.setItem(sessionKey, 'true');
    }
  }, []);

  // Setup presence when user is authenticated (track all visitors)
  useEffect(() => {
    let unmountPresence = null;
    const initPresence = async () => {
      try {
        // Wait for auth to be ready
        await authPromise;
        if (auth.currentUser) {
          unmountPresence = setupPresence(auth.currentUser.uid, cfHandle || null);
        }
      } catch (error) {
        console.error('Error setting up presence:', error);
      }
    };
    initPresence();
    
    return () => {
      if (typeof unmountPresence === 'function') {
        unmountPresence();
      }
    };
  }, [cfHandle]);

  // Listen to online users
  useEffect(() => {
    const presenceRef = getOnlineUsersRef();
    
    const unsubscribe = onValue(presenceRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const users = Object.entries(data)
          .filter(([_, user]) => user.online)
          .map(([id, user]) => ({
            id,
            cfHandle: user.cfHandle,
            lastSeen: user.lastSeen
          }));
          
        // Deduplicate instances to fix wrong inflated counts
        const uniqueHandles = new Set();
        let anonCount = 0;
        
        users.forEach(u => {
          if (u.cfHandle) {
            uniqueHandles.add(u.cfHandle);
          } else {
            anonCount++;
          }
        });
        
        setOnlineCount(uniqueHandles.size + anonCount);
        setOnlineUsers(users);
      } else {
        setOnlineCount(0);
        setOnlineUsers([]);
      }
    }, (error) => {
      console.error('Error listening to presence:', error);
      // If there's a permission error, show a count of 1 (current user)
      setOnlineCount(1);
    });

    return () => unsubscribe();
  }, []);

  // Listen to stats
  useEffect(() => {
    const statsRef = getStatsRef();
    
    const unsubscribe = onValue(statsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setTotalVisits(data.totalVisits || 0);
        setRegisteredUsers(data.registeredUsers || 0);
      }
    }, (error) => {
      console.error('Error listening to stats:', error);
    });

    return () => unsubscribe();
  }, []);

  return { onlineCount, onlineUsers, totalVisits, registeredUsers };
}
