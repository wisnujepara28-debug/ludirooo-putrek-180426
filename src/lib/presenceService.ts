import {
  collection,
  doc,
  setDoc,
  onSnapshot,
  deleteDoc,
  query,
} from 'firebase/firestore';
import { db } from './firebase';

const PRESENCE_COLLECTION = 'presence';

export interface UserPresence {
  id: string;
  username: string;
  displayName: string;
  lastActive: string;
}

/**
 * Register current user session as online and ping every 10 seconds
 */
export function startPresencePing(userId: string, username: string, displayName: string): () => void {
  const presenceDocRef = doc(db, PRESENCE_COLLECTION, userId);

  const ping = async () => {
    try {
      await setDoc(presenceDocRef, {
        id: userId,
        username,
        displayName,
        lastActive: new Date().toISOString(),
      });
    } catch (e) {
      console.warn('Presence ping notice:', e);
    }
  };

  ping();
  const intervalId = setInterval(ping, 10000);

  // Clean up presence on disconnect
  const cleanup = () => {
    clearInterval(intervalId);
    try {
      deleteDoc(presenceDocRef);
    } catch {
      // Ignore
    }
  };

  window.addEventListener('beforeunload', cleanup);

  return () => {
    clearInterval(intervalId);
    window.removeEventListener('beforeunload', cleanup);
    cleanup();
  };
}

/**
 * Subscribe to live online presence list across all connected users
 */
export function subscribeToOnlineUsers(onUpdate: (users: UserPresence[]) => void) {
  const q = query(collection(db, PRESENCE_COLLECTION));

  return onSnapshot(
    q,
    (snapshot) => {
      const now = Date.now();
      const activeUsers: UserPresence[] = [];

      snapshot.docs.forEach((d) => {
        const data = d.data();
        if (data.lastActive) {
          const lastActiveMs = new Date(data.lastActive).getTime();
          // User is considered online if last active within 30 seconds
          if (now - lastActiveMs < 30000) {
            activeUsers.push({
              id: d.id,
              username: data.username || 'ADMIN',
              displayName: data.displayName || 'Admin Online',
              lastActive: data.lastActive,
            });
          }
        }
      });

      onUpdate(activeUsers);
    },
    (err) => {
      console.warn('Online presence subscription notice:', err);
    }
  );
}
