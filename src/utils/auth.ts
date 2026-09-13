import { StoredUser, User, Player } from '../types';
import { INITIAL_PLAYERS } from '../data/initialData';
import {
  saveUserToFirestore,
  deleteUserFromFirestore,
  savePlayerToFirestore,
} from '../lib/firebase';
import { logEvent } from './logger';

const USERS_STORAGE_KEY = 'tennis_league_users_v1';
const SESSION_STORAGE_KEY = 'tennis_league_session_v1';

export const COMMISSIONER_EMAIL = 'przemyslaw.chlus@gmail.com';

// Pre-seeded commissioner account - other players register or are added for the new season
export const INITIAL_USERS: StoredUser[] = [
  {
    id: 'u_admin',
    email: COMMISSIONER_EMAIL,
    name: 'Przemysław Chłuś',
    role: 'admin',
    playerId: 'p1',
    status: 'approved',
    phone: '+48 600 000 000',
    nickname: 'Komisarz',
    passwordHash: 'gentleman2026',
    createdAt: 1711900000000,
  },
];

let inMemoryUsers: StoredUser[] | null = null;

export function updateUsersCache(users: StoredUser[]): void {
  inMemoryUsers = users;
  try {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  } catch {
    // ignore
  }
}

export function getStoredUsers(): StoredUser[] {
  if (inMemoryUsers && inMemoryUsers.length > 0) {
    return inMemoryUsers;
  }
  try {
    const raw = localStorage.getItem(USERS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(INITIAL_USERS));
      inMemoryUsers = INITIAL_USERS;
      return INITIAL_USERS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      // If cached data contains obsolete mock accounts from previous demo data, purge them
      const hasObsoleteDemoUsers = parsed.some(
        (u: StoredUser) =>
          u.email === 'komisarz@gentlemani.pl' ||
          (u.email && u.email.endsWith('@gentlemani.pl'))
      );

      if (hasObsoleteDemoUsers) {
        // Keep non-demo accounts or reset to commissioner
        const nonDemo = parsed.filter(
          (u: StoredUser) =>
            u.email !== 'komisarz@gentlemani.pl' &&
            !u.email.endsWith('@gentlemani.pl')
        );
        const hasCommissioner = nonDemo.some(
          (u: StoredUser) => u.email.toLowerCase() === COMMISSIONER_EMAIL
        );
        const finalUsers = hasCommissioner
          ? nonDemo
          : [INITIAL_USERS[0], ...nonDemo];

        inMemoryUsers = finalUsers;
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(finalUsers));
        return finalUsers;
      }

      // Ensure commissioner is present
      const hasCommissioner = parsed.some(
        (u: StoredUser) => u.email.toLowerCase() === COMMISSIONER_EMAIL
      );
      const sanitized = (hasCommissioner ? parsed : [INITIAL_USERS[0], ...parsed]).map((u) => ({
        ...u,
        status: u.status || 'approved',
      }));
      inMemoryUsers = sanitized;
      return sanitized;
    }
    inMemoryUsers = INITIAL_USERS;
    return INITIAL_USERS;
  } catch (err) {
    console.error('Error reading stored users', err);
    inMemoryUsers = INITIAL_USERS;
    return INITIAL_USERS;
  }
}

export function saveStoredUsers(users: StoredUser[]): void {
  inMemoryUsers = users;
  try {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  } catch (err) {
    console.error('Error saving stored users', err);
  }
}

export function getCurrentSession(): User | null {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveCurrentSession(user: User): void {
  try {
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(user));
  } catch (err) {
    console.error('Error saving current session', err);
  }
}

export function clearCurrentSession(): void {
  try {
    localStorage.removeItem(SESSION_STORAGE_KEY);
  } catch (err) {
    console.error('Error clearing session', err);
  }
}

