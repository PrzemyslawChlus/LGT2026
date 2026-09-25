import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updatePassword,
} from 'firebase/auth';
import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { User, Player } from '../types';
import { auth, db, savePlayerToFirestore } from '../lib/firebase';
import firebaseConfig from '../../firebase-applet-config.json';
import { logEvent } from './logger';

export interface RegistrationInput {
  name: string;
  email: string;
  password: string;
  phone: string;
  nickname?: string;
  playStyle?: string;
  preferredCourts?: string;
  preferredTimes?: string;
}

export interface AdminCreateUserInput {
  name: string;
  email: string;
  phone: string;
  password: string;
  nickname?: string;
  playStyle?: string;
  preferredCourts?: string;
  preferredTimes?: string;
  preferredSurfaces?: string[];
  avatarColor?: string;
  role?: 'player' | 'admin';
  status?: 'approved' | 'pending';
  notes?: string;
}

/**
 * Validates password length (minimum 6 characters required by Firebase Auth).
 */
export function validatePassword(password: string): void {
  if (!password || password.trim().length < 6) {
    throw new Error('Nowe hasło musi zawierać co najmniej 6 znaków.');
  }
}

/**
 * Password change helper for test runners and administrators.
 */
export function changeUserPassword(userId: string, newPasswordRaw: string): void {
  validatePassword(newPasswordRaw);
}

/**
 * Translates Firebase Auth error codes into friendly Polish messages.
 */
export function getFirebaseAuthErrorMessage(errorCode: string): string {
  switch (errorCode) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Nieprawidłowy adres e-mail lub hasło dostępowe.';
    case 'auth/email-already-in-use':
      return 'Konto z tym adresem e-mail już istnieje w rejestrze ligi.';
    case 'auth/weak-password':
      return 'Hasło jest zbyt słabe. Wymagane jest co najmniej 6 znaków.';
    case 'auth/invalid-email':
      return 'Wprowadzony adres e-mail ma niepoprawny format.';
    case 'auth/user-disabled':
      return 'To konto zostało wyłączone. Skontaktuj się z Komisarzem Ligi.';
    case 'auth/too-many-requests':
      return 'Zbyt wiele nieudanych prób logowania. Odczekaj chwilę przed kolejną próbą.';
    case 'auth/network-request-failed':
      return 'Błąd połączenia z siecią. Sprawdź swoje połączenie internetowe.';
    default:
      return 'Wystąpił błąd autoryzacji. Spróbuj ponownie lub skontaktuj się z administratorem.';
  }
}

/**
 * Signs in a user using Firebase Authentication and validates their status from Firestore.
 */
