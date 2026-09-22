/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Bell,
  BellRing,
  Calendar,
  Trophy,
  Clock,
  Volume2,
  X,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { playNotificationChime } from '../utils/notifications';

interface PushNotificationPromptModalProps {
  isOpen: boolean;
  onEnable: () => Promise<void>;
  onDismiss: () => void;
}

export const PushNotificationPromptModal: React.FC<PushNotificationPromptModalProps> = ({
  isOpen,
  onEnable,
  onDismiss,
}) => {
  const [isActivating, setIsActivating] = useState(false);
  const [isPlayingSound, setIsPlayingSound] = useState(false);

  if (!isOpen) return null;

  const handleEnableClick = async () => {
    setIsActivating(true);
    try {
      await onEnable();
    } finally {
      setIsActivating(false);
    }
  };

  const handleTestSound = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsPlayingSound(true);
    playNotificationChime();
    setTimeout(() => setIsPlayingSound(false), 900);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="push-prompt-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-emerald-950/70 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-stone-200/90 overflow-hidden flex flex-col text-stone-900"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Subtle decorative top bar */}
        <div className="h-2 w-full bg-gradient-to-r from-emerald-800 via-lime-500 to-amber-500" />

        {/* Close button */}
        <button
          onClick={onDismiss}
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-stone-100 hover:bg-stone-200 active:scale-95 flex items-center justify-center text-stone-500 hover:text-stone-800 transition-colors cursor-pointer z-10"
          aria-label="Zamknij monit"
          title="Zamknij"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Body */}
        <div className="p-5 sm:p-7 space-y-5">
          {/* Header Badge & Title */}
          <div className="text-center space-y-2">
            <div className="relative inline-flex items-center justify-center mx-auto mb-1">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-950 flex items-center justify-center shadow-lg border border-emerald-700/60 text-lime-400">
                <BellRing className="w-8 h-8 sm:w-10 sm:h-10 animate-bounce duration-1000" />
              </div>
              <div className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-amber-400 border-2 border-white flex items-center justify-center shadow-xs">
                <Sparkles className="w-3.5 h-3.5 text-emerald-950 stroke-[2.5]" />
              </div>
            </div>

            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-100/90 text-emerald-900 text-[11px] sm:text-xs font-black uppercase tracking-wider">
              🎾 Liga Gentlemanów w Tenisie
            </span>

            <h2
              id="push-prompt-title"
              className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight leading-snug"
            >
              Włącz powiadomienia push
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 max-w-sm mx-auto leading-relaxed">
              Bądź zawsze na bieżąco ze swoimi meczami, wynikami i zmianami w tabeli ligowej.
            </p>
          </div>

          {/* Benefits List */}
          <div className="space-y-2.5 bg-stone-50/80 p-3.5 sm:p-4 rounded-2xl border border-stone-200/70">
            {/* Benefit 1 */}
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                <Calendar className="w-4 h-4 stroke-[2.5]" />
              </div>
              <div className="text-left min-w-0">
                <div className="text-xs sm:text-sm font-bold text-stone-900">
                  Zaplanowane mecze
                </div>
                <div className="text-[11px] sm:text-xs text-stone-500 leading-normal">
                  Natychmiast dowiesz się, gdy rywal zaproponuje termin lub zmieni godzinę spotkania.
                </div>
              </div>
            </div>

            {/* Benefit 2 */}
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                <Trophy className="w-4 h-4 stroke-[2.5]" />
              </div>
              <div className="text-left min-w-0">
                <div className="text-xs sm:text-sm font-bold text-stone-900">
                  Wyniki spotkań i tabela
                </div>
                <div className="text-[11px] sm:text-xs text-stone-500 leading-normal">
                  Śledź na żywo rozstrzygnięcia pojedynków i zmiany w ligowej klasyfikacji.
                </div>
              </div>
            </div>

            {/* Benefit 3 */}
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-800 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                <Clock className="w-4 h-4 stroke-[2.5]" />
              </div>
              <div className="text-left min-w-0">
                <div className="text-xs sm:text-sm font-bold text-stone-900">
                  Przypomnienia 2h po meczu
                </div>
                <div className="text-[11px] sm:text-xs text-stone-500 leading-normal">
                  Gdy miną 2 godziny od zaplanowanego meczu, otrzymasz pomocne przypomnienie o wpisaniu wyniku.
                </div>
              </div>
            </div>

            {/* Benefit 4 - Audio */}
            <div className="flex items-start justify-between gap-3 pt-1 border-t border-stone-200/60">
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-lime-100 text-emerald-900 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                  <Volume2 className="w-4 h-4 stroke-[2.5]" />
                </div>
                <div className="text-left min-w-0">
                  <div className="text-xs sm:text-sm font-bold text-stone-900">
                    Dźwięk uderzenia piłki
                  </div>
                  <div className="text-[11px] sm:text-xs text-stone-500 leading-normal">
                    Powiadomieniom towarzyszy autentyczny odgłos czystego forehandu tenisowego.
                  </div>
                </div>
              </div>

              {/* Sound preview button */}
              <button
                type="button"
                onClick={handleTestSound}
                className={`shrink-0 inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
                  isPlayingSound
                    ? 'bg-lime-400 text-emerald-950 border-lime-500 scale-95'
                    : 'bg-white hover:bg-stone-100 text-emerald-900 border-stone-200 hover:border-lime-400'
                }`}
                title="Odsłuchaj dźwięk forehandu tenisowego"
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>{isPlayingSound ? 'Gra...' : 'Odsłuchaj'}</span>
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-1">
            <button
              type="button"
              onClick={handleEnableClick}
              disabled={isActivating}
              className="w-full flex items-center justify-center gap-2.5 py-3.5 px-5 rounded-2xl bg-gradient-to-r from-lime-400 via-lime-500 to-emerald-500 hover:from-lime-300 hover:to-emerald-400 text-emerald-950 font-black text-sm sm:text-base shadow-md hover:shadow-lg active:scale-[0.99] transition-all cursor-pointer disabled:opacity-75 disabled:pointer-events-none"
            >
              {isActivating ? (
                <>
                  <div className="w-4 h-4 border-2 border-emerald-950 border-t-transparent rounded-full animate-spin" />
                  <span>Uruchamianie...</span>
                </>
              ) : (
                <>
                  <Bell className="w-5 h-5 fill-emerald-950/20 stroke-[2.5]" />
                  <span>Włącz powiadomienia</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onDismiss}
              disabled={isActivating}
              className="w-full py-2.5 px-4 text-xs sm:text-sm font-semibold text-stone-500 hover:text-stone-800 hover:bg-stone-100 rounded-xl transition-colors cursor-pointer"
            >
              Może później
            </button>
          </div>

          {/* Privacy Note */}
          <div className="flex items-center justify-center gap-1.5 text-[11px] text-stone-400 text-center">
            <CheckCircle2 className="w-3.5 h-3.5 text-lime-600 shrink-0" />
            <span>Zero spamu. Preferencje możesz w każdej chwili zmienić w menu dzwonka.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
