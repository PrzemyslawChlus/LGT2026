import React, { useState } from 'react';
import {
  X,
  UserPlus,
  ShieldCheck,
  KeyRound,
  Eye,
  EyeOff,
  Copy,
  Check,
  Sparkles,
  Phone,
  Mail,
  User as UserIcon,
  MapPin,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Share2,
  ShieldAlert,
} from 'lucide-react';
import { User, StoredUser, Player } from '../types';
import { adminCreateUserAndPlayer, AdminCreateUserInput } from '../utils/auth';

interface AdminAddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  onPlayerCreated: (player: Player) => void;
  onUserCreated?: (user: StoredUser) => void;
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

const STYLE_PRESETS = [
  'Praworęczny, oburęczny bh',
  'Praworęczny, jednoręczny bh',
  'Leworęczny, oburęczny bh',
  'Klasyczny tenis, wszechstronny',
  'Agresywny baseliner',
  'Serwis i wolej',
];

const COURT_PRESETS = [
  'Korty Miejskie',
  'Silva Sport',
  'Mera Warszawa',
  'Warszawianka',
  'Tenis Park',
  'WKT Mera',
];

const TIME_PRESETS = [
  'Dni robocze po 18:00',
  'Dni robocze 16:00 - 20:00',
  'Weekendy rano',
  'Dni robocze przedpołudnia',
  'Elastycznie (do uzgodnienia)',
];

const SURFACE_OPTIONS = ['Mączka', 'Twardy', 'Trawa', 'Dywan'];

function generateRandomPassword(): string {
  const prefixes = ['Tenis', 'Gem', 'Set', 'AsSerwis', 'Wolej', 'LigaGentleman'];
  const years = ['2026', '2025', '24'];
  const specialChars = ['!', '#', '$', '%'];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const year = years[Math.floor(Math.random() * years.length)];
  const num = Math.floor(10 + Math.random() * 90);
  const spec = specialChars[Math.floor(Math.random() * specialChars.length)];
  return `${prefix}${num}${spec}`;
}

