import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  getDocs,
  onSnapshot,
  writeBatch,
  query,
  limit,
  Unsubscribe,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { Player, Match, LeagueSettings, User, SystemLog, LeagueNotification } from '../types';
import { INITIAL_PLAYERS, INITIAL_MATCHES, INITIAL_SETTINGS } from '../data/initialData';

// Initialize primary Firebase App
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firebase Auth
export const auth = getAuth(app);

// Initialize Firestore (support named database if configured in firebase-applet-config.json)
export const db =
  firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
    ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
    : getFirestore(app);

// Initialize Firebase App Check only if valid reCAPTCHA site key is explicitly provided
let appCheckInstance: ReturnType<typeof initializeAppCheck> | null = null;
if (typeof window !== 'undefined') {
  const recaptchaKey =
    (import.meta.env.VITE_RECAPTCHA_SITE_KEY as string) ||
    (firebaseConfig as Record<string, any>).recaptchaSiteKey ||
    '';

  if (recaptchaKey && recaptchaKey.trim() !== '') {
    try {
      appCheckInstance = initializeAppCheck(app, {
        provider: new ReCaptchaV3Provider(recaptchaKey),
        isTokenAutoRefreshEnabled: true,
      });
    } catch {
      // Graceful fallback if App Check is not enabled
    }
  }
}
export { appCheckInstance as appCheck };

const PLAYERS_COLLECTION = 'players';
const MATCHES_COLLECTION = 'matches';
const SETTINGS_COLLECTION = 'settings';
const USERS_COLLECTION = 'users';
const SYSTEM_LOGS_COLLECTION = 'system_logs';
const NOTIFICATIONS_COLLECTION = 'notifications';
const SETTINGS_DOC_ID = 'league';

let isSeeding = false;

/**
 * Resets league matches and settings for a clean season.
 * Note: User accounts in Firebase Auth and Firestore users collection are preserved.
 */
export async function cleanDatabaseForNewSeason(): Promise<void> {
  try {
    console.log('🧹 Purging old match data and resetting settings for new season...');
    // 1. Delete all matches in collection
    const matchesSnap = await getDocs(collection(db, MATCHES_COLLECTION));
    if (!matchesSnap.empty) {
      const matchBatch = writeBatch(db);
      matchesSnap.docs.forEach((d) => matchBatch.delete(d.ref));
      await matchBatch.commit();
    }

    // 2. Ensure commissioner player card exists
    await setDoc(doc(db, PLAYERS_COLLECTION, 'p1'), INITIAL_PLAYERS[0], { merge: true });

    // 3. Update settings
    await setDoc(doc(db, SETTINGS_COLLECTION, SETTINGS_DOC_ID), INITIAL_SETTINGS, { merge: true });
    console.log('✅ Database is clean and ready for new season.');
  } catch (err) {
    console.warn('⚠️ Error while cleaning database for new season:', err);
  }
}

/**
 * Initializes and seeds Firestore with initial league settings/players if collections are empty.
 * Zero hardcoded passwords or user credentials are seeded.
 */
export async function ensureInitialSeed(): Promise<void> {
  if (isSeeding) return;
  try {
    const playersSnapshot = await getDocs(query(collection(db, PLAYERS_COLLECTION), limit(1)));
    if (playersSnapshot.empty) {
      isSeeding = true;
      console.log('🌱 Seeding initial league players and settings into Firestore...');
      const batch = writeBatch(db);

      // Seed initial player profile
      for (const player of INITIAL_PLAYERS) {
        batch.set(doc(db, PLAYERS_COLLECTION, player.id), player);
      }

      // Seed initial matches (empty)
      for (const match of INITIAL_MATCHES) {
        batch.set(doc(db, MATCHES_COLLECTION, match.id), match);
      }

      // Seed settings
      batch.set(doc(db, SETTINGS_COLLECTION, SETTINGS_DOC_ID), INITIAL_SETTINGS);

      await batch.commit();
      console.log('✅ Initial league players & settings successfully seeded to Firestore.');
    }

    // Auto-reconcile: ensure all approved users have a corresponding player document
    await reconcileApprovedUsersWithPlayers();
  } catch (error) {
    console.warn('⚠️ Could not check or seed initial Firestore data:', error);
  } finally {
    isSeeding = false;
  }
}

