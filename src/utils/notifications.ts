import { Match, Player, TennisSet, LeagueNotification, NotificationSettings } from '../types';
import { getServiceWorkerRegistration } from '../serviceWorkerRegistration';
import { formatDatePl } from './tennisRules';

const SETTINGS_STORAGE_KEY = 'lgt_notification_settings_v1';
const SEEN_NOTIFS_STORAGE_KEY = 'lgt_seen_notification_ids_v1';
const PUSH_PROMPT_DISMISSED_KEY = 'lgt_push_prompt_dismissed_until_v1';

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  notifyScheduled: true,
  notifyResults: true,
  notifyOverdue: true,
  soundEnabled: true,
  selectedPlayerId: null,
};

/**
 * Checks if the user previously dismissed the push prompt modal and the snooze period is still active.
 */
export function hasUserDismissedPushPrompt(): boolean {
  try {
    if (typeof localStorage === 'undefined') return false;
    const raw = localStorage.getItem(PUSH_PROMPT_DISMISSED_KEY);
    if (!raw) return false;
    const until = parseInt(raw, 10);
    if (isNaN(until)) return false;
    return Date.now() < until;
  } catch {
    return false;
  }
}

/**
 * Snoozes the push notification prompt modal for a specified number of days (default 7 days).
 */
export function dismissPushPrompt(days: number = 7): void {
  try {
    if (typeof localStorage === 'undefined') return;
    const until = Date.now() + days * 24 * 60 * 60 * 1000;
    localStorage.setItem(PUSH_PROMPT_DISMISSED_KEY, until.toString());
  } catch (err) {
    console.warn('[Notifications] Could not save push prompt dismissal:', err);
  }
}

/**
 * Resets push prompt dismissal status so it can be presented again.
 */
export function resetPushPromptDismissal(): void {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.removeItem(PUSH_PROMPT_DISMISSED_KEY);
  } catch {}
}

/**
 * Checks if the current environment supports Web Notifications or ServiceWorker notifications.
 */
export function isPushSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return 'Notification' in window || ('serviceWorker' in navigator && 'showNotification' in ServiceWorkerRegistration.prototype);
}

/**
 * Detects if the device is running iOS (iPhone, iPad, iPod).
 */
export function isIOSDevice(): boolean {
  if (typeof window === 'undefined') return false;
  const ua = window.navigator.userAgent.toLowerCase();
  return /iphone|ipad|ipod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

/**
 * Detects if the app is currently running in Standalone (PWA) mode.
 */
export function isStandaloneApp(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

/**
 * Returns current browser notification permission state.
 */
export function getNotificationPermission(): 'granted' | 'denied' | 'default' | 'unsupported' {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    // On iOS Safari before 16.4 or inside regular browser tabs without notification API
    if (isIOSDevice() && !isStandaloneApp()) {
      return 'default';
    }
    return 'unsupported';
  }
  return Notification.permission;
}

/**
 * Requests browser notification permission.
 */
export async function requestNotificationPermission(): Promise<'granted' | 'denied' | 'default'> {
  if (typeof window === 'undefined') return 'denied';

  // Make sure service worker is initialized
  try {
    await getServiceWorkerRegistration();
  } catch (err) {
    console.warn('[Notifications] Error initializing SW for notifications:', err);
  }

  if (!('Notification' in window)) {
    // If on iOS and not standalone, guide user
    return 'default';
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      // Play brief chime to confirm activation
      playNotificationChime();
    }
    return permission;
  } catch (error) {
    console.warn('[Notifications] requestPermission error:', error);
    return 'default';
  }
}

// Cached HTMLAudioElement instance for instant zero-latency playback
let cachedTennisAudio: HTMLAudioElement | null = null;

/**
 * Plays the authentic recording of a tennis ball forehand strike (extracted from Epidemic Sound
 * "Sports, Court, Tennis, Indoor, Hardcourt, Forehand").
 * Uses HTMLAudioElement / Web Audio API with zero latency and fallback to synthetic pop.
 */
export function playNotificationChime() {
  try {
    if (!cachedTennisAudio) {
      cachedTennisAudio = new Audio('/tennis-hit.mp3');
      cachedTennisAudio.preload = 'auto';
    }

    // Reset playback position if already playing or ended
    cachedTennisAudio.currentTime = 0;
    cachedTennisAudio.volume = 0.95;

    const playPromise = cachedTennisAudio.play();
    if (playPromise !== undefined) {
      playPromise.catch((err) => {
        console.warn('[Notifications] Audio play failed or blocked by autoplay policy:', err);
        // Fallback to Web Audio API buffer if standard HTML5 audio is blocked
        playSynthesizedPopFallback();
      });
    }
  } catch (err) {
    console.warn('[Notifications] Error playing tennis hit sound:', err);
    playSynthesizedPopFallback();
  }
}

