import React, { useState } from 'react';
import {
  Clock,
  Calendar,
  MapPin,
  CheckCircle2,
  Trash2,
  AlertTriangle,
  PlayCircle,
  X,
  CalendarClock,
  ChevronRight,
} from 'lucide-react';
import { Match, Player } from '../types';
import { formatDatePl } from '../utils/tennisRules';

interface OverdueMatchPromptModalProps {
  isOpen: boolean;
  match: Match | null;
  players: Player[];
  onConfirmHeld: (match: Match) => void;
  onConfirmNotHeld: (match: Match) => Promise<void> | void;
  onPostpone: (matchId: string) => void;
  onReschedule?: (match: Match) => void;
}

export const OverdueMatchPromptModal: React.FC<OverdueMatchPromptModalProps> = ({
  isOpen,
  match,
  players,
  onConfirmHeld,
  onConfirmNotHeld,
  onPostpone,
  onReschedule,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen || !match) return null;

  const player1 = players.find((p) => p.id === match.player1Id);
  const player2 = players.find((p) => p.id === match.player2Id);

  const p1Name = player1?.name || 'Zawodnik 1';
  const p2Name = player2?.name || 'Zawodnik 2';

  const handleNotHeldClick = async () => {
    try {
      setIsDeleting(true);
      await onConfirmNotHeld(match);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-stone-200 animate-in zoom-in-95 duration-200">
        {/* Header Ribbon */}
        <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 px-5 sm:px-6 py-4 text-white flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-white shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-100 block">
                Porządkowanie terminarza ligi
              </span>
              <h3 className="font-black text-sm sm:text-base leading-tight">
                Czy zaplanowany mecz się odbył?
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onPostpone(match.id)}
            className="w-8 h-8 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors text-white/80 hover:text-white cursor-pointer"
            title="Przypomnij później"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-4">
          <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-2xl flex items-start gap-2.5 text-xs text-amber-900 leading-relaxed">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p>
              Minął termin zaplanowanego spotkania. Aby w tabeli i terminarzu panował porządek,
              wystarczy, że <strong>jeden z uczestników</strong> odpowie, czy mecz doszedł do skutku.
            </p>
          </div>

          {/* Match Card Preview */}
          <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200 space-y-3">
            {/* Date & Court Header */}
            <div className="flex items-center justify-between gap-2 text-xs border-b border-stone-200/80 pb-2.5">
              <div className="flex items-center gap-1.5 font-bold text-stone-800">
                <Calendar className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                <span>{formatDatePl(match.date)}</span>
                {match.time && (
                  <span className="px-1.5 py-0.5 bg-stone-200/80 text-stone-800 rounded font-bold text-[11px]">
                    godz. {match.time}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                Termin minął
              </span>
            </div>

            {/* Players VS Row */}
            <div className="flex items-center justify-between gap-3 py-1">
              {/* Player 1 */}
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <div
                  className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl ${
                    player1?.avatarColor || 'bg-emerald-700'
                  } text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-xs`}
                >
                  {p1Name.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-stone-900 text-xs sm:text-sm truncate">
                    {p1Name}
                  </p>
                  {player1?.nickname && (
                    <p className="text-[10px] text-stone-400 font-medium truncate">
                      „{player1.nickname}”
                    </p>
                  )}
                </div>
              </div>

              {/* VS */}
              <span className="px-2 py-1 rounded-full bg-stone-200 text-stone-700 text-[10px] font-black shrink-0">
                VS
              </span>

              {/* Player 2 */}
              <div className="flex items-center gap-2.5 min-w-0 flex-1 justify-end text-right">
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-stone-900 text-xs sm:text-sm truncate">
                    {p2Name}
                  </p>
                  {player2?.nickname && (
                    <p className="text-[10px] text-stone-400 font-medium truncate">
                      „{player2.nickname}”
                    </p>
                  )}
                </div>
                <div
                  className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl ${
                    player2?.avatarColor || 'bg-amber-700'
                  } text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-xs`}
                >
                  {p2Name.charAt(0)}
                </div>
              </div>
            </div>

            {/* Court Name if set */}
            {match.courtName && (
              <div className="pt-2 border-t border-stone-200/80 flex items-center gap-1.5 text-xs text-stone-500">
                <MapPin className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                <span className="truncate">{match.courtName}</span>
              </div>
            )}
          </div>

          {/* Action Decision Buttons */}
          <div className="space-y-2.5 pt-2">
            {/* Option YES: Match took place -> complete match / enter result */}
            <button
              type="button"
              onClick={() => onConfirmHeld(match)}
              className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-gradient-to-r from-lime-400 to-lime-500 hover:from-lime-300 hover:to-lime-400 active:scale-[0.99] text-emerald-950 font-black shadow-md transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-3 min-w-0 text-left">
                <div className="w-8 h-8 rounded-xl bg-emerald-950 text-lime-400 flex items-center justify-center shrink-0 shadow-xs">
                  <PlayCircle className="w-5 h-5 fill-lime-400 text-emerald-950" />
                </div>
                <div>
                  <span className="text-xs sm:text-sm font-black block leading-tight">
                    Tak, mecz się odbył
                  </span>
                  <span className="text-[11px] text-emerald-900 font-semibold block">
                    Uzupełnij wynik spotkania teraz
                  </span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-emerald-900 group-hover:translate-x-0.5 transition-transform shrink-0" />
            </button>

            {/* Option NO: Match did not take place -> delete scheduled match */}
            <button
              type="button"
              disabled={isDeleting}
              onClick={handleNotHeldClick}
              className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-white hover:bg-rose-50/80 active:scale-[0.99] border-2 border-stone-200 hover:border-rose-300 text-stone-700 hover:text-rose-900 transition-all cursor-pointer group disabled:opacity-50"
            >
              <div className="flex items-center gap-3 min-w-0 text-left">
                <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                  <Trash2 className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs sm:text-sm font-bold block leading-tight group-hover:text-rose-900">
                    {isDeleting ? 'Usuwanie...' : 'Nie, mecz się nie odbył'}
                  </span>
                  <span className="text-[11px] text-stone-400 group-hover:text-rose-700 font-normal block">
                    Usuń ten zaplanowany mecz z terminarza
                  </span>
                </div>
              </div>
              <X className="w-4 h-4 text-stone-400 group-hover:text-rose-600 shrink-0" />
            </button>
          </div>

          {/* Subactions: Reschedule / Postpone */}
          <div className="pt-2 flex items-center justify-between text-xs text-stone-500 border-t border-stone-100">
            {onReschedule ? (
              <button
                type="button"
                onClick={() => onReschedule(match)}
                className="inline-flex items-center gap-1.5 text-stone-600 hover:text-emerald-700 font-semibold hover:underline cursor-pointer"
              >
                <CalendarClock className="w-3.5 h-3.5" />
                <span>Przełóż na inny termin</span>
              </button>
            ) : (
              <span />
            )}

            <button
              type="button"
              onClick={() => onPostpone(match.id)}
              className="text-stone-400 hover:text-stone-700 font-medium hover:underline cursor-pointer ml-auto"
            >
              Odpowiedz później
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