export function authenticate(emailInput: string, passwordAttempt: string): User {
  const users = getStoredUsers();
  const cleanEmail = emailInput.trim().toLowerCase();

  const user = users.find(
    (u) => u.email.toLowerCase() === cleanEmail
  );

  if (!user) {
    logEvent({
      action: 'LOGIN_FAILED',
      level: 'warn',
      userEmail: cleanEmail,
      details: `Nieudana próba logowania: brak konta dla adresu e-mail "${cleanEmail}".`,
    }).catch(() => {});
    throw new Error('Nie znaleziono konta dżentelmena o takim adresie e-mail.');
  }

  if (user.passwordHash !== passwordAttempt.trim()) {
    logEvent({
      action: 'LOGIN_FAILED',
      level: 'warn',
      userEmail: user.email,
      userName: user.name,
      details: `Nieudana próba logowania: podano błędne hasło dostępowe dla konta ${user.name} (${user.email}).`,
    }).catch(() => {});
    throw new Error('Nieprawidłowe hasło dostępowe.');
  }

  // Verification of account status
  if (user.status === 'pending') {
    logEvent({
      action: 'LOGIN_FAILED',
      level: 'info',
      userEmail: user.email,
      userName: user.name,
      details: `Próba logowania na konto oczekujące: ${user.name} (${user.email}) oczekuje na weryfikację przez Komisarza.`,
    }).catch(() => {});
    throw new Error(
      'Twoje konto oczekuje na zatwierdzenie przez Komisarza Ligi. Po weryfikacji otrzymasz dostęp do rozgrywek.'
    );
  }

  if (user.status === 'blocked') {
    logEvent({
      action: 'LOGIN_FAILED',
      level: 'warn',
      userEmail: user.email,
      userName: user.name,
      details: `Próba logowania na zablokowane konto: ${user.name} (${user.email}).`,
    }).catch(() => {});
    throw new Error(
      'To konto zostało zablokowane przez Administratora Ligi. Logowanie jest niemożliwe. Skontaktuj się z Komisarzem Ligi.'
    );
  }

  if (user.status === 'rejected') {
    logEvent({
      action: 'LOGIN_FAILED',
      level: 'warn',
      userEmail: user.email,
      userName: user.name,
      details: `Próba logowania na odrzucone konto: ${user.name} (${user.email}).`,
    }).catch(() => {});
    throw new Error(
      'Twoje zgłoszenie do ligi zostało odrzucone przez administratora. Skontaktuj się z komisarzem ligi.'
    );
  }

  const { passwordHash: _, ...safeUser } = user;
  saveCurrentSession(safeUser);

  logEvent({
    action: 'LOGIN_SUCCESS',
    level: 'info',
    userEmail: user.email,
    userName: user.name,
    details: `Dżentelmen ${user.name} (${user.email}) zalogował się pomyślnie.`,
  }).catch(() => {});

  return safeUser;
}

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

/**
 * Registers a new user with status: 'pending'.
 * Note: Does NOT add to players league table or create active session yet.
 * Requires Admin approval in 'Zasady i opcje'.
 */
export async function registerUser(input: RegistrationInput): Promise<StoredUser> {
  const users = getStoredUsers();
  const cleanEmail = input.email.trim().toLowerCase();
  const cleanName = input.name.trim();

  // 1. First record registration attempt in system log
  await logEvent({
    action: 'REGISTRATION_ATTEMPT',
    level: 'info',
    userEmail: cleanEmail,
    userName: cleanName,
    details: `Złożono formularz rejestracyjny dla gracza ${cleanName} (${cleanEmail}, tel: ${input.phone.trim()}).`,
    metadata: {
      phone: input.phone.trim(),
      playStyle: input.playStyle?.trim(),
      preferredTimes: input.preferredTimes?.trim(),
      preferredCourts: input.preferredCourts?.trim(),
      nickname: input.nickname?.trim(),
    },
  });

  if (users.some((u) => u.email.toLowerCase() === cleanEmail)) {
    await logEvent({
      action: 'REGISTRATION_FAILED',
      level: 'warn',
      userEmail: cleanEmail,
      userName: cleanName,
      details: `Rejestracja odrzucona: konto z adresem e-mail ${cleanEmail} już istnieje.`,
    });
    throw new Error('Konto z tym adresem e-mail już istnieje w rejestrze ligi.');
  }

  if (input.password.trim().length < 6) {
    await logEvent({
      action: 'REGISTRATION_FAILED',
      level: 'warn',
      userEmail: cleanEmail,
      userName: cleanName,
      details: `Rejestracja odrzucona: hasło dla ${cleanEmail} jest krótsze niż 6 znaków.`,
    });
    throw new Error('Hasło musi zawierać co najmniej 6 znaków.');
  }

  const newUser: StoredUser = {
    id: `u_${Date.now()}`,
    email: cleanEmail,
    name: cleanName,
    phone: input.phone.trim(),
    nickname: input.nickname?.trim() || undefined,
    playStyle: input.playStyle?.trim() || undefined,
    preferredCourts: input.preferredCourts?.trim() || undefined,
    preferredTimes: input.preferredTimes?.trim() || undefined,
    role: 'player',
    status: 'pending', // Requires admin approval
    passwordHash: input.password.trim(),
    createdAt: Date.now(),
  };

  // 2. Persist to Firestore first - ensure any failure is captured and clearly reported
  try {
    await saveUserToFirestore(newUser);
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    await logEvent({
      action: 'REGISTRATION_FAILED',
      level: 'error',
      userEmail: cleanEmail,
      userName: cleanName,
      details: `Błąd zapisu nowego konta w chmurze Firestore: ${errMsg}`,
      metadata: { error: errMsg },
    });
    throw new Error(`Wystąpił błąd zapisu w chmurze ligi: ${errMsg}. Skontaktuj się z Komisarzem Ligi.`);
  }

  // 3. Cache locally
  const updatedUsers = [...users, newUser];
  saveStoredUsers(updatedUsers);

  // 4. Log successful creation of pending account
  await logEvent({
    action: 'REGISTRATION_SUCCESS',
    level: 'success',
    userEmail: cleanEmail,
    userName: cleanName,
    details: `Konto dżentelmena ${cleanName} (${cleanEmail}) zarejestrowane pomyślnie. Oczekuje na zatwierdzenie przez Komisarza.`,
    metadata: { userId: newUser.id },
  });

  return newUser;
}

