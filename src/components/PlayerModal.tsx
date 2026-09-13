import React from 'react';
import { X, Phone, MessageSquare, Trophy, MapPin, Clock, Calendar, CheckCircle2, ChevronRight, Swords, Edit2 } from 'lucide-react';
import { Player, Match, User } from '../types';
import { formatMatchScore, SURFACE_NAMES } from '../utils/tennisRules';

interface PlayerModalProps {
  player: Player | null;
  players: Player[];
  matches: Match[];
  currentUser?: User | null;
  onClose: () => void;
  onEditPlayer: (player: Player) => void;
  onOpenNewMatchWith: (player: Player) => void;
  onSelectOtherPlayer: (player: Player) => void;
}

export const PlayerModal: React.FC<PlayerModalProps> = ({
  player,
  players,
  matches,
  currentUser,
  onClose,
  onEditPlayer,
  onOpenNewMatchWith,
  onSelectOtherPlayer,
}) => {
  if (!player) return null;

  // Filter player matches
  const playerMatches = matches
    .filter((m) => m.player1Id === player.id || m.player2Id === player.id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const completedMatches = playerMatches.filter((m) => m.status === 'completed');
  const wins = completedMatches.filter((m) => m.winnerId === player.id).length;
  const losses = completedMatches.length - wins;
  const winRate = completedMatches.length > 0 ? Math.round((wins / completedMatches.length) * 100) : 0;

  // Sets & games calculation
  let setsWon = 0;
  let setsLost = 0;
  let gamesWon = 0;
  let gamesLost = 0;

  completedMatches.forEach((m) => {
    const isP1 = m.player1Id === player.id;
    m.sets.forEach((s) => {
      const gW = isP1 ? s.games1 : s.games2;
      const gL = isP1 ? s.games2 : s.games1;
      if (gW > gL) setsWon++;
      else setsLost++;
      gamesWon += gW;
      gamesLost += gL;
    });
  });

  // H2H breakdown with all other players
  const otherPlayers = players.filter((p) => p.id !== player.id);
  const h2hList = otherPlayers.map((opp) => {
    const directMatches = completedMatches.filter(
      (m) => m.player1Id === opp.id || m.player2Id === opp.id
    );
    const oppWins = directMatches.filter((m) => m.winnerId === player.id).length;
    const oppLosses = directMatches.length - oppWins;
    const isScheduled = matches.some(
      (m) =>
        m.status === 'scheduled' &&
        ((m.player1Id === player.id && m.player2Id === opp.id) ||
          (m.player1Id === opp.id && m.player2Id === player.id))
    );

    return {
      opponent: opp,
      played: directMatches.length,
      wins: oppWins,
      losses: oppLosses,
      directMatches,
      isScheduled,
    };
  });

  return (
    <div className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-hidden">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-stone-200 w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 sm:zoom-in-95 duration-200">
        {/* Mobile drag handle */}
        <div className="w-12 h-1 bg-emerald-700/60 rounded-full mx-auto mt-2 sm:hidden shrink-0" />

        {/* Header Profile Banner */}
        <div className="p-4 sm:p-6 bg-gradient-to-r from-emerald-950 via-emerald-900 to-stone-900 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 sm:top-4 sm:right-4 p-2 text-emerald-300 hover:text-white rounded-xl hover:bg-emerald-800/80 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
            <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl ${player.avatarColor} text-white font-black text-xl sm:text-2xl flex items-center justify-center shadow-lg border-2 border-lime-400/40 shrink-0`}>
              {player.name.charAt(0)}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl sm:text-2xl font-black tracking-tight">{player.name}</h2>
                {player.nickname && (
                  <span className="text-sm text-lime-300 font-medium">„{player.nickname}”</span>
                )}
                {player.status === 'injured' && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-400/40 font-bold">
                    Kontuzja
                  </span>
                )}
              </div>
              {(() => {
                const parts = [player.playStyle?.trim(), player.preferredCourts?.trim()].filter(Boolean);
                if (parts.length === 0) return null;
                return (
                  <p className="text-xs text-emerald-200/80 mt-0.5">
                    {parts.join(' • ')}
                  </p>
                );
              })()}

              {/* Action links */}
              <div className="flex items-center gap-2 mt-3 flex-wrap">
                <a
                  href={`tel:${player.phone.replace(/\s+/g, '')}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-800/80 hover:bg-emerald-700 text-xs font-bold text-white border border-emerald-700 transition-colors"
                >
                  <Phone className="w-3.5 h-3.5 text-lime-400" />
                  <span>{player.phone}</span>
                </a>

                <a
                  href={`https://wa.me/${player.phone.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-lime-400 hover:bg-lime-300 text-xs font-bold text-emerald-950 transition-colors"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </a>

                <button
                  onClick={() => onOpenNewMatchWith(player)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white transition-colors cursor-pointer ml-auto"
                >
                  <span>Zagraj mecz →</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 space-y-6 overflow-y-auto overflow-x-hidden flex-1 text-sm overscroll-contain">
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-stone-50 p-3 rounded-2xl border border-stone-200 text-center">
              <span className="block text-xs font-bold text-stone-500 uppercase">Mecze W - P</span>
              <span className="text-xl font-black text-stone-900 font-display">
                <span className="text-emerald-700">{wins}</span> - <span className="text-stone-400">{losses}</span>
              </span>
              <span className="block text-[11px] sm:text-xs text-stone-400 mt-0.5">{completedMatches.length} rozegranych</span>
            </div>

            <div className="bg-stone-50 p-3 rounded-2xl border border-stone-200 text-center">
              <span className="block text-xs font-bold text-stone-500 uppercase">Skuteczność</span>
              <span className="text-xl font-black text-emerald-800 font-display">{winRate}%</span>
              <span className="block text-[11px] sm:text-xs text-stone-400 mt-0.5">wygranych meczów</span>
            </div>

            <div className="bg-stone-50 p-3 rounded-2xl border border-stone-200 text-center">
              <span className="block text-xs font-bold text-stone-500 uppercase">Bilans setów</span>
              <span className="text-xl font-black text-stone-900 font-display">
                {setsWon}:{setsLost}
              </span>
              <span className="block text-xs text-emerald-700 font-bold mt-0.5">
                {setsWon - setsLost > 0 ? `+${setsWon - setsLost}` : setsWon - setsLost}
              </span>
            </div>

            <div className="bg-stone-50 p-3 rounded-2xl border border-stone-200 text-center">
              <span className="block text-xs font-bold text-stone-500 uppercase">Bilans gemów</span>
              <span className="text-xl font-black text-stone-900 font-display">
                {gamesWon}:{gamesLost}
              </span>
              <span className="block text-xs text-emerald-700 font-bold mt-0.5">
                {gamesWon - gamesLost > 0 ? `+${gamesWon - gamesLost}` : gamesWon - gamesLost}
              </span>
            </div>
          </div>

          {/* Section: H2H Records with all players */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-stone-900 text-sm flex items-center gap-1.5">
                <Swords className="w-4 h-4 text-emerald-700" />
                <span>Bilans bezpośredni (Head-to-Head) z rywalami</span>
              </h3>
              <span className="text-xs text-stone-500">
                {h2hList.filter((h) => h.played > 0).length} z {h2hList.length} rozegranych
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {h2hList.map(({ opponent, played, wins: oppWins, losses: oppLosses, directMatches, isScheduled }) => (
                <div
                  key={opponent.id}
                  className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 text-xs transition-colors ${
                    played > 0
                      ? oppWins > oppLosses
                        ? 'bg-emerald-50/40 border-emerald-200'
                        : 'bg-stone-50 border-stone-200'
                      : isScheduled
                      ? 'bg-amber-50/50 border-amber-200'
                      : 'bg-white border-dashed border-stone-200 hover:border-stone-300'
                  }`}
                >
                  <div
                    onClick={() => onSelectOtherPlayer(opponent)}
                    className="flex items-center gap-2 cursor-pointer min-w-0 flex-1"
                  >
                    <div className={`w-7 h-7 rounded-lg ${opponent.avatarColor} text-white font-bold text-xs flex items-center justify-center shrink-0`}>
                      {opponent.name.charAt(0)}
                    </div>
                    <span className="font-semibold text-stone-900 break-words leading-tight">
                      {opponent.name}
                    </span>
                  </div>

                  <div className="shrink-0 text-right">
                    {played > 0 ? (
                      <span className="font-mono font-bold text-stone-800">
                        {oppWins}:{oppLosses} ({oppWins > oppLosses ? 'W' : 'P'})
                      </span>
                    ) : isScheduled ? (
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                        Zaplanowany
                      </span>
                    ) : (
                      <span className="text-[10px] text-stone-400 italic">Brak meczu</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section: Match History */}
          <div className="space-y-3">
            <h3 className="font-bold text-stone-900 text-sm flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-emerald-700" />
              <span>Historia rozegranych meczów ({completedMatches.length})</span>
            </h3>

            {completedMatches.length > 0 ? (
              <div className="space-y-2">
                {completedMatches.map((m) => {
                  const opponent = players.find(
                    (p) => p.id === (m.player1Id === player.id ? m.player2Id : m.player1Id)
                  );
                  const isWinner = m.winnerId === player.id;
                  const surfaceInfo = m.surface ? SURFACE_NAMES[m.surface] : null;

                  return (
                    <div
                      key={m.id}
                      className="p-3 bg-stone-50 rounded-2xl border border-stone-200 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`font-bold px-1.5 py-0.5 rounded text-[10px] ${
                            isWinner ? 'bg-emerald-600 text-white' : 'bg-stone-300 text-stone-700'
                          }`}>
                            {isWinner ? 'Wygrana' : 'Porażka'}
                          </span>
                          {(m.isFriendly || m.matchType === 'friendly') && (
                            <span className="font-bold px-1.5 py-0.5 rounded text-[10px] bg-amber-100 text-amber-900 border border-amber-300">
                              Towarzyski
                            </span>
                          )}
                          <span className="font-bold text-stone-900 break-words leading-tight">
                            vs {opponent?.name}
                          </span>
                          {surfaceInfo && (
                            <span className="text-[10px] text-stone-500">
                              • {surfaceInfo.label}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-stone-500 mt-1 flex items-center gap-2">
                          <span>{m.date}</span>
                          {m.courtName && <span>• {m.courtName}</span>}
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="font-mono font-bold text-stone-900 text-sm">
                          {formatMatchScore(m.sets)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-stone-400 italic py-3 text-center bg-stone-50 rounded-xl">
                Ten zawodnik nie rozegrał jeszcze żadnego oficjalnego meczu w lidze.
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-stone-50 border-t border-stone-200 flex items-center justify-between">
          {(() => {
            const isAdmin = currentUser?.role === 'admin';
            const isSelf = !!currentUser && (
              player.id === currentUser.playerId ||
              (!!currentUser.email && player.email?.toLowerCase() === currentUser.email.toLowerCase()) ||
              player.name.trim().toLowerCase() === currentUser.name.trim().toLowerCase()
            );
            if (!isAdmin && !isSelf) return <div />;

            return (
              <button
                onClick={() => onEditPlayer(player)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                  isSelf
                    ? 'bg-amber-100 hover:bg-amber-200 text-amber-950 border border-amber-300 shadow-xs'
                    : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-950 border border-emerald-300 shadow-xs'
                }`}
              >
                <Edit2 className="w-3.5 h-3.5 text-emerald-800" />
                <span>{isSelf ? 'Edytuj moje dane zawodnika' : 'Edytuj dane zawodnika (Komisarz)'}</span>
              </button>
            );
          })()}

          <button
            onClick={onClose}
            className="px-4 py-2 bg-stone-200 hover:bg-stone-300 text-stone-800 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            Zamknij
          </button>
        </div>
      </div>
    </div>
  );
};