export async function loginWithFirebase(emailInput: string, passwordAttempt: string): Promise<User> {
  const cleanEmail = emailInput.trim().toLowerCase();
  validatePassword(passwordAttempt);

  try {
    const cred = await signInWithEmailAndPassword(auth, cleanEmail, passwordAttempt.trim());
    const uid = cred.user.uid;

    // Fetch user profile from Firestore (Server-authoritative RBAC)
    const userDocRef = doc(db, 'users', uid);
    const userDocSnap = await getDoc(userDocRef);

    let userProfile: User;

    if (userDocSnap.exists()) {
      userProfile = userDocSnap.data() as User;
    } else {
      // Check if user is pre-registered in admins collection
      const adminDocSnap = await getDoc(doc(db, 'admins', uid));
      const isAdmin = adminDocSnap.exists();

      userProfile = {
        id: uid,
        email: cleanEmail,
        name: cred.user.displayName || cleanEmail.split('@')[0],
        role: isAdmin ? 'admin' : 'player',
        status: isAdmin ? 'approved' : 'pending',
        createdAt: Date.now(),
      };
      await setDoc(userDocRef, userProfile, { merge: true });
    }

    // Verify account status
    if (userProfile.status === 'pending') {
      await signOut(auth);
      await logEvent({
        action: 'LOGIN_FAILED',
        level: 'info',
        userEmail: cleanEmail,
        userName: userProfile.name,
        details: `Próba logowania na konto oczekujące: ${userProfile.name} (${cleanEmail}).`,
      });
      throw new Error(
        'Twoje konto oczekuje na zatwierdzenie przez Komisarza Ligi. Po weryfikacji otrzymasz pełny dostęp do ligi.'
      );
    }

    if (userProfile.status === 'blocked') {
      await signOut(auth);
      await logEvent({
        action: 'LOGIN_FAILED',
        level: 'warn',
        userEmail: cleanEmail,
        userName: userProfile.name,
        details: `Próba logowania na zablokowane konto: ${userProfile.name} (${cleanEmail}).`,
      });
      throw new Error(
        'To konto zostało zablokowane przez Administratora Ligi. Skontaktuj się z Komisarzem Ligi.'
      );
    }

    if (userProfile.status === 'rejected') {
      await signOut(auth);
      await logEvent({
        action: 'LOGIN_FAILED',
        level: 'warn',
        userEmail: cleanEmail,
        userName: userProfile.name,
        details: `Próba logowania na odrzucone konto: ${userProfile.name} (${cleanEmail}).`,
      });
      throw new Error(
        'Twoje zgłoszenie do ligi zostało odrzucone przez administratora. Skontaktuj się z Komisarzem Ligi.'
      );
    }

    await logEvent({
      action: 'LOGIN_SUCCESS',
      level: 'info',
      userEmail: cleanEmail,
      userName: userProfile.name,
      details: `Dżentelmen ${userProfile.name} (${cleanEmail}) zalogował się pomyślnie przez Firebase Auth.`,
    });

    return userProfile;
  } catch (err: unknown) {
    const firebaseCode = (err as { code?: string })?.code;
    if (firebaseCode) {
      const msg = getFirebaseAuthErrorMessage(firebaseCode);
      await logEvent({
        action: 'LOGIN_FAILED',
        level: 'warn',
        userEmail: cleanEmail,
        details: `Nieudana próba logowania przez Firebase Auth (${firebaseCode}): ${msg}`,
      });
      throw new Error(msg);
    }
    throw err;
  }
}

/**
 * Registers a new user with Firebase Authentication and sets initial status: 'pending'.
 */
export async function registerUser(input: RegistrationInput): Promise<User> {
  const cleanEmail = input.email.trim().toLowerCase();
  const cleanName = input.name.trim();
  validatePassword(input.password);

  await logEvent({
    action: 'REGISTRATION_ATTEMPT',
    level: 'info',
    userEmail: cleanEmail,
    userName: cleanName,
    details: `Złożono formularz rejestracyjny dla gracza ${cleanName} (${cleanEmail}).`,
  });

  try {
    const cred = await createUserWithEmailAndPassword(auth, cleanEmail, input.password.trim());
    const uid = cred.user.uid;

    const newUser: User = {
      id: uid,
      email: cleanEmail,
      name: cleanName,
      phone: input.phone.trim(),
      nickname: input.nickname?.trim() || undefined,
      playStyle: input.playStyle?.trim() || undefined,
      preferredCourts: input.preferredCourts?.trim() || undefined,
      preferredTimes: input.preferredTimes?.trim() || undefined,
      role: 'player',
      status: 'pending',
      createdAt: Date.now(),
    };

    // Save profile to Firestore
    await setDoc(doc(db, 'users', uid), newUser);

    // Sign out newly registered user so they cannot enter until approved by admin
    await signOut(auth);

    await logEvent({
      action: 'REGISTRATION_SUCCESS',
      level: 'success',
      userEmail: cleanEmail,
      userName: cleanName,
      details: `Konto dżentelmena ${cleanName} (${cleanEmail}) utworzone w Firebase Auth. Oczekuje na zatwierdzenie przez Komisarza.`,
      metadata: { userId: uid },
    });

    return newUser;
  } catch (err: unknown) {
    const firebaseCode = (err as { code?: string })?.code;
    const msg = firebaseCode ? getFirebaseAuthErrorMessage(firebaseCode) : (err instanceof Error ? err.message : String(err));
    await logEvent({
      action: 'REGISTRATION_FAILED',
      level: 'error',
      userEmail: cleanEmail,
      userName: cleanName,
      details: `Błąd rejestracji Firebase: ${msg}`,
    });
    throw new Error(msg);
  }
}