/**
 * Fallback synthesizer if external audio file is unavailable
 */
function playSynthesizedPopFallback() {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    const popOsc = ctx.createOscillator();
    const popGain = ctx.createGain();

    popOsc.type = 'triangle';
    popOsc.frequency.setValueAtTime(540, now);
    popOsc.frequency.exponentialRampToValueAtTime(120, now + 0.05);

    popGain.gain.setValueAtTime(0.001, now);
    popGain.gain.linearRampToValueAtTime(0.8, now + 0.003);
    popGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    popOsc.connect(popGain);
    popGain.connect(ctx.destination);

    popOsc.start(now);
    popOsc.stop(now + 0.16);
  } catch {
    // Ignore silenced context
  }
}

/**
 * Triggers a system/push notification on device (works on Android Chrome, iOS PWA, and desktop browsers).
 */
export async function triggerSystemNotification(
  title: string,
  options: {
    body: string;
    icon?: string;
    badge?: string;
    tag?: string;
    url?: string;
    data?: any;
  }
): Promise<boolean> {
  const perm = getNotificationPermission();
  if (perm !== 'granted') {
    return false;
  }

  // Haptic feedback for mobile devices
  try {
    if ('vibrate' in navigator) {
      navigator.vibrate([100, 60, 100]);
    }
  } catch {
    // Ignore vibrate errors
  }

  const appOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://lgt2026.pl';
  let targetUrl = options.url || '/';
  if (targetUrl.startsWith('#')) {
    targetUrl = `${appOrigin}/${targetUrl}`;
  } else if (targetUrl.startsWith('/')) {
    targetUrl = `${appOrigin}${targetUrl}`;
  } else if (!targetUrl.startsWith('http')) {
    targetUrl = `${appOrigin}/${targetUrl}`;
  }

  // Safety: never point to sw.js
  if (targetUrl.includes('sw.js')) {
    targetUrl = `${appOrigin}/`;
  }

  const notificationOptions = {
    body: options.body,
    icon: options.icon || '/icon.svg',
    badge: options.badge || '/icon.svg',
    tag: options.tag || `lgt-${Date.now()}`,
    data: {
      url: targetUrl,
      ...(typeof options.data === 'object' ? options.data : {}),
    },
  };

  // 1. Try displaying via Service Worker registration (Mandatory for Android Chrome & iOS PWA)
  try {
    const swReg = await getServiceWorkerRegistration();
    if (swReg && typeof swReg.showNotification === 'function') {
      await swReg.showNotification(title, notificationOptions);
      return true;
    }
  } catch (err) {
    console.warn('[Notifications] SW showNotification failed, trying fallback:', err);
  }

  // 2. Fallback to desktop window.Notification constructor
  if ('Notification' in window) {
    try {
      const n = new Notification(title, notificationOptions);
      n.onclick = () => {
        window.focus();
        if (targetUrl) {
          window.location.href = targetUrl;
        }
      };
      return true;
    } catch {
      // Illegal constructor on Android / iOS WebKit without SW
    }
  }

  return false;
}

/**
 * Loads user notification settings from localStorage.
 */
export function loadNotificationSettings(): NotificationSettings {
  try {
    const saved = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (saved) {
      return { ...DEFAULT_NOTIFICATION_SETTINGS, ...JSON.parse(saved) };
    }
  } catch {
    // Ignore read errors
  }
  return DEFAULT_NOTIFICATION_SETTINGS;
}

/**
 * Saves user notification settings to localStorage.
 */
export function saveNotificationSettings(settings: NotificationSettings): void {
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch (err) {
    console.warn('[Notifications] Failed to save settings to localStorage:', err);
  }
}

/**
 * Checks if a specific notification ID has already been notified/displayed locally.
 */
export function isNotificationAlreadyNotified(id: string): boolean {
  try {
    const raw = localStorage.getItem(SEEN_NOTIFS_STORAGE_KEY);
    if (!raw) return false;
    const seen: string[] = JSON.parse(raw);
    return seen.includes(id);
  } catch {
    return false;
  }
}

/**
 * Marks a notification ID as notified so it won't trigger popups again on this device.
 */
