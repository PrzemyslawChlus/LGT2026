import React, { useState, useEffect } from 'react';
import { X, UserPlus, Save, Trash2, KeyRound, Eye, EyeOff, ShieldCheck, User, Sparkles, CheckCircle2 } from 'lucide-react';
import { Player, PlayerStatus, User as AppUser } from '../types';

interface PlayerEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (player: Player, newPassword?: string) => void;
  onDelete?: (playerId: string) => void;
  playerToEdit?: Player | null;
  currentUser?: AppUser | null;
}

const AVATAR_COLORS = [
  'bg-emerald-700',
  'bg-blue-700',
  'bg-amber-600',
  'bg-rose-700',
  'bg-indigo-700',
  'bg-teal-700',
  'bg-fuchsia-700',
  'bg-stone-700',
  'bg-cyan-700',
  'bg-orange-700',
  'bg-violet-700',
  'bg-lime-800',
];

export const PlayerEditModal: React.FC<PlayerEditModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  playerToEdit,
  currentUser,
}) => {
  const [name, setName] = useState('');
  const [nickname, setNickname] = useState('');
  const [phone, setPhone] = useState('+48 ');
  const [email, setEmail] = useState('');
  const [avatarColor, setAvatarColor] = useState(AVATAR_COLORS[0]);
  const [playStyle, setPlayStyle] = useState('');
  const [preferredCourts, setPreferredCourts] = useState('');
  const [preferredTimes, setPreferredTimes] = useState('');
  const [status, setStatus] = useState<PlayerStatus>('active');
  const [notes, setNotes] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const isAdmin = currentUser?.role === 'admin';
  const isSelf = !!currentUser && !!playerToEdit && (
    playerToEdit.id === currentUser.playerId ||
    (!!currentUser.email && playerToEdit.email?.toLowerCase() === currentUser.email.toLowerCase()) ||
    playerToEdit.name.trim().toLowerCase() === currentUser.name.trim().toLowerCase()
  );

  // Sync state whenever modal opens or playerToEdit changes
  useEffect(() => {
    if (playerToEdit) {
      setName(playerToEdit.name || '');
      setNickname(playerToEdit.nickname || '');
      setPhone(playerToEdit.phone || '+48 ');
      setEmail(playerToEdit.email || (isSelf && currentUser?.email ? currentUser.email : ''));
      setAvatarColor(playerToEdit.avatarColor || AVATAR_COLORS[0]);
      setPlayStyle(playerToEdit.playStyle || '');
      setPreferredCourts(playerToEdit.preferredCourts || '');
      setPreferredTimes(playerToEdit.preferredTimes || '');
      setStatus(playerToEdit.status || 'active');
      setNotes(playerToEdit.notes || '');
    } else {
      setName('');
      setNickname('');
      setPhone('+48 ');
      setEmail('');
      setAvatarColor(AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)]);
      setPlayStyle('');
      setPreferredCourts('');
      setPreferredTimes('');
      setStatus('active');
      setNotes('');
    }
    setNewPassword('');
    setShowPassword(false);
    setErrorMessage(null);
  }, [playerToEdit, isOpen, isSelf, currentUser]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!name.trim()) {
      setErrorMessage('Podaj imię i nazwisko gracza');
      return;
    }

    if (!phone.trim() || phone.trim() === '+48') {
      setErrorMessage('Podaj numer telefonu do kontaktu');
      return;
    }

    if (newPassword.trim() && newPassword.trim().length < 6) {
      setErrorMessage('Nowe hasło musi mieć co najmniej 6 znaków.');
      return;
    }

    // Permission check: if not admin and not self, block editing
    if (playerToEdit && !isAdmin && !isSelf) {
      setErrorMessage('Brak uprawnień do edycji tego zawodnika. Możesz edytować wyłącznie własny profil.');
      return;
    }

    const updated: Player = {
      id: playerToEdit?.id || `p_${Date.now()}`,
      name: name.trim(),
      nickname: nickname.trim() || undefined,
      phone: phone.trim(),
      email: email.trim() || undefined,
      avatarColor,
      playStyle: playStyle.trim() || undefined,
      preferredSurfaces: playerToEdit?.preferredSurfaces || ['Mączka'],
      preferredCourts: preferredCourts.trim() || undefined,
      preferredTimes: preferredTimes.trim() || undefined,
      status,
      notes: notes.trim() || undefined,
    };

    onSave(updated, newPassword.trim() ? newPassword.trim() : undefined);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-hidden">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-stone-200 w-full max-w-lg max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 sm:zoom-in-95 duration-200">
        {/* Mobile drag handle */}
        <div className="w-12 h-1 bg-emerald-700/60 rounded-full mx-auto mt-2 sm:hidden shrink-0" />

        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-950 to-emerald-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-lime-400 text-emerald-950 flex items-center justify-center font-bold shrink-0">
              {isSelf ? <User className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
            </div>
            <div>
              <h2 className="font-bold text-base sm:text-lg leading-tight">
                {isSelf
                  ? 'Edycja Twoich danych dżentelmena'
                  : playerToEdit
                  ? isAdmin
                    ? 'Edycja zawodnika (Komisarz Ligi)'
                    : 'Edycja danych zawodnika'
                  : 'Dodaj nowego zawodnika do ligi'}
              </h2>
              <p className="text-[11px] text-emerald-300/80 mt-0.5 font-medium">
                {isSelf
                  ? 'Aktualizacja profilu i konta w lidze'
                  : isAdmin
                  ? 'Zarządzanie profilem ligowym'
                  : 'Wprowadź dane dżentelmena'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-emerald-300 hover:text-white rounded-xl hover:bg-emerald-800/80 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto overflow-x-hidden flex-1 text-sm overscroll-contain">
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
              {errorMessage}
            </div>
          )}

          {isSelf && (
            <div className="p-3 bg-emerald-50 border border-emerald-200/90 rounded-2xl flex items-center gap-2 text-xs text-emerald-900 font-medium">
              <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>
                Jesteś zalogowany jako <strong>{currentUser.name}</strong>. Zmiany natychmiast zaktualizują Twoją wizytówkę w lidze.
              </span>
            </div>
          )}

          {/* Name & Nickname */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Imię i nazwisko *
              </label>
              <input
                type="text"
                required
                placeholder="np. Jan Kowalski"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-2.5 text-sm rounded-xl border border-stone-300 bg-white font-semibold focus:ring-2 focus:ring-emerald-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Pseudonim / Ksywa
              </label>
              <input
                type="text"
                placeholder="np. Kowal, As"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="w-full p-2.5 text-sm rounded-xl border border-stone-300 bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none"
              />
            </div>
          </div>

          {/* Phone & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Telefon (do umawiania meczów) *
              </label>
              <input
                type="tel"
                required
                placeholder="+48 600 000 000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full p-2.5 text-sm rounded-xl border border-stone-300 bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Status w lidze
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as PlayerStatus)}
                className="w-full p-2.5 text-sm rounded-xl border border-stone-300 bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none"
              >
                <option value="active">Aktywny (gra w lidze)</option>
                <option value="injured">Kontuzja / Przerwa medyczna</option>
                <option value="away">Urlop / Wyjazd</option>
              </select>
            </div>
          </div>

          {/* Email (especially useful if admin is configuring or user is logged in) */}
          {(isAdmin || isSelf) && (
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Adres e-mail konta
              </label>
              <input
                type="email"
                placeholder="np. gracz@example.com"
                value={email}
                disabled={!isAdmin && isSelf}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full p-2.5 text-sm rounded-xl border border-stone-300 ${
                  !isAdmin && isSelf ? 'bg-stone-100 text-stone-500 cursor-not-allowed' : 'bg-white'
                } focus:ring-2 focus:ring-emerald-600 focus:outline-none`}
              />
              {!isAdmin && isSelf && (
                <p className="text-[10px] text-stone-400 mt-1">Adres e-mail jest identyfikatorem konta logowania.</p>
              )}
            </div>
          )}

          {/* Avatar Color Picker */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-2">
              Kolor wizytówki dżentelmena
            </label>
            <div className="flex items-center gap-2 flex-wrap">
              {AVATAR_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setAvatarColor(c)}
                  className={`w-8 h-8 sm:w-7 sm:h-7 rounded-xl ${c} cursor-pointer transition-transform ${
                    avatarColor === c ? 'ring-2 ring-emerald-950 scale-110 shadow-sm' : 'opacity-80 hover:opacity-100'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Play Style */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              Styl gry / Ręka
            </label>
            <input
              type="text"
              placeholder="np. Praworęczny, jednoręczny bh, topspin z głębi"
              value={playStyle}
              onChange={(e) => setPlayStyle(e.target.value)}
              className="w-full p-2.5 text-sm rounded-xl border border-stone-300 bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none"
            />
          </div>

          {/* Preferred Courts & Hours */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Preferowane korty
              </label>
              <input
                type="text"
                placeholder="np. Mera, Warszawianka, Spójnia"
                value={preferredCourts}
                onChange={(e) => setPreferredCourts(e.target.value)}
                className="w-full p-2.5 text-sm rounded-xl border border-stone-300 bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Dostępność czasowa
              </label>
              <input
                type="text"
                placeholder="np. Czwartki po 18:00, weekendy rano"
                value={preferredTimes}
                onChange={(e) => setPreferredTimes(e.target.value)}
                className="w-full p-2.5 text-sm rounded-xl border border-stone-300 bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              Dodatkowe notatki / o sobie
            </label>
            <textarea
              rows={2}
              placeholder="np. Zwykle ma własne nowe piłki, preferuje korty pod balonem zimą..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-2.5 text-sm rounded-xl border border-stone-300 bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none"
            />
          </div>

          {/* Optional Password Change (for self edit or admin) */}
          {(isSelf || (isAdmin && playerToEdit)) && (
            <div className="p-3.5 bg-stone-50 border border-stone-200 rounded-2xl space-y-2">
              <label className="block text-xs font-bold text-stone-800 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-emerald-700" />
                  <span>{isSelf ? 'Zmień hasło logowania' : 'Ustaw nowe hasło dla gracza'}</span>
                </span>
                <span className="text-[10px] text-stone-400 font-normal">opcjonalne</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Wpisz nowe hasło (min. 6 znaków)"
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full pl-3 pr-10 py-2 bg-white border border-stone-300 rounded-xl text-xs font-medium text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-stone-400 hover:text-stone-700 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
              <p className="text-[10px] text-stone-500">
                Pozostaw puste pole, jeśli hasło ma pozostać bez zmian.
              </p>
            </div>
          )}

          {/* Submit & Delete */}
          <div className="pt-3 border-t border-stone-200 flex flex-wrap items-center justify-between gap-2">
            {isAdmin && playerToEdit && onDelete && playerToEdit.email?.toLowerCase() !== 'przemyslaw.chlus@gmail.com' ? (
              confirmDelete ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      onDelete(playerToEdit.id);
                      onClose();
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs animate-pulse"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Potwierdź usunięcie (kasuje wszystkie mecze i dane)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(false)}
                    className="text-xs text-stone-500 hover:text-stone-700 p-1 cursor-pointer"
                  >
                    Anuluj
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="inline-flex items-center gap-1.5 text-xs text-rose-600 hover:text-rose-700 font-bold p-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Usuń z ligi</span>
                </button>
              )
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-stone-600 hover:text-stone-900 text-xs font-semibold rounded-xl hover:bg-stone-100 transition-colors cursor-pointer"
              >
                Anuluj
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
              >
                <Save className="w-3.5 h-3.5 text-lime-400" />
                <span>Zapisz dane</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