/**
 * Sends a password reset email via Firebase Authentication.
 */
export async function resetPasswordWithFirebase(email: string): Promise<void> {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail) {
    throw new Error('Podaj adres e-mail do wysłania linku resetującego.');
  }
  try {
    await sendPasswordResetEmail(auth, cleanEmail);
    await logEvent({
      action: 'USER_PROFILE_UPDATED',
      level: 'info',
      userEmail: cleanEmail,
      details: `Wysłano e-mail z linkiem do resetowania hasła na adres ${cleanEmail}.`,
    });
  } catch (err: unknown) {
    const firebaseCode = (err as { code?: string })?.code;
    const msg = firebaseCode ? getFirebaseAuthErrorMessage(firebaseCode) : (err instanceof Error ? err.message : String(err));
    throw new Error(msg);
  }
}

/**
 * Signs out current user from Firebase Auth.
 */
export async function logoutUser(): Promise<void> {
  await signOut(auth);
}

/**
 * Admin action: Creates a user account directly in Firebase Auth using a secondary instance
 * so that the currently logged-in administrator is NOT logged out.
 */
export async function adminCreateUserAndPlayer(
  adminUser: User,
  input: {
    name: string;
    email: string;
    phone: string;
    password: string;
    nickname?: string;
    playStyle?: string;
    preferredCourts?: string;
    preferredTimes?: string;
    preferredSurfaces?: string[];
    avatarColor?: string;
    role?: 'player' | 'admin';
    status?: 'approved' | 'pending';
    notes?: string;
  },
  onPlayerCreated: (player: Player) => void
): Promise<{ user: User; player: Player }> {
  if (adminUser.role !== 'admin') {
    throw new Error('Tylko Administrator (Komisarz Ligi) ma uprawnienia do tworzenia kont graczy.');
  }

  const cleanName = input.name.trim();
  const cleanEmail = input.email.trim().toLowerCase();
  const cleanPhone = input.phone.trim();
  validatePassword(input.password);

  // Initialize secondary app instance for isolated user creation
  const secondaryAppName = 'SecondaryAdminAuth';
  const secondaryApp =
    getApps().find((a) => a.name === secondaryAppName) ||
    initializeApp(firebaseConfig, secondaryAppName);
  const secondaryAuth = getAuth(secondaryApp);

  let newUid = '';
  try {
    const cred = await createUserWithEmailAndPassword(secondaryAuth, cleanEmail, input.password.trim());
    newUid = cred.user.uid;
    await signOut(secondaryAuth);
  } catch (err: unknown) {
    const firebaseCode = (err as { code?: string })?.code;
    throw new Error(firebaseCode ? getFirebaseAuthErrorMessage(firebaseCode) : String(err));
  }

  const newPlayerId = `p_${Date.now()}`;
  const colors = [
    'bg-emerald-700',
    'bg-blue-700',
    'bg-amber-600',
    'bg-rose-700',
    'bg-indigo-700',
    'bg-teal-700',
    'bg-stone-700',
  ];

  const newPlayer: Player = {
    id: newPlayerId,
    name: cleanName,
    nickname: input.nickname?.trim() || undefined,
    phone: cleanPhone,
    email: cleanEmail,
    avatarColor: input.avatarColor || colors[Math.floor(Math.random() * colors.length)],
    playStyle: input.playStyle?.trim() || undefined,
    preferredSurfaces: input.preferredSurfaces || ['Mączka'],
    preferredCourts: input.preferredCourts?.trim() || undefined,
    preferredTimes: input.preferredTimes?.trim() || undefined,
    status: 'active',
    notes: input.notes?.trim() || undefined,
  };

  const newUser: User = {
    id: newUid,
    email: cleanEmail,
    name: cleanName,
    phone: cleanPhone,
    nickname: input.nickname?.trim() || undefined,
    playStyle: input.playStyle?.trim() || undefined,
    preferredCourts: input.preferredCourts?.trim() || undefined,
    preferredTimes: input.preferredTimes?.trim() || undefined,
    role: input.role || 'player',
    status: input.status || 'approved',
    playerId: newPlayerId,
    createdAt: Date.now(),
  };

  // 1. Save player to Firestore
  await savePlayerToFirestore(newPlayer);

  // 2. Save user document in Firestore under their Auth UID
  await setDoc(doc(db, 'users', newUid), newUser);

  // 3. If role is admin, also record in admins collection
  if (newUser.role === 'admin') {
    await setDoc(doc(db, 'admins', newUid), { role: 'admin', email: cleanEmail, createdAt: Date.now() });
  }

  onPlayerCreated(newPlayer);

  await logEvent({
    action: 'USER_APPROVED',
    level: 'success',
    userName: cleanName,
    userEmail: cleanEmail,
    details: `Administrator ${adminUser.name} utworzył konto gracza ${cleanName} (${cleanEmail}) w Firebase Auth.`,
    metadata: { userId: newUid, playerId: newPlayerId },
  });

  return { user: newUser, player: newPlayer };
}

