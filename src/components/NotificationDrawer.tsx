import React, { useState } from 'react';
import {
  Bell,
  BellRing,
  Calendar,
  Trophy,
  CheckCircle2,
  AlertTriangle,
  X,
  Volume2,
  VolumeX,
  Share2,
  Trash2,
  CheckCheck,
  Smartphone,
  ChevronRight,
  Sparkles,
  Clock,
} from 'lucide-react';
import { LeagueNotification, NotificationSettings, Player, User } from '../types';
import { isIOSDevice, isStandaloneApp } from '../utils/notifications';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: LeagueNotification[];
  settings: NotificationSettings;
  onUpdateSettings: (newSettings: NotificationSettings) => void;
  permission: 'granted' | 'denied' | 'default' | 'unsupported';
  onRequestPermission: () => Promise<void>;
  onSendTestNotification: () => void;
  onMarkAsRead: (notificationId: string) => void;
  onMarkAllAsRead: () => void;
  onDeleteNotification: (notificationId: string) => void;
  onSelectMatch: (matchId?: string) => void;
  players: Player[];
  currentUser: User | null;
  activePlayerId: string | null;
  onSelectActivePlayerId: (playerId: string | null) => void;
  onOpenPushPromptModal?: () => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  notifications,
  settings,
  onUpdateSettings,
  permission,
  onRequestPermission,
  onSendTestNotification,
  onMarkAsRead,
  onMarkAllAsRead,
  onDeleteNotification,
  onSelectMatch,
  players,
  currentUser,
  activePlayerId,
  onSelectActivePlayerId,
  onOpenPushPromptModal,
}) => {
  const [activeTab, setActiveTab] = useState<'list' | 'settings'>('list');
  const [testSent, setTestSent] = useState(false);
  const isIOS = isIOSDevice();
  const isStandalone = isStandaloneApp();

  if (!isOpen) return null;

  // Filter notifications relevant to active player
  const relevantNotifications = notifications.filter((n) => {
    if (!activePlayerId) return true; // Show all if no player selected
    if (!n.recipientPlayerIds || n.recipientPlayerIds.length === 0) return true;
    return n.recipientPlayerIds.includes(activePlayerId);
  });

  const unreadCount = relevantNotifications.filter(
    (n) => !n.readBy || !activePlayerId || !n.readBy.includes(activePlayerId)
  ).length;

  const handleTestClick = () => {
    onSendTestNotification();
    setTestSent(true);
    setTimeout(() => setTestSent(false), 3000);
  };

  const formatTimestamp = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / (60 * 1000));
    const hours = Math.floor(diff / (60 * 60 * 1000));
    const days = Math.floor(diff / (24 * 60 * 60 * 1000));

    if (minutes < 1) return 'Przed chwilą';
    if (minutes < 60) return `${minutes} min temu`;
    if (hours < 24) return `${hours} godz. temu`;
    if (days === 1) return 'Wczoraj';
    return `${days} dni temu`;
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-xs flex justify-end animate-in fade-in duration-200"
    >
      {/* Background click dismiss */}
      <div className="flex-1" onClick={onClose} />

      {/* Drawer Panel */}
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-200 border-l border-stone-200">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-950 to-emerald-900 text-white flex items-center justify-between border-b border-emerald-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-lime-400 text-emerald-950 flex items-center justify-center font-black">
              <Bell className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base sm:text-lg leading-tight">Powiadomienia</h3>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-black bg-lime-400 text-emerald-950">
                    {unreadCount} nowe
                  </span>
                )}
              </div>
              <p className="text-[11px] sm:text-xs text-emerald-300">
                Mecze z Twoim udziałem i wyniki
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-emerald-300 hover:text-white rounded-xl hover:bg-emerald-800/80 transition-colors cursor-pointer"
            title="Zamknij"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Segmented Control: Lista / Ustawienia */}
        <div className="flex p-2 bg-stone-100 border-b border-stone-200">
          <button
            type="button"
            onClick={() => setActiveTab('list')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === 'list'
                ? 'bg-white text-emerald-950 shadow-xs'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            Otrzymane powiadomienia ({relevantNotifications.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === 'settings'
                ? 'bg-white text-emerald-950 shadow-xs'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            Ustawienia i test
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Permission Status Banner (shown on both tabs if not granted) */}
          {permission !== 'granted' && (
            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center shrink-0 mt-0.5">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-xs text-amber-950">
                    Powiadomienia przeglądarki wyłączone
                  </h4>
                  <p className="text-[11px] text-amber-800 mt-1 leading-relaxed">
                    Włącz powiadomienia na tym urządzeniu, aby otrzymywać alerty push na ekranie telefonu lub komputera.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      if (onOpenPushPromptModal) {
                        onOpenPushPromptModal();
                      } else {
                        onRequestPermission();
                      }
                    }}
                    className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-emerald-950 text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                  >
                    <BellRing className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>Włącz powiadomienia</span>
                  </button>
                </div>
              </div>

              {/* iOS Safari Tip */}
              {isIOS && !isStandalone && (
                <div className="mt-3 pt-3 border-t border-amber-200/80 text-[11px] text-amber-900">
                  <div className="flex items-center gap-1.5 font-bold mb-1">
                    <Smartphone className="w-3.5 h-3.5 text-amber-800" />
                    <span>Instrukcja dla iPhone / iPad (iOS):</span>
                  </div>
                  <p className="leading-snug text-stone-600">
                    1. Kliknij ikonę Udostępnij (kwadrat ze strzałką <Share2 className="w-3 h-3 inline mx-0.5" />) w dolnym menu Safari.<br />
                    2. Wybierz <strong>„Do ekranu początkowego”</strong>.<br />
                    3. Otwórz ligę z ikony na pulpicie i zezwól na powiadomienia.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 1: NOTIFICATIONS LIST */}
          {activeTab === 'list' && (
            <>
              {/* Filter / Actions Bar */}
              <div className="flex items-center justify-between text-xs text-stone-500 pb-1">
                <span>
                  {activePlayerId
                    ? `Dla: ${players.find((p) => p.id === activePlayerId)?.name || 'Wybrany gracz'}`
                    : 'Wszystkie powiadomienia ligi'}
                </span>
                {relevantNotifications.length > 0 && (
                  <button
                    type="button"
                    onClick={onMarkAllAsRead}
                    className="inline-flex items-center gap-1 text-emerald-700 hover:text-emerald-900 font-bold hover:underline cursor-pointer"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    <span>Oznacz jako przeczytane</span>
                  </button>
                )}
              </div>

              {relevantNotifications.length === 0 ? (
                <div className="py-12 text-center text-stone-400">
                  <div className="w-12 h-12 rounded-2xl bg-stone-100 flex items-center justify-center mx-auto mb-3 text-stone-400">
                    <Bell className="w-6 h-6 stroke-[1.5]" />
                  </div>
                  <h4 className="font-bold text-stone-700 text-sm">Brak powiadomień</h4>
                  <p className="text-xs text-stone-400 mt-1 max-w-xs mx-auto">
                    Gdy inny zawodnik zaplanuje z Tobą mecz lub wpisze wynik spotkania, pojawi się tutaj alert.
                  </p>
                  <button
                    type="button"
                    onClick={handleTestClick}
                    className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-200 transition-colors cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Wyślij powiadomienie testowe</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {relevantNotifications.map((notif) => {
                    const isRead =
                      Boolean(activePlayerId && notif.readBy?.includes(activePlayerId)) ||
                      Boolean(!activePlayerId && notif.readBy && notif.readBy.length > 0);

                    const isMatchScheduled = notif.type === 'match_scheduled';
                    const isMatchCompleted = notif.type === 'match_completed';
                    const isMatchOverdue = notif.type === 'match_overdue_reminder';

                    return (
                      <div
                        key={notif.id}
                        className={`p-3.5 rounded-2xl border transition-all text-xs relative ${
                          isRead
                            ? 'bg-stone-50 border-stone-200 text-stone-600'
                            : isMatchOverdue
                            ? 'bg-orange-50/70 border-orange-300 text-stone-900 shadow-xs'
                            : 'bg-emerald-50/50 border-emerald-300 text-stone-900 shadow-xs'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          {/* Icon */}
                          <div
                            className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                              isMatchScheduled
                                ? 'bg-amber-400/20 text-amber-900 border border-amber-300'
                                : isMatchCompleted
                                ? 'bg-lime-400/20 text-emerald-950 border border-lime-300'
                                : isMatchOverdue
                                ? 'bg-orange-400/20 text-orange-950 border border-orange-300'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {isMatchScheduled ? (
                              <Calendar className="w-4 h-4 stroke-[2.5]" />
                            ) : isMatchCompleted ? (
                              <Trophy className="w-4 h-4 stroke-[2.5]" />
                            ) : isMatchOverdue ? (
                              <Clock className="w-4 h-4 stroke-[2.5]" />
                            ) : (
                              <Bell className="w-4 h-4" />
                            )}
                          </div>

                          {/* Body */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <h5 className={`font-bold leading-tight ${isRead ? 'text-stone-700' : 'text-stone-950'}`}>
                                {notif.title}
                              </h5>
                              <span className="text-[10px] text-stone-400 whitespace-nowrap shrink-0">
                                {formatTimestamp(notif.createdAt)}
                              </span>
                            </div>

                            <p className="mt-1 text-stone-600 leading-snug">
                              {notif.body}
                            </p>

                            {/* Actions */}
                            <div className="mt-2.5 flex items-center justify-between gap-2 pt-1 border-t border-stone-200/60">
                              {notif.matchId ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (activePlayerId) onMarkAsRead(notif.id);
                                    onSelectMatch(notif.matchId);
                                    onClose();
                                  }}
                                  className="inline-flex items-center gap-1 font-bold text-emerald-700 hover:text-emerald-900 hover:underline cursor-pointer"
                                >
                                  <span>Zobacz mecz w terminarzu</span>
                                  <ChevronRight className="w-3.5 h-3.5" />
                                </button>
                              ) : (
                                <span />
                              )}

                              <div className="flex items-center gap-2">
                                {!isRead && activePlayerId && (
                                  <button
                                    type="button"
                                    onClick={() => onMarkAsRead(notif.id)}
                                    className="text-[11px] text-stone-500 hover:text-stone-900 cursor-pointer"
                                    title="Oznacz jako przeczytane"
                                  >
                                    Przeczytane
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => onDeleteNotification(notif.id)}
                                  className="text-stone-400 hover:text-rose-600 transition-colors cursor-pointer p-0.5"
                                  title="Usuń powiadomienie"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {/* TAB 2: SETTINGS & TEST */}
          {activeTab === 'settings' && (
            <div className="space-y-4 text-xs">
              {/* Player Identity Selection */}
              <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200">
                <label className="block font-bold text-stone-800 mb-1">
                  Kogo dotyczą powiadomienia?
                </label>
                <p className="text-stone-500 text-[11px] mb-2 leading-relaxed">
                  Wybierz swój profil zawodnika, aby otrzymywać powiadomienia o meczach z Twoim udziałem.
                </p>
                <select
                  value={activePlayerId || ''}
                  onChange={(e) => onSelectActivePlayerId(e.target.value || null)}
                  className="w-full px-3 py-2 bg-white rounded-xl border border-stone-300 text-stone-800 font-semibold focus:outline-emerald-600"
                >
                  <option value="">Wszyscy gracze (Wszystkie powiadomienia ligi)</option>
                  {players.map((pl) => (
                    <option key={pl.id} value={pl.id}>
                      {pl.name} {pl.nickname ? `(${pl.nickname})` : ''}
                    </option>
                  ))}
                </select>
                {currentUser && (
                  <p className="text-[10px] text-emerald-700 font-medium mt-1.5">
                    ✓ Zalogowano jako: {currentUser.name}
                  </p>
                )}
              </div>

              {/* Notification Toggles */}
              <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200 space-y-3">
                <h4 className="font-bold text-stone-800">Typy powiadomień</h4>

                <label className="flex items-center justify-between gap-3 p-2 rounded-xl bg-white border border-stone-200 hover:bg-stone-50 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-amber-600" />
                    <div>
                      <span className="font-bold text-stone-800 block">Zaplanowane mecze</span>
                      <span className="text-[10px] text-stone-400 block">Gdy ktoś ustali termin spotkania</span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.notifyScheduled}
                    onChange={(e) =>
                      onUpdateSettings({ ...settings, notifyScheduled: e.target.checked })
                    }
                    className="w-4 h-4 rounded text-emerald-700 focus:ring-emerald-600 accent-emerald-700 cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between gap-3 p-2 rounded-xl bg-white border border-stone-200 hover:bg-stone-50 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-lime-600" />
                    <div>
                      <span className="font-bold text-stone-800 block">Wpisane wyniki</span>
                      <span className="text-[10px] text-stone-400 block">Gdy zakończy się Twój mecz</span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.notifyResults}
                    onChange={(e) =>
                      onUpdateSettings({ ...settings, notifyResults: e.target.checked })
                    }
                    className="w-4 h-4 rounded text-emerald-700 focus:ring-emerald-600 accent-emerald-700 cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between gap-3 p-2 rounded-xl bg-white border border-stone-200 hover:bg-stone-50 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-orange-600" />
                    <div>
                      <span className="font-bold text-stone-800 block">Zaległe mecze (2h po terminie)</span>
                      <span className="text-[10px] text-stone-400 block">Przypomnienie o uzupełnieniu wyniku lub porządkach</span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.notifyOverdue ?? true}
                    onChange={(e) =>
                      onUpdateSettings({ ...settings, notifyOverdue: e.target.checked })
                    }
                    className="w-4 h-4 rounded text-emerald-700 focus:ring-emerald-600 accent-emerald-700 cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between gap-3 p-2 rounded-xl bg-white border border-stone-200 hover:bg-stone-50 cursor-pointer">
                  <div className="flex items-center gap-2">
                    {settings.soundEnabled ? (
                      <Volume2 className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <VolumeX className="w-4 h-4 text-stone-400" />
                    )}
                    <div>
                      <span className="font-bold text-stone-800 block">Dźwięk powiadomienia</span>
                      <span className="text-[10px] text-stone-400 block">Oryginalne uderzenie forehandem (kort kryty)</span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.soundEnabled}
                    onChange={(e) =>
                      onUpdateSettings({ ...settings, soundEnabled: e.target.checked })
                    }
                    className="w-4 h-4 rounded text-emerald-700 focus:ring-emerald-600 accent-emerald-700 cursor-pointer"
                  />
                </label>
              </div>

              {/* Status & Test Box */}
              <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                    <span className="font-bold text-emerald-950">Status powiadomień</span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                      permission === 'granted'
                        ? 'bg-emerald-200 text-emerald-900'
                        : 'bg-amber-200 text-amber-900'
                    }`}
                  >
                    {permission === 'granted'
                      ? 'Aktywne'
                      : permission === 'denied'
                      ? 'Zablokowane'
                      : 'Brak zgody'}
                  </span>
                </div>
                <p className="text-[11px] text-emerald-800 leading-relaxed mb-3">
                  System działa dla przeglądarek komputerowych, urządzeń mobilnych (Android Chrome) oraz skrótów PWA na iOS i Android.
                </p>

                <button
                  type="button"
                  onClick={handleTestClick}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-3 bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-lime-300" />
                  <span>{testSent ? 'Wysłano test! Sprawdź ekran' : 'Wyślij powiadomienie testowe'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