/**
 * Self-healing integrity checker:
 * Finds any approved users in Firestore that lack a corresponding Player document
 * and automatically restores/creates the player profile.
 */
export async function reconcileApprovedUsersWithPlayers(): Promise<void> {
  try {
    const [usersSnap, playersSnap] = await Promise.all([
      getDocs(collection(db, USERS_COLLECTION)),
      getDocs(collection(db, PLAYERS_COLLECTION)),
    ]);

    const existingPlayerIds = new Set(playersSnap.docs.map((d) => d.id));
    const colors = [
      'bg-emerald-700',
      'bg-blue-700',
      'bg-amber-600',
      'bg-rose-700',
      'bg-indigo-700',
      'bg-teal-700',
      'bg-stone-700',
    ];

    for (const userDoc of usersSnap.docs) {
      const userData = userDoc.data() as User;
      if (userData.status === 'approved' && userData.playerId) {
        if (!existingPlayerIds.has(userData.playerId)) {
          console.log(`🔧 Self-healing: recreating missing player document ${userData.playerId} for user ${userData.name}`);
          const restoredPlayer: Player = {
            id: userData.playerId,
            name: userData.name,
            nickname: userData.nickname,
            phone: userData.phone || 'Brak numeru',
            email: userData.email,
            avatarColor: colors[Math.floor(Math.random() * colors.length)],
            playStyle: userData.playStyle?.trim() || undefined,
            preferredSurfaces: ['Mączka'],
            preferredCourts: userData.preferredCourts?.trim() || undefined,
            preferredTimes: userData.preferredTimes?.trim() || undefined,
            status: 'active',
          };
          await savePlayerToFirestore(restoredPlayer);
          existingPlayerIds.add(userData.playerId);
        }
      }
    }
  } catch (err) {
    console.warn('Could not run player reconciliation:', err);
  }
}

/**
 * Real-time subscription to players collection.
 */
export function subscribeToPlayers(onUpdate: (players: Player[]) => void): Unsubscribe {
  const colRef = collection(db, PLAYERS_COLLECTION);
  return onSnapshot(
    colRef,
    (snapshot) => {
      if (!snapshot.empty) {
        const players: Player[] = snapshot.docs.map((d) => d.data() as Player);
        onUpdate(players);
      } else {
        ensureInitialSeed();
      }
    },
    (error) => {
      console.warn('Firestore players subscription error:', error);
    }
  );
}

/**
 * Real-time subscription to matches collection.
 */
export function subscribeToMatches(onUpdate: (matches: Match[]) => void): Unsubscribe {
  const colRef = collection(db, MATCHES_COLLECTION);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const matches: Match[] = snapshot.docs.map((d) => d.data() as Match);
      onUpdate(matches);
    },
    (error) => {
      console.warn('Firestore matches subscription error:', error);
    }
  );
}

/**
 * Real-time subscription to league settings.
 */
export function subscribeToSettings(onUpdate: (settings: LeagueSettings) => void): Unsubscribe {
  const docRef = doc(db, SETTINGS_COLLECTION, SETTINGS_DOC_ID);
  return onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        onUpdate(snapshot.data() as LeagueSettings);
      }
    },
    (error) => {
      console.warn('Firestore settings subscription error:', error);
    }
  );
}

/**
 * Real-time subscription to user accounts list (used by administrators).
 */
export function subscribeToUsers(onUpdate: (users: User[]) => void): Unsubscribe {
  const colRef = collection(db, USERS_COLLECTION);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const users: User[] = snapshot.docs.map((d) => d.data() as User);
      onUpdate(users);
    },
    (error) => {
      console.warn('Firestore users subscription error:', error);
    }
  );
}

/**
 * Real-time subscription to single user document (used by logged in user to observe status/role changes).
 */
export function subscribeToUserDoc(userId: string, onUpdate: (user: User | null) => void): Unsubscribe {
  const docRef = doc(db, USERS_COLLECTION, userId);
  return onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        onUpdate(snapshot.data() as User);
      } else {
        onUpdate(null);
      }
    },
    (error) => {
      console.warn('Firestore user document subscription error:', error);
    }
  );
}