/**
 * Admin action: Approves a user and adds them as an active player in the league.
 */
export async function approveUser(
  userId: string,
  onPlayerCreated: (newPlayer: Player) => void
): Promise<{ user: User; player: Player }> {
  const userDocRef = doc(db, 'users', userId);
  const snap = await getDoc(userDocRef);

  if (!snap.exists()) {
    throw new Error('Nie znaleziono użytkownika w bazie ligi.');
  }

  const targetUser = snap.data() as User;
  const colors = [
    'bg-emerald-700',
    'bg-blue-700',
    'bg-amber-600',
    'bg-rose-700',
    'bg-indigo-700',
    'bg-teal-700',
  ];

  const newPlayerId = targetUser.playerId || `p_${Date.now()}`;
  const newPlayer: Player = {
    id: newPlayerId,
    name: targetUser.name,
    nickname: targetUser.nickname,
    phone: targetUser.phone || 'Brak numeru',
    email: targetUser.email,
    avatarColor: colors[Math.floor(Math.random() * colors.length)],
    playStyle: targetUser.playStyle?.trim() || undefined,
    preferredSurfaces: ['Mączka'],
    preferredCourts: targetUser.preferredCourts?.trim() || undefined,
    preferredTimes: targetUser.preferredTimes?.trim() || undefined,
    status: 'active',
  };

  const updatedUser: User = {
    ...targetUser,
    playerId: newPlayerId,
    status: 'approved',
  };

  await savePlayerToFirestore(newPlayer);
  await setDoc(userDocRef, updatedUser, { merge: true });

  onPlayerCreated(newPlayer);

  await logEvent({
    action: 'USER_APPROVED',
    level: 'success',
    userName: targetUser.name,
    userEmail: targetUser.email,
    details: `Komisarz Ligi zatwierdził konto ${targetUser.name} (${targetUser.email}).`,
    metadata: { userId, playerId: newPlayerId },
  });

  return { user: updatedUser, player: newPlayer };
}

/**
 * Admin action: Rejects a user registration request.
 */
export async function rejectUser(userId: string): Promise<User> {
  const userDocRef = doc(db, 'users', userId);
  const snap = await getDoc(userDocRef);
  if (!snap.exists()) {
    throw new Error('Nie znaleziono użytkownika.');
  }
  const updatedUser: User = {
    ...(snap.data() as User),
    status: 'rejected',
  };
  await setDoc(userDocRef, updatedUser, { merge: true });

  await logEvent({
    action: 'USER_REJECTED',
    level: 'warn',
    userName: updatedUser.name,
    userEmail: updatedUser.email,
    details: `Komisarz Ligi odrzucił zgłoszenie gracza ${updatedUser.name} (${updatedUser.email}).`,
    metadata: { userId },
  });

  return updatedUser;
}

/**
 * Admin action: Blocks a user account.
 */
export async function blockUser(userId: string): Promise<User> {
  const userDocRef = doc(db, 'users', userId);
  const snap = await getDoc(userDocRef);
  if (!snap.exists()) {
    throw new Error('Nie znaleziono użytkownika.');
  }
  const updatedUser: User = {
    ...(snap.data() as User),
    status: 'blocked',
  };
  await setDoc(userDocRef, updatedUser, { merge: true });

  await logEvent({
    action: 'USER_BLOCKED',
    level: 'warn',
    userName: updatedUser.name,
    userEmail: updatedUser.email,
    details: `Komisarz Ligi zablokował konto ${updatedUser.name} (${updatedUser.email}).`,
    metadata: { userId },
  });

  return updatedUser;
}