export function markNotificationAsNotified(id: string): void {
  try {
    const raw = localStorage.getItem(SEEN_NOTIFS_STORAGE_KEY);
    const seen: string[] = raw ? JSON.parse(raw) : [];
    if (!seen.includes(id)) {
      seen.push(id);
      // Keep list bounded to last 150 IDs
      const trimmed = seen.slice(-150);
      localStorage.setItem(SEEN_NOTIFS_STORAGE_KEY, JSON.stringify(trimmed));
    }
  } catch {
    // Ignore storage errors
  }
}

/**
 * Formats match tennis sets into a readable string like "6:4, 3:6, 10:8"
 */
export function formatSetsSummary(sets: TennisSet[]): string {
  if (!sets || sets.length === 0) return '';
  return sets
    .map((s) => {
      const g1 = s.games1;
      const g2 = s.games2;
      if (s.isSuperTiebreak) {
        return `[ST: ${g1}:${g2}]`;
      }
      if (s.tiebreak1 !== undefined && (g1 === 7 || g2 === 7)) {
        return `${g1}:${g2}(${s.tiebreak1})`;
      }
      return `${g1}:${g2}`;
    })
    .join(', ');
}

/**
 * Helper to build a LeagueNotification object for a newly scheduled match.
 */
export function buildMatchScheduledNotification(
  match: Match,
  players: Player[]
): LeagueNotification {
  const p1 = players.find((p) => p.id === match.player1Id);
  const p2 = players.find((p) => p.id === match.player2Id);
  const p1Name = p1?.name || 'Zawodnik 1';
  const p2Name = p2?.name || 'Zawodnik 2';

  const dateStr = formatDatePl(match.date);
  const timeStr = match.time ? ` godz. ${match.time}` : '';
  const courtStr = match.courtName ? ` • ${match.courtName}` : '';

  return {
    id: `notif_sched_${match.id}_${Date.now()}`,
    title: '📅 Zaplanowano mecz ligowy!',
    body: `${p1Name} vs ${p2Name} — ${dateStr}${timeStr}${courtStr}`,
    type: 'match_scheduled',
    recipientPlayerIds: [match.player1Id, match.player2Id],
    matchId: match.id,
    createdAt: Date.now(),
    url: '#matches',
    readBy: [],
  };
}

/**
 * Helper to build a LeagueNotification object for a completed match result.
 */
export function buildMatchCompletedNotification(
  match: Match,
  players: Player[]
): LeagueNotification {
  const p1 = players.find((p) => p.id === match.player1Id);
  const p2 = players.find((p) => p.id === match.player2Id);
  const winner = players.find((p) => p.id === match.winnerId);

  const p1Name = p1?.name || 'Zawodnik 1';
  const p2Name = p2?.name || 'Zawodnik 2';
  const winnerName = winner?.name || (match.winnerId === match.player1Id ? p1Name : p2Name);

  const setsSummary = formatSetsSummary(match.sets);
  const friendlyLabel = match.isFriendly ? ' (Towarzyski)' : '';

  return {
    id: `notif_res_${match.id}_${Date.now()}`,
    title: `🎾 Wynik meczu: ${winnerName} wygrywa!${friendlyLabel}`,
    body: `${p1Name} vs ${p2Name}: ${setsSummary}. Zwycięzca: ${winnerName} 🏆`,
    type: 'match_completed',
    recipientPlayerIds: [match.player1Id, match.player2Id],
    matchId: match.id,
    createdAt: Date.now(),
    url: '#matches',
    readBy: [],
  };
}

/**
 * Helper to build a LeagueNotification object sent 2 hours after scheduled match time
 * if result has not yet been registered.
 */
export function buildMatchOverdueReminderNotification(
  match: Match,
  players: Player[]
): LeagueNotification {
  const p1 = players.find((p) => p.id === match.player1Id);
  const p2 = players.find((p) => p.id === match.player2Id);
  const p1Name = p1?.name || 'Zawodnik 1';
  const p2Name = p2?.name || 'Zawodnik 2';

  const dateStr = formatDatePl(match.date);
  const timeStr = match.time ? ` godz. ${match.time}` : '';
  const courtStr = match.courtName ? ` • ${match.courtName}` : '';

  return {
    id: `notif_overdue_${match.id}`,
    title: '⏰ Minęły 2h od zaplanowanego meczu',
    body: `Czy mecz ${p1Name} vs ${p2Name} (${dateStr}${timeStr}${courtStr}) się odbył? Uzupełnij wynik lub uporządkuj terminarz.`,
    type: 'match_overdue_reminder',
    recipientPlayerIds: [match.player1Id, match.player2Id],
    matchId: match.id,
    createdAt: Date.now(),
    url: '#matches',
    readBy: [],
  };
}