/**
 * Admin action: Approves a user and adds them as an active player in the league.
 */
export async function approveUser(
  userId: string,
  onPlayerCreated: (newPlayer: Player) => void
): Promise<{ user: StoredUser; player: Player }> {
  const users = [...getStoredUsers()];
  const targetIndex = users.findIndex((u) => u.id === userId);

  if (targetIndex === -1) {
    throw new Error('Nie znaleziono użytkownika o podanym identyfikatorze.');
  }

  const targetUser = users[targetIndex];

  // Generate Player profile for the league
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

  const updatedUser: StoredUser = {
    ...targetUser,
    playerId: newPlayerId,
    status: 'approved',
  };

  users[targetIndex] = updatedUser;
  saveStoredUsers(users);

  // 1. Direct persistence of player card to Firestore
  try {
    await savePlayerToFirestore(newPlayer);
  } catch (err) {
    console.warn('Could not sync approved player to Firestore:', err);
  }

  // 2. Direct persistence of approved user status to Firestore
  try {
    await saveUserToFirestore(updatedUser);
  } catch (err) {
    console.warn('Could not sync approved user to Firestore:', err);
  }

  // 3. Inform parent components/state
  onPlayerCreated(newPlayer);

  await logEvent({
    action: 'USER_APPROVED',
    level: 'success',
    userName: targetUser.name,
    userEmail: targetUser.email,
    details: `Komisarz Ligi zatwierdził konto dżentelmena ${targetUser.name} (${targetUser.email}) i przypisał kartę zawodnika.`,
    metadata: { userId: targetUser.id, playerId: newPlayerId },
  });

  return { user: updatedUser, player: newPlayer };
}

/**
 * Admin action: Rejects a user registration request.
 */
export async function rejectUser(userId: string): Promise<StoredUser> {
  const users = [...getStoredUsers()];
  const targetIndex = users.findIndex((u) => u.id === userId);

  if (targetIndex === -1) {
    throw new Error('Nie znaleziono użytkownika.');
  }

  const updatedUser: StoredUser = {
    ...users[targetIndex],
    status: 'rejected',
  };

  users[targetIndex] = updatedUser;
  saveStoredUsers(users);
  
  try {
    await saveUserToFirestore(updatedUser);
  } catch (err) {
    console.warn('Could not sync rejected user to Firestore:', err);
  }

  await logEvent({
    action: 'USER_REJECTED',
    level: 'warn',
    userName: updatedUser.name,
    userEmail: updatedUser.email,
    details: `Komisarz Ligi odrzucił wniosek rejestracyjny dżentelmena ${updatedUser.name} (${updatedUser.email}).`,
    metadata: { userId: updatedUser.id },
  });

  return updatedUser;
}

/**
 * Admin action: Blocks a user account (prevents login)
 */
export function blockUser(userId: string): StoredUser {
  const users = getStoredUsers();
  const targetIndex = users.findIndex((u) => u.id === userId);

  if (targetIndex === -1) {
    throw new Error('Nie znaleziono użytkownika.');
  }

  const updatedUser: StoredUser = {
    ...users[targetIndex],
    status: 'blocked',
  };

  users[targetIndex] = updatedUser;
  saveStoredUsers(users);
  saveUserToFirestore(updatedUser).catch((err) => {
    console.warn('Could not sync blocked user to Firestore:', err);
  });

  logEvent({
    action: 'USER_BLOCKED',
    level: 'warn',
    userName: updatedUser.name,
    userEmail: updatedUser.email,
    details: `Komisarz Ligi zablokował konto ${updatedUser.name} (${updatedUser.email}).`,
    metadata: { userId: updatedUser.id },
  }).catch(() => {});

  // If the blocked user happens to be in current active session, clear session
  const current = getCurrentSession();
  if (current?.id === userId) {
    clearCurrentSession();
  }

  return updatedUser;
}

