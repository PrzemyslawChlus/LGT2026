import React, { useState, useEffect } from 'react';
import {
  Activity,
  AlertTriangle,
  AlertOctagon,
  CheckCircle2,
  Info,
  Search,
  RefreshCw,
  Trash2,
  Filter,
  Clock,
  User,
  Mail,
  ChevronDown,
  ChevronUp,
  Terminal,
  ShieldCheck,
  Smartphone,
  Laptop,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { SystemLog, LogAction, LogLevel } from '../types';
import { subscribeToSystemLogs, fetchSystemLogsFromFirestore, clearSystemLogsInFirestore, logEvent, getLocalLogs } from '../utils/logger';

interface AdminSystemLogsViewerProps {
  onRefresh?: () => void;
}

export const AdminSystemLogsViewer: React.FC<AdminSystemLogsViewerProps> = () => {
  const [logs, setLogs] = useState<SystemLog[]>(() => getLocalLogs());
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'registrations' | 'logins' | 'errors' | 'admin'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);

  // Subscribe to real-time Firestore system logs
  useEffect(() => {
    setLoading(true);
    const unsub = subscribeToSystemLogs((firestoreLogs) => {
      // Merge with local logs if any
      const local = getLocalLogs();
      const combined = [...firestoreLogs];
      local.forEach((loc) => {
        if (!combined.some((c) => c.id === loc.id)) {
          combined.push(loc);
        }
      });
      combined.sort((a, b) => b.timestamp - a.timestamp);
      setLogs(combined);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const handleManualRefresh = async () => {
    setLoading(true);
    try {
      const liveLogs = await fetchSystemLogsFromFirestore();
      const local = getLocalLogs();
      const combined = [...liveLogs];
      local.forEach((loc) => {
        if (!combined.some((c) => c.id === loc.id)) {
          combined.push(loc);
        }
      });
      combined.sort((a, b) => b.timestamp - a.timestamp);
      setLogs(combined);
    } catch (e) {
      console.warn('Error refreshing logs:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleClearAllLogs = async () => {
    try {
      await clearSystemLogsInFirestore();
      localStorage.removeItem('gentlemen_system_logs');
      setLogs([]);
      setConfirmClear(false);
    } catch (e) {
      alert('Błąd podczas czyszczenia logów z bazy Firestore.');
    }
  };

  const filteredLogs = logs.filter((log) => {
    // 1. Search Query
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      const matchEmail = log.userEmail?.toLowerCase().includes(q);
      const matchName = log.userName?.toLowerCase().includes(q);
      const matchDetails = log.details.toLowerCase().includes(q);
      const matchAction = log.action.toLowerCase().includes(q);
      if (!matchEmail && !matchName && !matchDetails && !matchAction) {
        return false;
      }
    }

    // 2. Type Filter
    if (filterType === 'registrations') {
      return log.action.startsWith('REGISTRATION_');
    }
    if (filterType === 'logins') {
      return log.action.startsWith('LOGIN_');
    }
    if (filterType === 'errors') {
      return log.level === 'error' || log.level === 'warn' || log.action.includes('FAILED');
    }
    if (filterType === 'admin') {
      return log.action.startsWith('USER_');
    }
    return true;
  });

  const getLevelBadge = (level: LogLevel) => {
    switch (level) {
      case 'error':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-200">
            <AlertOctagon className="w-3 h-3 text-rose-600" />
            Błąd
          </span>
        );
      case 'warn':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-200">
            <AlertTriangle className="w-3 h-3 text-amber-600" />
            Ostrzeżenie
          </span>
        );
      case 'success':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Sukces
          </span>
        );
      case 'info':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-sky-100 text-sky-800 border border-sky-200">
            <Info className="w-3 h-3 text-sky-600" />
            Info
          </span>
        );
    }
  };

  const getActionLabel = (action: LogAction) => {
    switch (action) {
      case 'REGISTRATION_ATTEMPT':
        return 'Próba rejestracji';
      case 'REGISTRATION_SUCCESS':
        return 'Rejestracja pomyślna';
      case 'REGISTRATION_FAILED':
        return 'Błąd rejestracji';
      case 'LOGIN_SUCCESS':
        return 'Logowanie pomyślne';
      case 'LOGIN_FAILED':
        return 'Błąd logowania';
      case 'USER_APPROVED':
        return 'Zatwierdzenie konta';
      case 'USER_REJECTED':
        return 'Odrzucenie konta';
      case 'USER_BLOCKED':
        return 'Blokada konta';
      case 'USER_PROFILE_UPDATED':
        return 'Aktualizacja profilu';
      case 'MATCH_SAVED':
        return 'Zapis wyniku meczu';
      case 'MATCH_DELETED':
        return 'Usunięcie meczu';
      case 'SYSTEM_ERROR':
        return 'Błąd systemowy';
      default:
        return action;
    }
  };

  const formatTimestamp = (ts: number) => {
    const date = new Date(ts);
    return date.toLocaleString('pl-PL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const failedRegistrationsCount = logs.filter(
    (l) => l.action === 'REGISTRATION_FAILED'
  ).length;

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-stone-200 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-stone-900 text-lime-400 flex items-center justify-center font-bold shadow-xs shrink-0">
            <Terminal className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-black text-stone-900 text-base">Dziennik Zdarzeń i Logów Systemowych</h3>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                Na żywo (Live)
              </span>
            </div>
            <p className="text-xs text-stone-500">
              Pełen audit trail: próby rejestracji nowych graczy, błędy formularzy, logowania i akcje Komisarza
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={handleManualRefresh}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold transition-all cursor-pointer border border-stone-200"
            title="Pobierz najnowsze zdarzenia"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald-700' : ''}`} />
            <span>Odśwież</span>
          </button>

          {confirmClear ? (
            <div className="flex items-center gap-1">
              <button
                onClick={handleClearAllLogs}
                className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Potwierdź czyszczenie
              </button>
              <button
                onClick={() => setConfirmClear(false)}
                className="px-2 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-600 rounded-xl text-xs font-medium cursor-pointer"
              >
                Anuluj
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmClear(true)}
              disabled={logs.length === 0}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-stone-100 hover:bg-rose-50 text-stone-500 hover:text-rose-700 rounded-xl text-xs font-medium transition-colors cursor-pointer border border-stone-200 disabled:opacity-40 disabled:cursor-not-allowed"
              title="Wyczyść historię logów"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Wyczyść</span>
            </button>
          )}
        </div>
      </div>

      {/* Overview Stats Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="p-3 bg-stone-50 border border-stone-200 rounded-2xl">
          <p className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">Wszystkie wpisy</p>
          <p className="text-xl font-black text-stone-900 mt-0.5">{logs.length}</p>
        </div>
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl">
          <p className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">Pomyślne rejestracje</p>
          <p className="text-xl font-black text-emerald-950 mt-0.5">
            {logs.filter((l) => l.action === 'REGISTRATION_SUCCESS').length}
          </p>
        </div>
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl">
          <p className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">Próby rejestracji</p>
          <p className="text-xl font-black text-amber-950 mt-0.5">
            {logs.filter((l) => l.action === 'REGISTRATION_ATTEMPT').length}
          </p>
        </div>
        <div className={`p-3 rounded-2xl border ${failedRegistrationsCount > 0 ? 'bg-rose-50 border-rose-200' : 'bg-stone-50 border-stone-200'}`}>
          <p className={`text-[11px] font-bold uppercase tracking-wider ${failedRegistrationsCount > 0 ? 'text-rose-800' : 'text-stone-500'}`}>
            Odrzucone / Błędy
          </p>
          <p className={`text-xl font-black mt-0.5 ${failedRegistrationsCount > 0 ? 'text-rose-700' : 'text-stone-700'}`}>
            {failedRegistrationsCount}
          </p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Filter categories */}
        <div className="flex items-center gap-1.5 p-1 bg-stone-100 rounded-2xl overflow-x-auto text-xs font-bold scrollbar-none">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
              filterType === 'all'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Wszystkie ({logs.length})
          </button>
          <button
            onClick={() => setFilterType('registrations')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
              filterType === 'registrations'
                ? 'bg-emerald-950 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Rejestracje ({logs.filter((l) => l.action.startsWith('REGISTRATION_')).length})
          </button>
          <button
            onClick={() => setFilterType('logins')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
              filterType === 'logins'
                ? 'bg-emerald-950 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Logowania ({logs.filter((l) => l.action.startsWith('LOGIN_')).length})
          </button>
          <button
            onClick={() => setFilterType('errors')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
              filterType === 'errors'
                ? 'bg-rose-700 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Błędy i ostrzeżenia ({logs.filter((l) => l.level === 'error' || l.level === 'warn' || l.action.includes('FAILED')).length})
          </button>
          <button
            onClick={() => setFilterType('admin')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
              filterType === 'admin'
                ? 'bg-emerald-950 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Akcje Komisarza ({logs.filter((l) => l.action.startsWith('USER_')).length})
          </button>
        </div>

        {/* Search Input */}
        <div className="relative sm:w-64">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Szukaj po nazwisku, emailu..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-stone-50 hover:bg-stone-100 focus:bg-white border border-stone-200 rounded-xl text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-700 transition-all"
          />
        </div>
      </div>

      {/* Logs Table / List */}
      <div className="border border-stone-200 rounded-2xl overflow-hidden bg-stone-50/50 divide-y divide-stone-200">
        {filteredLogs.length === 0 ? (
          <div className="p-8 text-center text-stone-500">
            <Activity className="w-8 h-8 mx-auto mb-2 text-stone-300" />
            <p className="text-xs font-medium">Brak zdarzeń pasujących do wybranych kryteriów filtrowania.</p>
          </div>
        ) : (
          filteredLogs.map((log) => {
            const isExpanded = expandedLogId === log.id;
            return (
              <div
                key={log.id}
                className="bg-white hover:bg-stone-50/80 transition-colors"
              >
                <div
                  onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                  className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer select-none"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="mt-0.5">{getLevelBadge(log.level)}</div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-black text-stone-900">
                          {getActionLabel(log.action)}
                        </span>
                        {log.userName && (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-stone-700 bg-stone-100 px-2 py-0.5 rounded-md">
                            <User className="w-3 h-3 text-stone-400" />
                            {log.userName}
                          </span>
                        )}
                        {log.userEmail && (
                          <span className="inline-flex items-center gap-1 text-[11px] text-stone-500 font-mono">
                            <Mail className="w-3 h-3 text-stone-400" />
                            {log.userEmail}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                        {log.details}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 sm:self-center shrink-0 text-[11px] text-stone-400 font-mono justify-between sm:justify-end">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-stone-400" />
                      <span>{formatTimestamp(log.timestamp)}</span>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-stone-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-stone-400" />
                    )}
                  </div>
                </div>

                {/* Expanded metadata details */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-1 bg-stone-50/80 border-t border-stone-100">
                    <div className="p-3 bg-stone-900 text-stone-200 rounded-xl font-mono text-[11px] space-y-1.5 overflow-x-auto shadow-inner">
                      <div className="flex items-center justify-between text-stone-400 border-b border-stone-800 pb-1">
                        <span>ID Zdarzenia: {log.id}</span>
                        <span>Akcja: {log.action}</span>
                      </div>
                      <div className="text-stone-300">
                        <strong>Opis:</strong> {log.details}
                      </div>
                      {log.metadata && Object.keys(log.metadata).length > 0 && (
                        <div className="pt-1">
                          <span className="text-stone-400">Metadane / Kontekst:</span>
                          <pre className="mt-1 text-[10px] text-lime-300 bg-black/40 p-2 rounded-lg overflow-x-auto">
                            {JSON.stringify(log.metadata, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
