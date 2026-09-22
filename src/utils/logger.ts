import { SystemLog, LogAction, LogLevel } from '../types';
import { saveSystemLogToFirestore, fetchSystemLogsFromFirestore, subscribeToSystemLogs, clearSystemLogsInFirestore } from '../lib/firebase';

const LOCAL_STORAGE_LOGS_KEY = 'gentlemen_system_logs';
const MAX_LOCAL_LOGS = 100;

export function getLocalLogs(): SystemLog[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_LOGS_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.warn('Failed reading local logs:', e);
    return [];
  }
}

function appendLocalLog(log: SystemLog) {
  try {
    const current = getLocalLogs();
    const updated = [log, ...current].slice(0, MAX_LOCAL_LOGS);
    localStorage.setItem(LOCAL_STORAGE_LOGS_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn('Failed saving local log:', e);
  }
}

export async function logEvent(params: {
  action: LogAction;
  level?: LogLevel;
  details: string;
  userEmail?: string;
  userName?: string;
  metadata?: Record<string, any>;
}): Promise<SystemLog> {
  const log: SystemLog = {
    id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    action: params.action,
    level: params.level || 'info',
    timestamp: Date.now(),
    details: params.details,
    userEmail: params.userEmail,
    userName: params.userName,
    metadata: {
      ...params.metadata,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
      url: typeof window !== 'undefined' ? window.location.href : 'unknown',
    },
  };

  // 1. Save locally for instant offline audit
  appendLocalLog(log);

  // 2. Persist to Firestore
  try {
    await saveSystemLogToFirestore(log);
  } catch (err) {
    console.warn('Could not sync log to Firestore:', err);
  }

  return log;
}

export {
  fetchSystemLogsFromFirestore,
  subscribeToSystemLogs,
  clearSystemLogsInFirestore,
};