/**
 * Admin action: Unblocks a user account (restores approved status)
 */
export function unblockUser(userId: string): StoredUser {
  const users = getStoredUsers();
  const targetIndex = users.findIndex((u) => u.id === userId);

  if (targetIndex === -1) {
    throw new Error('Nie znaleziono użytkownika.');
  }

  const updatedUser: StoredUser = {
    ...users[targetIndex],
    status: 'approved',
  };

  users[targetIndex] = updatedUser;
  saveStoredUsers(users);
  saveUserToFirestore(updatedUser).catch((err) => {
    console.warn('Could not sync unblocked user to Firestore:', err);
  });
  return updatedUser;
}

/**
 * Admin action: Changes password for a designated user
 */
export function changeUserPassword(userId: string, newPasswordRaw: string): StoredUser {
  const newPassword = newPasswordRaw.trim();
  if (newPassword.length < 6) {
    throw new Error('Nowe hasło musi zawierać co najmniej 6 znaków.');
  }

  const users = getStoredUsers();
  const targetIndex = users.findIndex((u) => u.id === userId);

  if (targetIndex === -1) {
    throw new Error('Nie znaleziono użytkownika.');
  }

  const updatedUser: StoredUser = {
    ...users[targetIndex],
    passwordHash: newPassword,
  };

  users[targetIndex] = updatedUser;
  saveStoredUsers(users);
  saveUserToFirestore(updatedUser).catch((err) => {
    console.warn('Could not sync changed password to Firestore:', err);
  });
  return updatedUser;
}

/**
 * Admin action: Changes role of a user (e.g. from 'player' to 'admin' or vice-versa)
 */
export function changeUserRole(userId: string, newRole: 'admin' | 'player'): StoredUser {
  const users = getStoredUsers();
  const targetIndex = users.findIndex((u) => u.id === userId);

  if (targetIndex === -1) {
    throw new Error('Nie znaleziono użytkownika.');
  }

  const updatedUser: StoredUser = {
    ...users[targetIndex],
    role: newRole,
  };

  users[targetIndex] = updatedUser;
  saveStoredUsers(users);
  saveUserToFirestore(updatedUser).catch((err) => {
    console.warn('Could not sync changed role to Firestore:', err);
  });

  // If this is the currently active logged-in user, update their session role immediately
  const current = getCurrentSession();
  if (current?.id === userId) {
    const { passwordHash: _, ...safeUser } = updatedUser;
    saveCurrentSession(safeUser);
  }

  return updatedUser;
}

/**
 * Admin action: Delete user account from registration list
 */
export function deleteStoredUser(userId: string): void {
  const users = getStoredUsers();
  const filtered = users.filter((u) => u.id !== userId);
  saveStoredUsers(filtered);
  deleteUserFromFirestore(userId).catch((err) => {
    console.warn('Could not delete user from Firestore:', err);
  });

  // If deleted user was active, clear session
  const current = getCurrentSession();
  if (current?.id === userId) {
    clearCurrentSession();
  }
}

/**
 * Updates a user account's profile information and synchronizes to session/Firestore
 */