export const AdminAddUserModal: React.FC<AdminAddUserModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onPlayerCreated,
  onUserCreated,
}) => {
  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('+48 ');
  const [password, setPassword] = useState(() => generateRandomPassword());
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<'player' | 'admin'>('player');
  const [status, setStatus] = useState<'approved' | 'pending'>('approved');
  const [nickname, setNickname] = useState('');
  const [playStyle, setPlayStyle] = useState('');
  const [preferredCourts, setPreferredCourts] = useState('');
  const [preferredTimes, setPreferredTimes] = useState('');
  const [preferredSurfaces, setPreferredSurfaces] = useState<string[]>(['Mączka']);
  const [avatarColor, setAvatarColor] = useState(AVATAR_COLORS[0]);
  const [notes, setNotes] = useState('');

  // UI state
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [createdSuccessData, setCreatedSuccessData] = useState<{
    user: StoredUser;
    player: Player;
    rawPassword: string;
  } | null>(null);
  const [copiedCredentials, setCopiedCredentials] = useState(false);

  if (!isOpen) return null;

  // Security guard: Admin-only component
  const isAdmin = currentUser?.role === 'admin';
  if (!isAdmin) {
    return (
      <div className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-6 max-w-md w-full text-center space-y-4 shadow-2xl border border-rose-200">
          <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-black text-stone-900">Brak uprawnień administratora</h3>
          <p className="text-xs text-stone-600">
            Ten moduł jest przeznaczony wyłącznie dla Komisarza Ligi. Zaloguj się na konto administratora, aby dodawać nowych użytkowników.
          </p>
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-stone-900 text-white font-bold text-xs rounded-xl cursor-pointer hover:bg-stone-800 transition-colors"
          >
            Zamknij
          </button>
        </div>
      </div>
    );
  }

  const handleGenerateNewPassword = () => {
    setPassword(generateRandomPassword());
  };

  const toggleSurface = (surf: string) => {
    setPreferredSurfaces((prev) =>
      prev.includes(surf) ? prev.filter((s) => s !== surf) : [...prev, surf]
    );
  };

  const handleResetForm = () => {
    setName('');
    setEmail('');
    setPhone('+48 ');
    setPassword(generateRandomPassword());
    setShowPassword(false);
    setRole('player');
    setStatus('approved');
    setNickname('');
    setPlayStyle('');
    setPreferredCourts('');
    setPreferredTimes('');
    setPreferredSurfaces(['Mączka']);
    setAvatarColor(AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)]);
    setNotes('');
    setErrorMessage(null);
    setCreatedSuccessData(null);
    setCopiedCredentials(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!name.trim()) {
      setErrorMessage('Podaj imię i nazwisko nowego gracza.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Wprowadź prawidłowy adres e-mail dla konta logowania.');
      return;
    }
    const cleanPhoneDigits = phone.replace(/\D/g, '');
    if (cleanPhoneDigits.length < 9) {
      setErrorMessage('Wprowadź prawidłowy numer telefonu (min. 9 cyfr).');
      return;
    }
    if (!password.trim() || password.trim().length < 6) {
      setErrorMessage('Hasło dostępowe musi mieć co najmniej 6 znaków.');
      return;
    }

    setSubmitting(true);
    try {
      const input: AdminCreateUserInput = {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        password: password.trim(),
        nickname: nickname.trim() || undefined,
        playStyle: playStyle.trim() || undefined,
        preferredCourts: preferredCourts.trim() || undefined,
        preferredTimes: preferredTimes.trim() || undefined,
        preferredSurfaces: preferredSurfaces.length > 0 ? preferredSurfaces : ['Mączka'],
        avatarColor,
        role,
        status,
        notes: notes.trim() || undefined,
      };

      const result = await adminCreateUserAndPlayer(currentUser, input, onPlayerCreated);

      if (onUserCreated) {
        onUserCreated(result.user);
      }

      setCreatedSuccessData({
        user: result.user,
        player: result.player,
        rawPassword: password.trim(),
      });
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Wystąpił błąd podczas tworzenia użytkownika.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyCredentialsMessage = () => {
    if (!createdSuccessData) return;
    const { user, rawPassword } = createdSuccessData;
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://gentlemen-tenis.pl';
    const msg = `Cześć ${user.name}! 🎾
Zostałeś oficjalnie dodany do Ligi Gentlemanów Tenisa przez Komisarza Ligi.

Twoje dane logowania do systemu rozgrywek:
👉 Adres strony: ${origin}
👉 Login (E-mail): ${user.email}
👉 Hasło dostępowe: ${rawPassword}

W panelu gracza możesz umawiać mecze, sprawdzać tabelę i rejestrować wyniki spotkań. Do zobaczenia na korcie!`;

    navigator.clipboard.writeText(msg);
    setCopiedCredentials(true);
    setTimeout(() => setCopiedCredentials(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-hidden">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-stone-200 w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 sm:zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-stone-200 bg-stone-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400 text-stone-900 flex items-center justify-center shadow-xs">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight text-white">
                  Dodaj Nowego Gracza
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  Panel Komisarza
                </span>
              </div>
              <p className="text-xs text-stone-300 mt-0.5">
                Bezpośrednie utworzenie konta logowania oraz karty zawodnika w lidze
              </p>
            </div>
          </div>
          <button
            id="close-admin-add-user-btn"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {createdSuccessData ? (
            /* SUCCESS STATE & CREDENTIALS SHARING */
            <div className="space-y-6 py-2">
              <div className="p-5 rounded-2xl bg-emerald-50 border-2 border-emerald-300 text-center space-y-2">
                <div className="w-12 h-12 bg-emerald-600 text-white rounded-full flex items-center justify-center mx-auto shadow-sm">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-black text-emerald-950">
                  Konto gracza zostało pomyślnie utworzone!
                </h3>
                <p className="text-xs text-emerald-800 max-w-md mx-auto">
                  Dżentelmen <strong>{createdSuccessData.user.name}</strong> ma już aktywne konto i kartę zawodnika w tabeli ligowej.
                </p>
              </div>

              {/* Credentials Box */}
              <div className="bg-stone-900 text-stone-100 rounded-2xl p-5 border border-stone-800 space-y-4 shadow-md">
                <div className="flex items-center justify-between pb-3 border-b border-stone-800">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                    <KeyRound className="w-4 h-4" />
                    Wygenerowane Dane Dostępowe
                  </span>
                  <span className="text-[11px] text-stone-400 font-mono">
                    Status: {createdSuccessData.user.status === 'approved' ? 'Zatwierdzony' : 'Oczekujący'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="bg-stone-800/80 p-3 rounded-xl border border-stone-700">
                    <span className="text-stone-400 block text-[11px]">Login (Adres E-mail):</span>
                    <strong className="text-white font-mono text-sm block mt-0.5 break-all">
                      {createdSuccessData.user.email}
                    </strong>
                  </div>
                  <div className="bg-stone-800/80 p-3 rounded-xl border border-stone-700">
                    <span className="text-stone-400 block text-[11px]">Hasło dostępowe:</span>
                    <strong className="text-lime-300 font-mono text-sm block mt-0.5 select-all">
                      {createdSuccessData.rawPassword}
                    </strong>
                  </div>
                  <div className="bg-stone-800/80 p-3 rounded-xl border border-stone-700">
                    <span className="text-stone-400 block text-[11px]">Telefon:</span>
                    <span className="text-stone-200 font-medium block mt-0.5">
                      {createdSuccessData.user.phone}
                    </span>
                  </div>
                  <div className="bg-stone-800/80 p-3 rounded-xl border border-stone-700">
                    <span className="text-stone-400 block text-[11px]">Rola w lidze:</span>
                    <span className="text-stone-200 font-medium block mt-0.5">
                      {createdSuccessData.user.role === 'admin' ? 'Administrator (Komisarz)' : 'Dżentelmen (Gracz)'}
                    </span>
                  </div>
                </div>

                {/* Copy message button */}
                <button
                  type="button"
                  id="copy-credentials-btn"
                  onClick={handleCopyCredentialsMessage}
                  className="w-full py-3 px-4 rounded-xl bg-lime-400 hover:bg-lime-300 text-stone-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
                >
                  {copiedCredentials ? (
                    <>
                      <Check className="w-4 h-4 text-stone-950" />
                      <span>Skopiowano do schowka!</span>
                    </>
                  ) : (
                    <>
                      <Share2 className="w-4 h-4" />
                      <span>Kopiuj gotową wiadomość SMS / WhatsApp dla gracza</span>
                    </>
                  )}
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleResetForm}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 text-stone-700 font-bold text-xs transition-colors cursor-pointer"
                >
                  + Dodaj kolejnego gracza
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs transition-colors cursor-pointer shadow-xs"
                >
                  Zakończ i zamknij
                </button>
              </div>
            </div>
          ) : (
            /* FORM STATE */
            <form id="admin-add-user-form" onSubmit={handleSubmit} className="space-y-6">
              {errorMessage && (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-300 text-rose-900 text-xs font-bold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* SECTION 1: DANE KONTA I LOGOWANIA */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-stone-200 text-stone-900 font-black text-sm">
                  <ShieldCheck className="w-4 h-4 text-emerald-700" />
                  <span>1. Dane Konta i Dostęp do Aplikacji</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      Imię i nazwisko <span className="text-rose-600">*</span>
                    </label>
                    <div className="relative">
                      <UserIcon className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        id="admin-add-name-input"
                        type="text"
                        required
                        placeholder="np. Piotr Jasik"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-stone-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      Adres E-mail (Login) <span className="text-rose-600">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        id="admin-add-email-input"
                        type="email"
                        required
                        placeholder="np. piotr.jasik@gmail.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-stone-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700 font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      Telefon kontaktowy <span className="text-rose-600">*</span>
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        id="admin-add-phone-input"
                        type="tel"
                        required
                        placeholder="+48 600 000 000"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-stone-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-stone-700">
                        Hasło dostępowe <span className="text-rose-600">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={handleGenerateNewPassword}
                        className="text-[11px] font-bold text-emerald-800 hover:text-emerald-900 flex items-center gap-1 cursor-pointer"
                        title="Wygeneruj inne hasło"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>Generuj inne</span>
                      </button>
                    </div>
                    <div className="relative">
                      <KeyRound className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        id="admin-add-password-input"
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-9 pr-10 py-2 text-xs rounded-xl border border-stone-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700 font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Role and Account Status selection */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      Rola w lidze
                    </label>
                    <select
                      id="admin-add-role-select"
                      value={role}
                      onChange={(e) => setRole(e.target.value as 'player' | 'admin')}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700 font-medium"
                    >
                      <option value="player">Dżentelmen (Zawodnik Ligi)</option>
                      <option value="admin">Administrator (Komisarz Ligi)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      Status konta
                    </label>
                    <select
                      id="admin-add-status-select"
                      value={status}
                      onChange={(e) => setStatus(e.target.value as 'approved' | 'pending')}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700 font-medium"
                    >
                      <option value="approved">Zatwierdzony (Dostęp natychmiastowy)</option>
                      <option value="pending">Oczekujący (Wymaga zatwierdzenia)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* SECTION 2: KARTA I PREFERENCJE TENISOWE */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center gap-2 pb-2 border-b border-stone-200 text-stone-900 font-black text-sm">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>2. Profil i Preferencje Tenisowe</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      Pseudonim / Przydomek (opcjonalnie)
                    </label>
                    <input
                      type="text"
                      placeholder="np. Jasiek, Maestro"
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      Kolor awatara
                    </label>
                    <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                      {AVATAR_COLORS.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setAvatarColor(c)}
                          className={`w-6 h-6 rounded-full ${c} transition-transform cursor-pointer ${
                            avatarColor === c
                              ? 'ring-2 ring-offset-2 ring-stone-900 scale-110'
                              : 'opacity-80 hover:opacity-100 hover:scale-105'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Styl gry */}
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Styl gry
                  </label>
                  <input
                    type="text"
                    value={playStyle}
                    onChange={(e) => setPlayStyle(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  />
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {STYLE_PRESETS.map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setPlayStyle(p)}
                        className={`text-[10px] px-2 py-0.5 rounded-lg border transition-colors cursor-pointer ${
                          playStyle === p
                            ? 'bg-emerald-950 text-white border-emerald-900'
                            : 'bg-stone-100 text-stone-600 border-stone-200 hover:bg-stone-200'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Preferowane korty */}
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Preferowane korty
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={preferredCourts}
                      onChange={(e) => setPreferredCourts(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-stone-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700"
                    />
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {COURT_PRESETS.map((cp) => (
                      <button
                        key={cp}
                        type="button"
                        onClick={() => setPreferredCourts(cp)}
                        className={`text-[10px] px-2 py-0.5 rounded-lg border transition-colors cursor-pointer ${
                          preferredCourts === cp
                            ? 'bg-emerald-950 text-white border-emerald-900'
                            : 'bg-stone-100 text-stone-600 border-stone-200 hover:bg-stone-200'
                        }`}
                      >
                        {cp}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Dostępność czasowa */}
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Dostępność / Terminy
                  </label>
                  <div className="relative">
                    <Clock className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={preferredTimes}
                      onChange={(e) => setPreferredTimes(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-stone-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700"
                    />
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {TIME_PRESETS.map((tp) => (
                      <button
                        key={tp}
                        type="button"
                        onClick={() => setPreferredTimes(tp)}
                        className={`text-[10px] px-2 py-0.5 rounded-lg border transition-colors cursor-pointer ${
                          preferredTimes === tp
                            ? 'bg-emerald-950 text-white border-emerald-900'
                            : 'bg-stone-100 text-stone-600 border-stone-200 hover:bg-stone-200'
                        }`}
                      >
                        {tp}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Nawierzchnie */}
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1.5">
                    Preferowane nawierzchnie
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {SURFACE_OPTIONS.map((surf) => {
                      const isSelected = preferredSurfaces.includes(surf);
                      return (
                        <button
                          key={surf}
                          type="button"
                          onClick={() => toggleSurface(surf)}
                          className={`text-xs px-3 py-1 rounded-xl font-bold border transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-emerald-700 text-white border-emerald-600 shadow-xs'
                              : 'bg-stone-100 text-stone-600 border-stone-200 hover:bg-stone-200'
                          }`}
                        >
                          {surf}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Notatki */}
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Notatki administracyjne (opcjonalnie)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Wewnętrzna notatka Komisarza..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700 resize-none"
                  />
                </div>
              </div>

              {/* Submit footer inside form */}
              <div className="pt-4 border-t border-stone-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-bold text-stone-600 hover:text-stone-900 transition-colors cursor-pointer"
                >
                  Anuluj
                </button>
                <button
                  type="submit"
                  id="submit-admin-add-user-btn"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-800 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-black rounded-xl shadow-md transition-all cursor-pointer"
                >
                  {submitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-lime-300" />
                      <span>Zapisywanie w lidze...</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4 text-lime-400" />
                      <span>Utwórz konto i dodaj gracza</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