/**
 * Recursively removes keys with undefined values so that Firestore's setDoc/updateDoc
 * does not throw "Unsupported field value: undefined".
 */
export function cleanForFirestore<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(cleanForFirestore) as unknown as T;
  }
  const clean: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      clean[key] = cleanForFirestore(value);
    }
  }
  return clean as T;
}

/**
 * Save or update a player in Firestore.
 */
export async function savePlayerToFirestore(player: Player): Promise<void> {
  try {
    const cleaned = cleanForFirestore(player);
    await setDoc(doc(db, PLAYERS_COLLECTION, player.id), cleaned, { merge: true });
  } catch (error) {
    console.error('Error saving player to Firestore:', error);
    throw error;
  }
}

/**
 * Delete a player from Firestore.
 */
export async function deletePlayerFromFirestore(playerId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, PLAYERS_COLLECTION, playerId));
  } catch (error) {
    console.error('Error deleting player from Firestore:', error);
    throw error;
  }
}

/**
 * Save or update a match in Firestore.
 */
export async function saveMatchToFirestore(match: Match): Promise<void> {
  try {
    const cleaned = cleanForFirestore(match);
    await setDoc(doc(db, MATCHES_COLLECTION, match.id), cleaned, { merge: true });
  } catch (error) {
    console.error('Error saving match to Firestore:', error);
    throw error;
  }
}

/**
 * Delete a match from Firestore.
 */
export async function deleteMatchFromFirestore(matchId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, MATCHES_COLLECTION, matchId));
  } catch (error) {
    console.error('Error deleting match from Firestore:', error);
    throw error;
  }
}

/**
 * Save league settings to Firestore.
 */
export async function saveSettingsToFirestore(settings: LeagueSettings): Promise<void> {
  try {
    const cleaned = cleanForFirestore(settings);
    await setDoc(doc(db, SETTINGS_COLLECTION, SETTINGS_DOC_ID), cleaned, { merge: true });
  } catch (error) {
    console.error('Error saving settings to Firestore:', error);
    throw error;
  }
}

/**
 * Save or update user profile document in Firestore under their UID.
 */
export async function saveUserToFirestore(user: User): Promise<void> {
  try {
    const cleaned = cleanForFirestore(user);
    await setDoc(doc(db, USERS_COLLECTION, user.id), cleaned, { merge: true });
  } catch (error) {
    console.error('Error saving user to Firestore:', error);
    throw error;
  }
}

/**
 * Delete user account document from Firestore.
 */
export async function deleteUserFromFirestore(userId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, USERS_COLLECTION, userId));
  } catch (error) {
    console.error('Error deleting user from Firestore:', error);
    throw error;
  }
}

/**
 * Batch import league data into Firestore.
 */
export async function importDataToFirestore(
  players: Player[],
  matches: Match[],
  settings?: LeagueSettings
): Promise<void> {
  const batch = writeBatch(db);

  for (const p of players) {
    batch.set(doc(db, PLAYERS_COLLECTION, p.id), cleanForFirestore(p));
  }

  for (const m of matches) {
    batch.set(doc(db, MATCHES_COLLECTION, m.id), cleanForFirestore(m));
  }

  if (settings) {
    batch.set(doc(db, SETTINGS_COLLECTION, SETTINGS_DOC_ID), cleanForFirestore(settings));
  }

  await batch.commit();
}

/**
 * Reset all league data in Firestore to official initial state.
 */
export async function resetLeagueDataInFirestore(): Promise<void> {
  await cleanDatabaseForNewSeason();
}

/**
 * Save a system log entry to Firestore.
 */
export async function saveSystemLogToFirestore(log: SystemLog): Promise<void> {
  try {
    const cleaned = cleanForFirestore(log);
    await setDoc(doc(db, SYSTEM_LOGS_COLLECTION, log.id), cleaned, { merge: true });
  } catch (error) {
    console.error('Error saving system log to Firestore:', error);
  }
}

/**
 * Fetch recent system logs from Firestore.
 */
