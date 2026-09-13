import React, { useState } from 'react';
import { Phone, MessageSquare, Plus, Search, MapPin, Clock, Edit2, UserPlus, ShieldAlert, Award, User as UserIcon } from 'lucide-react';
import { Player, Match, User } from '../types';

interface PlayersDirectoryProps {
  players: Player[];
  matches: Match[];
  currentUser?: User | null;
  onSelectPlayer: (player: Player) => void;
  onEditPlayer: (player: Player) => void;
  onAddNewPlayer: () => void;
  onScheduleWithPlayer: (player: Player) => void;
}

export const PlayersDirectory: React.FC<PlayersDirectoryProps> = ({
  players,
  matches,
  currentUser,
  onSelectPlayer,
  onEditPlayer,
  onAddNewPlayer,
  onScheduleWithPlayer,
}) => {
  const [search, setSearch] = useState('');
  const isAdmin = currentUser?.role === 'admin';

  const filteredPlayers = players.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.nickname && p.nickname.toLowerCase().includes(search.toLowerCase())) ||
      (p.preferredCourts && p.preferredCourts.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-5">
      {/* Search and Add Player Bar */}
      <div className="bg-white rounded-2xl p-3 sm:p-4 shadow-xs border border-stone-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Szukaj gracza, kortu, pseudonimu..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 sm:py-2 text-xs sm:text-sm rounded-xl border border-stone-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
          />
        </div>

        {isAdmin && (
          <button
            id="add-new-player-btn"
            onClick={onAddNewPlayer}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 sm:py-2 bg-emerald-800 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-colors shadow-xs cursor-pointer shrink-0 min-h-[40px]"
          >
            <UserPlus className="w-4 h-4 text-lime-400" />
            <span>Dodaj nowego gracza</span>
          </button>
        )}
      </div>

      {/* Players Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPlayers.map((player) => {
          // Calculate player stats
          const playerMatches = matches.filter(
            (m) => m.status === 'completed' && (m.player1Id === player.id || m.player2Id === player.id)
          );
          const wins = playerMatches.filter((m) => m.winnerId === player.id).length;
          const losses = playerMatches.length - wins;

          const isSelf = !!currentUser && (
            player.id === currentUser.playerId ||
            (!!currentUser.email && player.email?.toLowerCase() === currentUser.email.toLowerCase()) ||
            player.name.trim().toLowerCase() === currentUser.name.trim().toLowerCase()
          );
          const canEdit = isAdmin || isSelf;

          return (
            <div
              key={player.id}
              className={`bg-white rounded-2xl p-4 border transition-all flex flex-col justify-between group ${
                isSelf ? 'border-amber-400/80 shadow-sm ring-1 ring-amber-400/30' : 'border-stone-200 shadow-xs hover:shadow-md'
              }`}
            >
              <div>
                {/* Header: Avatar, Name, Status, Edit */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div
                    onClick={() => onSelectPlayer(player)}
                    className="flex items-center gap-3 cursor-pointer flex-1 min-w-0"
                  >
                    <div className={`w-12 h-12 rounded-2xl ${player.avatarColor} text-white font-black text-lg flex items-center justify-center shadow-xs shrink-0 group-hover:scale-105 transition-transform`}>
                      {player.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-stone-900 text-base break-words leading-tight group-hover:text-emerald-700 transition-colors">
                          {player.name}
                        </h3>
                        {isSelf && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 shrink-0">
                            To Ty
                          </span>
                        )}
                      </div>
                      {player.nickname && (
                        <p className="text-xs text-stone-400 font-medium">„{player.nickname}”</p>
                      )}
                    </div>
                  </div>

                  {canEdit && (
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => onEditPlayer(player)}
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                          isSelf
                            ? 'text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-300/80'
                            : 'text-stone-400 hover:text-emerald-700 hover:bg-stone-100'
                        }`}
                        title={isSelf ? 'Edytuj swoje dane profilu' : 'Edytuj dane zawodnika (Komisarz)'}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Status Badge & Style */}
                <div className="flex items-center gap-2 flex-wrap mb-3">
                  {player.status === 'active' && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                      Aktywny w lidze
                    </span>
                  )}
                  {player.status === 'injured' && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200">
                      Kontuzja
                    </span>
                  )}
                  {player.status === 'away' && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                      Urlop / Przerwa
                    </span>
                  )}

                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-stone-100 text-stone-600">
                    Bilans: {wins}W - {losses}P
                  </span>
                </div>

                {/* Details list */}
                {(() => {
                  const hasStyle = Boolean(player.playStyle?.trim());
                  const hasTimes = Boolean(player.preferredTimes?.trim());
                  const hasCourts = Boolean(player.preferredCourts?.trim());
                  if (!hasStyle && !hasTimes && !hasCourts) return null;

                  return (
                    <div className="space-y-1.5 text-xs text-stone-600 bg-stone-50/80 p-3 rounded-xl border border-stone-100 mb-3">
                      {hasStyle && (
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-stone-700">Styl:</span>
                          <span className="truncate">{player.playStyle}</span>
                        </div>
                      )}

                      {hasTimes && (
                        <div className="flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                          <span className="truncate">{player.preferredTimes}</span>
                        </div>
                      )}

                      {hasCourts && (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                          <span className="truncate">{player.preferredCourts}</span>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {player.notes && (
                  <p className="text-xs text-stone-500 italic mb-3">
                    „{player.notes}”
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2 border-t border-stone-100">
                <div className="grid grid-cols-2 gap-2">
                  <a
                    href={`tel:${player.phone.replace(/\s+/g, '')}`}
                    className="min-h-[40px] inline-flex items-center justify-center gap-1.5 py-2 px-3 bg-stone-100 hover:bg-stone-200 active:bg-stone-300 text-stone-800 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    <Phone className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                    <span>Zadzwoń</span>
                  </a>

                  <a
                    href={`https://wa.me/${player.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                      `Cześć ${player.name.split(' ')[0]}! Gramy w Lidze Tenisowej. Kiedy pasuje Ci rozegrać nasz mecz?`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="min-h-[40px] inline-flex items-center justify-center gap-1.5 py-2 px-3 bg-emerald-50 hover:bg-emerald-100 active:bg-emerald-200 text-emerald-900 border border-emerald-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>WhatsApp</span>
                  </a>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onSelectPlayer(player)}
                    className="flex-1 py-2 text-xs text-stone-600 hover:text-emerald-800 font-semibold transition-colors cursor-pointer text-center"
                  >
                    Profil i H2H →
                  </button>
                  <button
                    onClick={() => onScheduleWithPlayer(player)}
                    className="min-h-[38px] py-2 px-3.5 bg-emerald-800 hover:bg-emerald-700 active:bg-emerald-900 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
                  >
                    Zagraj mecz
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