/**
 * Admin action: Unblocks a user account.
 */
export async function unblockUser(userId: string): Promise<User> {
  const userDocRef = doc(db, 'users', userId);
  const snap = await getDoc(userDocRef);
  if (!snap.exists()) {
    throw new Error('Nie znaleziono użytkownika.');
  }
  const updatedUser: User = {
    ...(snap.data() as User),
    status: 'approved',
  };
  await setDoc(userDocRef, updatedUser, { merge: true });
  return updatedUser;
}

/**
 * Admin action: Changes role of a user (e.g. from 'player' to 'admin').
 */
export async function changeUserRole(userId: string, newRole: 'admin' | 'player'): Promise<User> {
  const userDocRef = doc(db, 'users', userId);
  const snap = await getDoc(userDocRef);
  if (!snap.exists()) {
    throw new Error('Nie znaleziono użytkownika.');
  }
  const updatedUser: User = {
    ...(snap.data() as User),
    role: newRole,
  };
  await setDoc(userDocRef, updatedUser, { merge: true });

  // Update admins collection
  const adminDocRef = doc(db, 'admins', userId);
  if (newRole === 'admin') {
    await setDoc(adminDocRef, { role: 'admin', email: updatedUser.email, updatedAt: Date.now() });
  } else {
    await deleteDoc(adminDocRef).catch(() => {});
  }

  return updatedUser;
}

/**
 * Admin action: Delete user account from registration list in Firestore.
 */
export async function deleteStoredUser(userId: string): Promise<void> {
  await deleteDoc(doc(db, 'users', userId));
  await deleteDoc(doc(db, 'admins', userId)).catch(() => {});
}

/**
 * Updates a user account's profile information.
 */
export async function updateUserProfile(
  userId: string,
  updates: {
    name?: string;
    nickname?: string;
    phone?: string;
    email?: string;
    playStyle?: string;
    preferredCourts?: string;
    preferredTimes?: string;
    newPassword?: string;
  }
): Promise<User> {
  const userDocRef = doc(db, 'users', userId);
  const snap = await getDoc(userDocRef);
  if (!snap.exists()) {
    throw new Error('Nie znaleziono konta użytkownika.');
  }

  const prevUser = snap.data() as User;
  const updatedUser: User = {
    ...prevUser,
    name: updates.name !== undefined ? updates.name.trim() : prevUser.name,
    nickname: updates.nickname !== undefined ? (updates.nickname.trim() || undefined) : prevUser.nickname,
    phone: updates.phone !== undefined ? updates.phone.trim() : prevUser.phone,
    email: updates.email !== undefined ? updates.email.trim() : prevUser.email,
    playStyle: updates.playStyle !== undefined ? updates.playStyle.trim() : prevUser.playStyle,
    preferredCourts: updates.preferredCourts !== undefined ? updates.preferredCourts.trim() : prevUser.preferredCourts,
    preferredTimes: updates.preferredTimes !== undefined ? updates.preferredTimes.trim() : prevUser.preferredTimes,
  };

  // If password update requested and currently signed-in user matches
  if (updates.newPassword && updates.newPassword.trim()) {
    validatePassword(updates.newPassword);
    if (auth.currentUser && auth.currentUser.uid === userId) {
      await updatePassword(auth.currentUser, updates.newPassword.trim());
    } else {
      // Send reset email if updating for another user or reauth required
      await sendPasswordResetEmail(auth, prevUser.email);
    }
  }

  await setDoc(userDocRef, updatedUser, { merge: true });
  return updatedUser;
}

// Deprecated fallback methods for backwards compatibility
export function getStoredUsers(): User[] {
  return [];
}
export function saveStoredUsers(_users: User[]): void {}
export function getCurrentSession(): User | null {
  return null;
}
export function saveCurrentSession(_user: User): void {}
export function clearCurrentSession(): void {
  signOut(auth).catch(() => {});
}
export function updateUsersCache(_users: User[]): void {}