export async function fetchSystemLogsFromFirestore(limitCount: number = 200): Promise<SystemLog[]> {
  try {
    const logsQuery = query(collection(db, SYSTEM_LOGS_COLLECTION), limit(limitCount));
    const snap = await getDocs(logsQuery);
    const logs: SystemLog[] = [];
    snap.docs.forEach((d) => {
      logs.push(d.data() as SystemLog);
    });
    return logs.sort((a, b) => b.timestamp - a.timestamp);
  } catch (error) {
    console.error('Error fetching system logs from Firestore:', error);
    return [];
  }
}

/**
 * Real-time subscription to system logs from Firestore.
 */
export function subscribeToSystemLogs(
  callback: (logs: SystemLog[]) => void,
  limitCount: number = 200
): Unsubscribe {
  const logsQuery = query(collection(db, SYSTEM_LOGS_COLLECTION), limit(limitCount));
  return onSnapshot(
    logsQuery,
    (snapshot) => {
      const logs: SystemLog[] = [];
      snapshot.docs.forEach((d) => {
        logs.push(d.data() as SystemLog);
      });
      logs.sort((a, b) => b.timestamp - a.timestamp);
      callback(logs);
    },
    (error) => {
      console.warn('System logs snapshot subscription error:', error);
    }
  );
}

/**
 * Clear all system logs from Firestore (Admin action).
 */
export async function clearSystemLogsInFirestore(): Promise<void> {
  try {
    const snap = await getDocs(collection(db, SYSTEM_LOGS_COLLECTION));
    if (snap.empty) return;
    const batch = writeBatch(db);
    snap.docs.forEach((d) => batch.delete(d.ref));
    await batch.commit();
  } catch (error) {
    console.error('Error clearing system logs from Firestore:', error);
    throw error;
  }
}

/**
 * Save a league notification to Firestore.
 */
export async function saveNotificationToFirestore(notification: LeagueNotification): Promise<void> {
  try {
    const cleaned = cleanForFirestore(notification);
    await setDoc(doc(db, NOTIFICATIONS_COLLECTION, notification.id), cleaned, { merge: true });
  } catch (error) {
    console.error('Error saving notification to Firestore:', error);
  }
}

/**
 * Real-time subscription to league notifications.
 */
export function subscribeToNotifications(
  onUpdate: (notifications: LeagueNotification[]) => void,
  limitCount: number = 60
): Unsubscribe {
  const notifsQuery = query(collection(db, NOTIFICATIONS_COLLECTION), limit(limitCount));
  return onSnapshot(
    notifsQuery,
    (snapshot) => {
      const items: LeagueNotification[] = [];
      snapshot.docs.forEach((d) => {
        items.push(d.data() as LeagueNotification);
      });
      items.sort((a, b) => b.createdAt - a.createdAt);
      onUpdate(items);
    },
    (error) => {
      console.warn('Notifications snapshot subscription warning:', error);
    }
  );
}

/**
 * Mark a single notification as read by a specific player or user.
 */
export async function markNotificationAsReadInFirestore(
  notificationId: string,
  readerId: string
): Promise<void> {
  try {
    const docRef = doc(db, NOTIFICATIONS_COLLECTION, notificationId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data() as LeagueNotification;
      const currentReaders = data.readBy || [];
      if (!currentReaders.includes(readerId)) {
        await setDoc(docRef, { readBy: [...currentReaders, readerId] }, { merge: true });
      }
    }
  } catch (error) {
    console.warn('Error marking notification read in Firestore:', error);
  }
}

/**
 * Mark multiple notifications as read by a specific player or user.
 */
export async function markAllNotificationsAsReadInFirestore(
  notificationIds: string[],
  readerId: string
): Promise<void> {
  try {
    if (notificationIds.length === 0) return;
    const batch = writeBatch(db);
    for (const notifId of notificationIds) {
      const docRef = doc(db, NOTIFICATIONS_COLLECTION, notifId);
      batch.set(docRef, { readBy: [readerId] }, { merge: true });
    }
    await batch.commit();
  } catch (error) {
    console.warn('Error marking all notifications read in Firestore:', error);
  }
}

/**
 * Delete a notification from Firestore.
 */
export async function deleteNotificationFromFirestore(notificationId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, NOTIFICATIONS_COLLECTION, notificationId));
  } catch (error) {
    console.warn('Error deleting notification from Firestore:', error);
  }
}
