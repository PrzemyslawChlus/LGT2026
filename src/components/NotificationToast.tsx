import React, { useEffect } from 'react';
import { Bell, Calendar, Trophy, X, ChevronRight } from 'lucide-react';
import { LeagueNotification } from '../types';

interface NotificationToastProps {
  notification: LeagueNotification | null;
  onClose: () => void;
  onClick: (notification: LeagueNotification) => void;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({
  notification,
  onClose,
  onClick,
}) => {
  useEffect(() => {
    if (!notification) return;
    const timer = setTimeout(() => {
      onClose();
    }, 7000);
    return () => clearTimeout(timer);
  }, [notification, onClose]);

  if (!notification) return null;

  const isMatchScheduled = notification.type === 'match_scheduled';
  const isMatchCompleted = notification.type === 'match_completed';

  return (
    <div
      role="alert"
      className="fixed top-4 right-4 left-4 sm:left-auto sm:w-96 z-50 animate-in fade-in slide-in-from-top-4 duration-300 pointer-events-auto"
    >
      <div className="bg-emerald-950/95 backdrop-blur-md text-white rounded-2xl p-4 shadow-2xl border border-amber-400/40 flex items-start gap-3 hover:border-amber-400 transition-all">
        {/* Icon */}
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${
            isMatchScheduled
              ? 'bg-amber-400 text-emerald-950'
              : isMatchCompleted
              ? 'bg-lime-400 text-emerald-950'
              : 'bg-emerald-800 text-lime-300'
          }`}
        >
          {isMatchScheduled ? (
            <Calendar className="w-5 h-5 stroke-[2.5]" />
          ) : isMatchCompleted ? (
            <Trophy className="w-5 h-5 stroke-[2.5]" />
          ) : (
            <Bell className="w-5 h-5" />
          )}
        </div>

        {/* Content */}
        <div
          className="flex-1 min-w-0 cursor-pointer"
          onClick={() => onClick(notification)}
        >
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="text-[10px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded-full bg-emerald-900 border border-emerald-700 text-lime-300">
              Powiadomienie push
            </span>
          </div>
          <h4 className="font-bold text-sm text-white leading-tight truncate">
            {notification.title}
          </h4>
          <p className="text-xs text-stone-300 mt-1 leading-snug line-clamp-2">
            {notification.body}
          </p>
          <div className="flex items-center gap-1 text-[11px] text-amber-300 font-semibold mt-2 hover:underline">
            <span>Zobacz szczegóły</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-lg text-stone-400 hover:text-white hover:bg-emerald-900/80 transition-colors cursor-pointer shrink-0"
          title="Zamknij"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
