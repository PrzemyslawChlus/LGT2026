import React, { useState } from 'react';
import {
  Lock,
  Mail,
  User as UserIcon,
  ShieldCheck,
  KeyRound,
  Eye,
  EyeOff,
  CheckCircle2,
  Clock,
  ShieldAlert,
  X,
  Loader2,
  Send,
} from 'lucide-react';
import { User, Player } from '../types';
import {
  loginWithFirebase,
  registerUser,
  resetPasswordWithFirebase,
  RegistrationInput,
} from '../utils/auth';
import { logEvent } from '../utils/logger';

interface AuthViewProps {
  onLoginSuccess: (user: User) => void;
  players?: Player[];
  onPlayerCreated?: (newPlayer: Player) => void;
}

export const AuthView: React.FC<AuthViewProps> = ({ onLoginSuccess }) => {
  const [activeMode, setActiveMode] = useState<'login' | 'register'>('login');

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isSubmittingLogin, setIsSubmittingLogin] = useState(false);

  // Forgot password modal state
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [resetEmailInput, setResetEmailInput] = useState('');
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState<string | null>(null);
  const [isSendingReset, setIsSendingReset] = useState(false);

  // Register form state
  const [regName, setRegName] = useState('');
  const [regNickname, setRegNickname] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [regPreferredTimes, setRegPreferredTimes] = useState('');
  const [regCourts, setRegCourts] = useState('');
  const [fairPlayPledge, setFairPlayPledge] = useState(true);
  const [regError, setRegError] = useState<string | null>(null);
  const [isSubmittingReg, setIsSubmittingReg] = useState(false);
  const [registeredPendingUser, setRegisteredPendingUser] = useState<User | null>(null);

  const handleRegPhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    val = val.replace(/^\+?48\s*/, '');
    const digits = val.replace(/\D/g, '').slice(0, 9);
    let formatted = '';
    for (let i = 0; i < digits.length; i++) {
      if (i === 3 || i === 6) {
        formatted += ' ';
      }
      formatted += digits[i];
    }
    setRegPhone(formatted);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    if (!loginEmail.trim() || !loginPassword.trim()) {
      setLoginError('Wprowadź adres e-mail oraz hasło.');
      return;
    }

    setIsSubmittingLogin(true);
    try {
      const user = await loginWithFirebase(loginEmail, loginPassword);
      onLoginSuccess(user);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setLoginError(err.message);
      } else {
        setLoginError('Wystąpił błąd logowania. Spróbuj ponownie.');
      }
    } finally {
      setIsSubmittingLogin(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);

    if (!regName.trim() || !regEmail.trim() || !regPhone.trim() || !regPassword.trim()) {
      const msg = 'Uzupełnij wszystkie wymagane pola formularza.';
      setRegError(msg);
      return;
    }

    const cleanPhoneDigits = regPhone.replace(/\D/g, '');
    if (cleanPhoneDigits.length < 9) {
      const msg = 'Wprowadź prawidłowy 9-cyfrowy numer telefonu.';
      setRegError(msg);
      return;
    }

    if (regPassword.length < 6) {
      const msg = 'Hasło musi mieć co najmniej 6 znaków.';
      setRegError(msg);
      return;
    }

    if (regPassword !== regConfirmPassword) {
      const msg = 'Hasła nie są identyczne.';
      setRegError(msg);
      return;
    }

    if (!fairPlayPledge) {
      const msg = 'Akceptacja Kodeksu Fair Play jest wymagana w Lidze Gentlemanów.';
      setRegError(msg);
      return;
    }

    setIsSubmittingReg(true);
    try {
      const input: RegistrationInput = {
        name: regName.trim(),
        nickname: regNickname.trim() || undefined,
        email: regEmail.trim(),
        password: regPassword,
        phone: `+48 ${regPhone.trim()}`,
        preferredTimes: regPreferredTimes.trim() || undefined,
        preferredCourts: regCourts.trim() || undefined,
      };

      const newUser = await registerUser(input);
      setRegisteredPendingUser(newUser);
      setRegName('');
      setRegNickname('');
      setRegEmail('');
      setRegPhone('');
      setRegPassword('');
      setRegConfirmPassword('');
      setRegPreferredTimes('');
      setRegCourts('');
    } catch (err: unknown) {
      if (err instanceof Error) {
        setRegError(err.message);
      } else {
        setRegError('Wystąpił błąd podczas rejestracji.');
      }
    } finally {
      setIsSubmittingReg(false);
    }
  };

  const handleSendPasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError(null);
    setResetSuccess(null);

    if (!resetEmailInput.trim()) {
      setResetError('Wpisz adres e-mail przypisany do Twojego konta.');
      return;
    }

    setIsSendingReset(true);
    try {
      await resetPasswordWithFirebase(resetEmailInput);
      setResetSuccess(
        `Wysłano wiadomość z bezpiecznym linkiem do zresetowania hasła na adres: ${resetEmailInput.trim()}. Sprawdź swoją skrzynkę odbiorczą (oraz folder SPAM).`
      );
    } catch (err: unknown) {
      setResetError(err instanceof Error ? err.message : 'Nie udało się wysłać linku resetującego.');
    } finally {
      setIsSendingReset(false);
    }
  };

  const openForgotPasswordModal = () => {
    setResetEmailInput(loginEmail.trim());
    setResetError(null);
    setResetSuccess(null);
    setShowForgotPasswordModal(true);
  };

  return (
    <div className="min-h-screen w-full max-w-full bg-stone-950 flex flex-col justify-center items-center px-4 py-8 sm:py-12 relative overflow-x-hidden overflow-y-auto font-sans selection:bg-amber-400 selection:text-emerald-950">
      {/* Background Decorative Atmosphere */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,#064e3b_0%,#022c22_45%,#0c0a09_85%)] opacity-95" />
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-emerald-700/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />
      </div>

      {/* Main Container */}
      <div className="relative z-10 w-full max-w-md min-w-0">
        {/* Brand Crest Header */}
        <div className="text-center mb-6">
          <div className="inline-block relative mb-3">
            <div className="w-24 h-24 sm:w-28 sm:h-28 mx-auto rounded-3xl overflow-hidden shadow-2xl shadow-black/80 border-2 border-amber-400/60 p-1 bg-emerald-950 flex items-center justify-center group transition-transform hover:scale-105 duration-300">
              <img
                src="/logo.svg"
                alt="Liga Gentlemanów Tenisa Crest"
                className="w-full h-full object-contain"
              />
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight font-display drop-shadow-md">
            Liga Gentlemanów Tenisa
          </h1>
          <p className="text-xs sm:text-sm text-emerald-300/90 mt-1 font-medium flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-amber-400 inline" />
            <span>Strefa Członkowska • Firebase Auth</span>
          </p>
        </div>

        {/* Card Box */}
        <div className="bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl shadow-black/60 border border-amber-400/30 overflow-hidden w-full min-w-0">
          {registeredPendingUser ? (
            <div className="p-6 sm:p-7 text-center space-y-4 w-full min-w-0">
              <div className="w-16 h-16 rounded-3xl bg-amber-100 text-amber-800 border-2 border-amber-300/80 flex items-center justify-center mx-auto shadow-inner">
                <Clock className="w-8 h-8 text-amber-700 animate-pulse" />
              </div>
              <div className="w-full min-w-0">
                <span className="inline-block text-[11px] font-bold text-amber-800 uppercase tracking-widest bg-amber-100/80 px-2.5 py-1 rounded-full border border-amber-300 max-w-full">
                  Weryfikacja zgłoszenia
                </span>
                <h3 className="text-xl font-black text-stone-900 mt-2.5 break-words">
                  Zgłoszenie oczekuje na akceptację
                </h3>
                <p className="text-xs text-stone-600 mt-2 leading-relaxed break-words">
                  Dziękujemy, Panie <strong>{registeredPendingUser.name}</strong>
                  {registeredPendingUser.nickname && (
                    <span className="text-emerald-800 font-bold ml-1">„{registeredPendingUser.nickname}”</span>
                  )}! Twoje konto zostało bezpiecznie utworzone w Firebase Authentication.
                </p>
              </div>

              <div className="p-3.5 bg-amber-50/90 border border-amber-200/90 rounded-2xl text-left space-y-1.5 w-full min-w-0">
                <p className="font-bold text-xs flex items-center gap-1.5 text-amber-950">
                  <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0" />
                  <span>Weryfikacja przez Komisarza Ligi</span>
                </p>
                <p className="text-[11px] text-stone-700 leading-normal break-words">
                  W celu ochrony ligi przed niechcianym ruchem z zewnątrz, <strong>Komisarz Ligi (Admin)</strong> musi zatwierdzić Twoje konto w panelu administracyjnym.
                </p>
                <p className="text-[11px] text-stone-700 leading-normal font-medium break-words">
                  Po zatwierdzeniu profilu automatycznie otrzymasz kartę zawodnika i możliwość pełnego logowania do rozgrywek.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setRegisteredPendingUser(null);
                  setActiveMode('login');
                }}
                className="w-full py-3 px-4 bg-emerald-950 hover:bg-emerald-900 text-white font-bold rounded-2xl text-xs transition-colors shadow-sm cursor-pointer"
              >
                Przejdź do logowania
              </button>
            </div>
          ) : (
            <>
              {/* Mode Switch Tabs */}
              <div className="grid grid-cols-2 p-1.5 bg-stone-100/90 border-b border-stone-200">
                <button
                  type="button"
                  onClick={() => {
                    setActiveMode('login');
                    setLoginError(null);
                  }}
                  className={`py-2.5 text-xs font-bold rounded-2xl transition-all cursor-pointer ${
                    activeMode === 'login'
                      ? 'bg-emerald-950 text-white shadow-md'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  Logowanie do Ligi
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveMode('register');
                    setRegError(null);
                  }}
                  className={`py-2.5 text-xs font-bold rounded-2xl transition-all cursor-pointer ${
                    activeMode === 'register'
                      ? 'bg-emerald-950 text-white shadow-md'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  Dołącz / Załóż konto
                </button>
              </div>

              {/* Form Content */}
              <div className="p-6 sm:p-7">
                {activeMode === 'login' ? (
                  /* LOGIN FORM */
                  <form onSubmit={handleLoginSubmit} className="space-y-4">
                    {loginError && (
                      <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 font-medium animate-in fade-in">
                        {loginError}
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">
                        Adres e-mail
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                        <input
                          type="email"
                          required
                          placeholder="np. gracz@domena.pl"
                          value={loginEmail}
                          onChange={(e) => setLoginEmail(e.target.value)}
                          className="w-full pl-9 pr-3 py-2.5 bg-white border border-stone-300 rounded-xl text-sm font-medium text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-bold text-stone-700">
                          Hasło dostępowe
                        </label>
                        <button
                          type="button"
                          onClick={openForgotPasswordModal}
                          className="text-xs font-semibold text-emerald-800 hover:text-emerald-950 hover:underline cursor-pointer"
                        >
                          Zapomniałeś hasła?
                        </button>
                      </div>
                      <div className="relative">
                        <KeyRound className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                        <input
                          type={showLoginPassword ? 'text' : 'password'}
                          required
                          placeholder="Wpisz hasło"
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          className="w-full pl-9 pr-10 py-2.5 bg-white border border-stone-300 rounded-xl text-sm font-medium text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                        />
                        <button
                          type="button"
                          onClick={() => setShowLoginPassword(!showLoginPassword)}
                          className="absolute right-3 top-3 text-stone-400 hover:text-stone-700 cursor-pointer"
                        >
                          {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmittingLogin}
                      className="w-full py-3 px-4 bg-gradient-to-r from-emerald-900 via-emerald-800 to-emerald-950 hover:from-emerald-800 hover:to-emerald-900 text-white font-bold rounded-2xl text-sm shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 border border-emerald-700/50 disabled:opacity-75"
                    >
                      {isSubmittingLogin ? (
                        <>
                          <Loader2 className="w-4 h-4 text-amber-400 animate-spin" />
                          <span>Uwierzytelnianie Firebase...</span>
                        </>
                      ) : (
                        <>
                          <Lock className="w-4 h-4 text-amber-400" />
                          <span>Wejdź do Ligi Gentlemanów</span>
                        </>
                      )}
                    </button>
                  </form>
                ) : (
                  /* REGISTRATION FORM */
                  <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
                    {regError && (
                      <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 font-medium animate-in fade-in">
                        {regError}
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-xs font-bold text-stone-700 mb-1">
                          Imię i nazwisko dżentelmena *
                        </label>
                        <div className="relative">
                          <UserIcon className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                          <input
                            type="text"
                            required
                            placeholder="np. Piotr Wiśniewski"
                            value={regName}
                            onChange={(e) => setRegName(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 bg-white border border-stone-300 rounded-xl text-xs font-medium text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center justify-between">
                          <span>Pseudonim / Ksywa</span>
                          <span className="text-[10px] text-stone-400 font-normal">opcjonalnie</span>
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-2 text-stone-400 text-xs font-serif font-bold select-none">„ ”</span>
                          <input
                            type="text"
                            placeholder="np. Wiśnia, As, Kowal"
                            value={regNickname}
                            onChange={(e) => setRegNickname(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 bg-white border border-stone-300 rounded-xl text-xs font-medium text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-xs font-bold text-stone-700 mb-1">
                          Adres e-mail *
                        </label>
                        <input
                          type="email"
                          required
                          placeholder="adam@domena.pl"
                          value={regEmail}
                          onChange={(e) => setRegEmail(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs font-medium text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-stone-700 mb-1">
                          Numer telefonu *
                        </label>
                        <div className="flex items-center rounded-xl border border-stone-300 bg-white overflow-hidden focus-within:ring-2 focus-within:ring-emerald-700 focus-within:border-transparent transition-all">
                          <span className="px-2.5 py-2 bg-stone-100 border-r border-stone-200 text-xs font-bold text-stone-600 select-none shrink-0">
                            +48
                          </span>
                          <input
                            type="tel"
                            required
                            placeholder="600 000 000"
                            value={regPhone}
                            onChange={handleRegPhoneChange}
                            className="w-full px-2.5 py-2 text-xs font-medium text-stone-900 focus:outline-none bg-transparent placeholder:text-stone-400"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-xs font-bold text-stone-700 mb-1">
                          Hasło dostępowe *
                        </label>
                        <input
                          type={showRegPassword ? 'text' : 'password'}
                          required
                          minLength={6}
                          placeholder="Min. 6 znaków"
                          value={regPassword}
                          onChange={(e) => setRegPassword(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs font-medium text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-stone-700 mb-1">
                          Powtórz hasło *
                        </label>
                        <input
                          type={showRegPassword ? 'text' : 'password'}
                          required
                          minLength={6}
                          placeholder="Powtórz hasło"
                          value={regConfirmPassword}
                          onChange={(e) => setRegConfirmPassword(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs font-medium text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                        />
                      </div>
                    </div>

                    {/* Preferowane godziny gry & Korty */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[11px] font-bold text-stone-700 mb-1">
                          Preferowane godziny gry
                        </label>
                        <input
                          type="text"
                          placeholder="np. Dni robocze po 18:00, weekendy"
                          value={regPreferredTimes}
                          onChange={(e) => setRegPreferredTimes(e.target.value)}
                          className="w-full px-3 py-1.5 bg-white border border-stone-300 rounded-xl text-xs text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-stone-700 mb-1">
                          Ulubione korty
                        </label>
                        <input
                          type="text"
                          placeholder="np. Korty Miejskie, Mera"
                          value={regCourts}
                          onChange={(e) => setRegCourts(e.target.value)}
                          className="w-full px-3 py-1.5 bg-white border border-stone-300 rounded-xl text-xs text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                        />
                      </div>
                    </div>

                    {/* Fair Play Pledge */}
                    <label className="flex items-start gap-2 pt-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={fairPlayPledge}
                        onChange={(e) => setFairPlayPledge(e.target.checked)}
                        className="mt-0.5 w-4 h-4 accent-emerald-800 rounded"
                      />
                      <span className="text-[11px] text-stone-600 leading-tight">
                        Przysięgam grać w duchu <strong>Gentleman's Fair Play</strong>: z szacunkiem do rywala, rzetelnym rozstrzyganiem autów i punktualnością.
                      </span>
                    </label>

                    <button
                      type="submit"
                      disabled={isSubmittingReg}
                      className="w-full py-2.5 px-4 bg-gradient-to-r from-emerald-900 to-emerald-950 hover:from-emerald-800 hover:to-emerald-900 text-white font-bold rounded-2xl text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 border border-emerald-700/50 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      {isSubmittingReg ? (
                        <>
                          <Loader2 className="w-4 h-4 text-amber-400 animate-spin" />
                          <span>Rejestrowanie w Firebase Auth...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-amber-400" />
                          <span>Prześlij zgłoszenie do weryfikacji</span>
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>
            </>
          )}
        </div>

        {/* Security Footer Note */}
        <div className="mt-4 text-center text-[11px] text-emerald-300/60 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Autoryzacja Firebase Auth • Baza zabezpieczona regułami Firestore</span>
        </div>
      </div>

      {/* Forgot Password Modal (Real Firebase Auth password reset email) */}
      {showForgotPasswordModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-stone-950/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto overflow-x-hidden"
          onClick={() => setShowForgotPasswordModal(false)}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl border border-stone-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-5 bg-gradient-to-r from-emerald-950 via-emerald-900 to-stone-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-400/20 flex items-center justify-center text-amber-300">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base">Reset hasła dostępowego</h3>
                  <p className="text-[11px] text-stone-300">Bezpieczny reset przez Firebase Auth</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowForgotPasswordModal(false)}
                className="p-1.5 rounded-full hover:bg-white/10 text-stone-300 hover:text-white transition-colors cursor-pointer"
                title="Zamknij"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <form onSubmit={handleSendPasswordReset} className="p-6 space-y-4">
              {resetError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 font-medium">
                  {resetError}
                </div>
              )}

              {resetSuccess ? (
                <div className="space-y-4">
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-900 font-medium leading-relaxed">
                    <CheckCircle2 className="w-5 h-5 text-emerald-700 mb-1" />
                    {resetSuccess}
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowForgotPasswordModal(false)}
                    className="w-full py-3 px-4 bg-emerald-950 hover:bg-emerald-900 text-white font-bold rounded-2xl text-xs transition-colors shadow-sm cursor-pointer"
                  >
                    Powrót do logowania
                  </button>
                </div>
              ) : (
                <>
                  <p className="text-xs text-stone-600 leading-relaxed">
                    Podaj adres e-mail przypisany do Twojego konta. Firebase wyśle Ci bezpieczny, jednorazowy link do ustawienia nowego hasła.
                  </p>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      Adres e-mail konta
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                      <input
                        type="email"
                        required
                        placeholder="twoj.email@domena.pl"
                        value={resetEmailInput}
                        onChange={(e) => setResetEmailInput(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 bg-white border border-stone-300 rounded-xl text-sm font-medium text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2.5 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowForgotPasswordModal(false)}
                      className="flex-1 py-2.5 px-4 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-2xl text-xs transition-colors cursor-pointer"
                    >
                      Anuluj
                    </button>
                    <button
                      type="submit"
                      disabled={isSendingReset}
                      className="flex-1 py-2.5 px-4 bg-emerald-950 hover:bg-emerald-900 text-white font-bold rounded-2xl text-xs transition-colors shadow-sm cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-75"
                    >
                      {isSendingReset ? (
                        <>
                          <Loader2 className="w-4 h-4 text-amber-400 animate-spin" />
                          <span>Wysyłanie...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 text-amber-400" />
                          <span>Wyślij link</span>
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