export function updateUserProfile(
  userId: string,
  updates: {
    name?: string;
    nickname?: string;
    phone?: string;
    playStyle?: string;
    preferredCourts?: string;
    preferredTimes?: string;
    newPassword?: string;
  }
): StoredUser {
  const users = getStoredUsers();
  const targetIndex = users.findIndex((u) => u.id === userId);

  if (targetIndex === -1) {
    throw new Error('Nie znaleziono konta użytkownika.');
  }

  if (updates.newPassword !== undefined && updates.newPassword.trim() !== '') {
    if (updates.newPassword.trim().length < 6) {
      throw new Error('Nowe hasło musi zawierać co najmniej 6 znaków.');
    }
  }

  const prevUser = users[targetIndex];
  const updatedUser: StoredUser = {
    ...prevUser,
    name: updates.name !== undefined ? updates.name.trim() : prevUser.name,
    nickname: updates.nickname !== undefined ? (updates.nickname.trim() || undefined) : prevUser.nickname,
    phone: updates.phone !== undefined ? updates.phone.trim() : prevUser.phone,
    playStyle: updates.playStyle !== undefined ? updates.playStyle.trim() : prevUser.playStyle,
    preferredCourts: updates.preferredCourts !== undefined ? updates.preferredCourts.trim() : prevUser.preferredCourts,
    preferredTimes: updates.preferredTimes !== undefined ? updates.preferredTimes.trim() : prevUser.preferredTimes,
    passwordHash: updates.newPassword?.trim() ? updates.newPassword.trim() : prevUser.passwordHash,
  };

  users[targetIndex] = updatedUser;
  saveStoredUsers(users);
  saveUserToFirestore(updatedUser).catch((err) => {
    console.warn('Could not sync updated profile to Firestore:', err);
  });

  const current = getCurrentSession();
  if (current?.id === userId) {
    const { passwordHash: _, ...safeUser } = updatedUser;
    saveCurrentSession(safeUser);
  }

  return updatedUser;
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
 * Admin directly creates a new user account and associated player profile.
 * Restricted strictly to users with role === 'admin'.
 */
export async function adminCreateUserAndPlayer(
  adminUser: User,
  input: AdminCreateUserInput,
  onPlayerCreated: (player: Player) => void
): Promise<{ user: StoredUser; player: Player }> {
  if (adminUser.role !== 'admin') {
    throw new Error('Tylko Administrator (Komisarz Ligi) ma uprawnienia do bezpośredniego tworzenia kont graczy.');
  }

  const cleanName = input.name.trim();
  const cleanEmail = input.email.trim().toLowerCase();
  const cleanPhone = input.phone.trim();
  const cleanPassword = input.password.trim();

  if (!cleanName) {
    throw new Error('Imię i nazwisko gracza jest wymagane.');
  }
  if (!cleanEmail) {
    throw new Error('Adres e-mail jest wymagany.');
  }
  if (!cleanPhone || cleanPhone === '+48') {
    throw new Error('Numer telefonu jest wymagany.');
  }
  if (cleanPassword.length < 6) {
    throw new Error('Hasło musi zawierać co najmniej 6 znaków.');
  }

  const users = getStoredUsers();
  if (users.some((u) => u.email.toLowerCase() === cleanEmail)) {
    throw new Error(`Użytkownik z adresem e-mail "${cleanEmail}" już istnieje w rejestrze ligi.`);
  }

  const timestamp = Date.now();
  const newPlayerId = `p_${timestamp}`;
  const newUserId = `u_${timestamp}`;

  const colors = [
    'bg-emerald-700',
    'bg-blue-700',
    'bg-amber-600',
    'bg-rose-700',
    'bg-indigo-700',
    'bg-teal-700',
    'bg-stone-700',
    'bg-orange-700',
    'bg-lime-800',
  ];

  const newPlayer: Player = {
    id: newPlayerId,
    name: cleanName,
    nickname: input.nickname?.trim() || undefined,
    phone: cleanPhone,
    email: cleanEmail,
    avatarColor: input.avatarColor || colors[Math.floor(Math.random() * colors.length)],
    playStyle: input.playStyle?.trim() || undefined,
    preferredSurfaces: input.preferredSurfaces && input.preferredSurfaces.length > 0 ? input.preferredSurfaces : ['Mączka'],
    preferredCourts: input.preferredCourts?.trim() || undefined,
    preferredTimes: input.preferredTimes?.trim() || undefined,
    status: 'active',
    notes: input.notes?.trim() || undefined,
  };

  const newUser: StoredUser = {
    id: newUserId,
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
    passwordHash: cleanPassword,
    createdAt: timestamp,
  };

  // 1. Save player to Firestore first
  try {
    await savePlayerToFirestore(newPlayer);
  } catch (err) {
    console.warn('Could not sync admin-created player to Firestore:', err);
  }

  // 2. Save user to Firestore
  try {
    await saveUserToFirestore(newUser);
  } catch (err) {
    console.warn('Could not sync admin-created user to Firestore:', err);
  }

  // 3. Update local state & storage
  const updatedUsers = [...users, newUser];
  saveStoredUsers(updatedUsers);
  onPlayerCreated(newPlayer);

  // 4. Log audit event
  await logEvent({
    action: 'USER_APPROVED',
    level: 'success',
    userName: cleanName,
    userEmail: cleanEmail,
    details: `Administrator ${adminUser.name} utworzył konto dżentelmena ${cleanName} (${cleanEmail}) ze statusem "${newUser.status}" i przypisaną kartą zawodnika.`,
    metadata: {
      userId: newUserId,
      playerId: newPlayerId,
      role: newUser.role,
      status: newUser.status,
      createdById: adminUser.id,
      createdByName: adminUser.name,
    },
  });

  return { user: newUser, player: newPlayer };
}

