import React, { useState } from 'react';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  KeyRound,
  Ban,
  Unlock,
  Trash2,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Eye,
  EyeOff,
  Copy,
  Check,
  Sparkles,
  AlertTriangle,
  X,
  UserCheck,
  UserX,
  UserPlus,
} from 'lucide-react';
import { StoredUser, User, Player } from '../types';
import { AdminAddUserModal } from './AdminAddUserModal';
import {
  blockUser,
  unblockUser,
  changeUserPassword,
  changeUserRole,
  deleteStoredUser,
  approveUser,
  rejectUser,
} from '../utils/auth';

interface AdminAccountsManagerProps {
  currentUser?: User | null;
  usersList: StoredUser[];
  onRefreshUsers: () => void;
  onPlayerCreated?: (newPlayer: Player) => void;
}

export const AdminAccountsManager: React.FC<AdminAccountsManagerProps> = ({
  currentUser,
  usersList,
  onRefreshUsers,
  onPlayerCreated,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<
    'all' | 'players' | 'admins' | 'blocked' | 'pending'
  >('all');

  // Password modal state
  const [passwordModalUser, setPasswordModalUser] = useState<StoredUser | null>(null);
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(true);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [copiedPassword, setCopiedPassword] = useState(false);

  // Delete modal state
  const [deleteModalUser, setDeleteModalUser] = useState<StoredUser | null>(null);

  // Add user modal state
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);

  // General feedback message banner
  const [feedbackMsg, setFeedbackMsg] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const showFeedback = (type: 'success' | 'error', text: string) => {
    setFeedbackMsg({ type, text });
    setTimeout(() => {
      setFeedbackMsg((current) => (current?.text === text ? null : current));
    }, 4500);
  };

  const pendingUsers = usersList.filter((u) => u.status === 'pending');
  const blockedUsers = usersList.filter((u) => u.status === 'blocked');
  const adminUsers = usersList.filter((u) => u.role === 'admin');
  const playerUsers = usersList.filter((u) => u.role === 'player');

  // Filtered accounts list
  const filteredUsers = usersList.filter((u) => {
    // Search query matching
    const query = searchQuery.trim().toLowerCase();
    if (query) {
      const matchName = u.name.toLowerCase().includes(query);
      const matchEmail = u.email.toLowerCase().includes(query);
      const matchPhone = u.phone?.toLowerCase().includes(query);
      const matchNick = u.nickname?.toLowerCase().includes(query);
      if (!matchName && !matchEmail && !matchPhone && !matchNick) return false;
    }

    // Tab filter
    if (filterStatus === 'players') return u.role === 'player';
    if (filterStatus === 'admins') return u.role === 'admin';
    if (filterStatus === 'blocked') return u.status === 'blocked';
    if (filterStatus === 'pending') return u.status === 'pending';
    return true;
  });

  const handleApprove = async (targetUser: StoredUser) => {
    if (!onPlayerCreated) return;
    try {
      const result = await approveUser(targetUser.id, onPlayerCreated);
      onRefreshUsers();
      showFeedback(
        'success',
        `✓ Gracz ${result.player.name} został zatwierdzony i oficjalnie dodany do tabeli ligi!`
      );
    } catch (err: unknown) {
      showFeedback('error', err instanceof Error ? err.message : 'Błąd podczas zatwierdzania.');
    }
  };

  const handleReject = async (targetUser: StoredUser) => {
    try {
      await rejectUser(targetUser.id);
      onRefreshUsers();
      showFeedback('success', `Zgłoszenie gracza ${targetUser.name} zostało odrzucone.`);
    } catch (err: unknown) {
      showFeedback('error', err instanceof Error ? err.message : 'Błąd podczas odrzucania.');
    }
  };

  const handleBlock = (targetUser: StoredUser) => {
    if (targetUser.id === currentUser?.id) {
      showFeedback('error', 'Nie możesz zablokować własnego konta administratora.');
      return;
    }
    try {
      blockUser(targetUser.id);
      onRefreshUsers();
      showFeedback(
        'success',
        `Konto gracza ${targetUser.name} zostało zablokowane. Gracz nie będzie mógł się zalogować.`
      );
    } catch (err: unknown) {
      showFeedback('error', err instanceof Error ? err.message : 'Błąd podczas blokowania.');
    }
  };

  const handleUnblock = (targetUser: StoredUser) => {
    try {
      unblockUser(targetUser.id);
      onRefreshUsers();
      showFeedback(
        'success',
        `Konto gracza ${targetUser.name} zostało odblokowane. Dostęp do logowania został przywrócony.`
      );
    } catch (err: unknown) {
      showFeedback('error', err instanceof Error ? err.message : 'Błąd podczas odblokowywania.');
    }
  };

  const handleChangeRole = (targetUser: StoredUser, newRole: 'admin' | 'player') => {
    if (targetUser.email.toLowerCase() === 'przemyslaw.chlus@gmail.com' && newRole !== 'admin') {
      showFeedback('error', 'Nie można odebrać uprawnień administratora głównemu Komisarzowi Ligi (przemyslaw.chlus@gmail.com).');
      return;
    }
    if (targetUser.id === currentUser?.id && newRole !== 'admin') {
      showFeedback('error', 'Nie możesz odebrać sobie uprawnień administratora.');
      return;
    }
    try {
      changeUserRole(targetUser.id, newRole);
      onRefreshUsers();
      showFeedback(
        'success',
        `Rola użytkownika ${targetUser.name} została zmieniona na: ${
          newRole === 'admin' ? 'Komisarz (Admin)' : 'Dżentelmen (Gracz)'
        }.`
      );
    } catch (err: unknown) {
      showFeedback('error', err instanceof Error ? err.message : 'Błąd podczas zmiany roli.');
    }
  };

  const generateSuggestedPassword = () => {
    const prefixes = ['Tenis', 'AsSerwis', 'GemSet', 'Wimbledon', 'Forehand', 'Smash', 'Roland'];
    const years = ['2026', '2027', '77', '99', '100'];
    const symbols = ['!', '#', '$', '*'];
    const p = prefixes[Math.floor(Math.random() * prefixes.length)];
    const y = years[Math.floor(Math.random() * years.length)];
    const s = symbols[Math.floor(Math.random() * symbols.length)];
    return `${p}${y}${s}`;
  };

  const openPasswordModal = (user: StoredUser) => {
    setPasswordModalUser(user);
    setNewPasswordInput(generateSuggestedPassword());
    setShowPassword(true);
    setPasswordSuccess(null);
    setCopiedPassword(false);
  };

  const handleSavePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordModalUser) return;
    if (newPasswordInput.trim().length < 6) {
      showFeedback('error', 'Nowe hasło musi zawierać co najmniej 6 znaków.');
      return;
    }
    try {
      changeUserPassword(passwordModalUser.id, newPasswordInput.trim());
      onRefreshUsers();
      setPasswordSuccess(newPasswordInput.trim());
      showFeedback(
        'success',
        `Hasło dla konta ${passwordModalUser.name} zostało pomyślnie zaktualizowane.`
      );
    } catch (err: unknown) {
      showFeedback('error', err instanceof Error ? err.message : 'Błąd podczas zmiany hasła.');
    }
  };

  const handleCopyPassword = () => {
    if (!newPasswordInput) return;
    navigator.clipboard.writeText(newPasswordInput);
    setCopiedPassword(true);
    setTimeout(() => setCopiedPassword(false), 2500);
  };

  const handleConfirmDelete = () => {
    if (!deleteModalUser) return;
    if (deleteModalUser.email.toLowerCase() === 'przemyslaw.chlus@gmail.com') {
      showFeedback('error', 'Nie można usunąć konta głównego Komisarza Ligi (przemyslaw.chlus@gmail.com).');
      setDeleteModalUser(null);
      return;
    }
    if (deleteModalUser.id === currentUser?.id) {
      showFeedback('error', 'Nie możesz usunąć własnego aktywnego konta administratora.');
      setDeleteModalUser(null);
      return;
    }
    try {
      deleteStoredUser(deleteModalUser.id);
      onRefreshUsers();
      showFeedback(
        'success',
        `Konto gracza ${deleteModalUser.name} zostało trwale usunięte z rejestru użytkowników.`
      );
      setDeleteModalUser(null);
    } catch (err: unknown) {
      showFeedback('error', err instanceof Error ? err.message : 'Błąd podczas usuwania konta.');
      setDeleteModalUser(null);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-7 shadow-sm border-2 border-amber-400/80 relative overflow-hidden">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-stone-200">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-amber-600" />
            <h3 className="font-black text-stone-900 text-base sm:text-xl">
              Panel Administratora: Zarządzanie Kontami Graczy
            </h3>
          </div>
          <p className="text-xs text-stone-500 mt-1 max-w-2xl">
            Pełna kontrola nad dostępem do ligi: akceptacja i weryfikacja nowych graczy, blokowanie kont,
            resetowanie haseł oraz przydzielanie uprawnień administratora.
          </p>
        </div>

        {/* Global summary pill counter and Add User button */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            id="admin-add-new-player-btn"
            onClick={() => setIsAddUserModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-black shadow-xs cursor-pointer transition-all border border-emerald-700 shrink-0"
          >
            <UserPlus className="w-3.5 h-3.5 text-lime-300" />
            <span>+ Dodaj nowego gracza</span>
          </button>
          <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-stone-100 text-stone-700 border border-stone-200">
            Razem: <strong>{usersList.length}</strong>
          </span>
          {pendingUsers.length > 0 && (
            <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 animate-pulse flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              {pendingUsers.length} czeka
            </span>
          )}
          {blockedUsers.length > 0 && (
            <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1.5">
              <Ban className="w-3.5 h-3.5" />
              {blockedUsers.length} zablokowanych
            </span>
          )}
        </div>
      </div>

      {/* Action feedback banner */}
      {feedbackMsg && (
        <div
          className={`mt-4 p-3.5 rounded-2xl text-xs font-bold border flex items-center gap-2.5 animate-in fade-in ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
              : 'bg-rose-50 border-rose-300 text-rose-900'
          }`}
        >
          {feedbackMsg.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{feedbackMsg.text}</span>
        </div>
      )}

      {/* PENDING APPROVALS SECTION (if any) */}
      {pendingUsers.length > 0 && (
        <div className="mt-5 bg-amber-50/70 border-2 border-amber-300 rounded-2xl p-4 sm:p-5">
          <div className="flex items-center justify-between pb-3 border-b border-amber-200/80 mb-3">
            <div className="flex items-center gap-2 text-amber-950 font-bold text-sm">
              <Clock className="w-4 h-4 text-amber-600 animate-spin" />
              <span>Oczekujące zgłoszenia do zatwierdzenia ({pendingUsers.length})</span>
            </div>
            <span className="text-[11px] text-amber-800">Wymagana decyzja Komisarza Ligi</span>
          </div>

          <div className="space-y-3">
            {pendingUsers.map((pending) => (
              <div
                key={pending.id}
                className="bg-white border border-amber-300/80 rounded-xl p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 w-full min-w-0"
              >
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-stone-900 text-sm break-words">{pending.name}</span>
                    {pending.nickname && (
                      <span className="text-xs text-amber-800 italic break-words">„{pending.nickname}”</span>
                    )}
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                      Nowe zgłoszenie
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-0.5 text-xs text-stone-600">
                    <div className="truncate">
                      <span className="text-stone-500 font-medium">E-mail:</span>{' '}
                      <span className="font-mono text-stone-800 break-all">{pending.email}</span>
                    </div>
                    <div>
                      <span className="text-stone-500 font-medium">Telefon:</span>{' '}
                      <span className="text-stone-800">{pending.phone || 'Brak'}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                  <button
                    type="button"
                    onClick={() => handleReject(pending)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-300 cursor-pointer"
                  >
                    <XCircle className="w-3.5 h-3.5 text-rose-600" />
                    <span>Odrzuć</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApprove(pending)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 border border-emerald-600 shadow-xs cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-lime-300" />
                    <span>Zatwierdź (Dodaj do ligi)</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* FILTER & SEARCH CONTROLS */}
      <div className="mt-6 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between w-full min-w-0">
        {/* Search input */}
        <div className="relative flex-1 max-w-md w-full">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Szukaj gracza po imieniu, e-mailu, telefonie..."
            className="w-full pl-9 pr-8 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 p-0.5 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs no-scrollbar overscroll-x-contain max-w-full">
          <button
            type="button"
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-colors shrink-0 cursor-pointer ${
              filterStatus === 'all'
                ? 'bg-stone-900 text-white'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            Wszyscy ({usersList.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus('players')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-colors shrink-0 cursor-pointer ${
              filterStatus === 'players'
                ? 'bg-emerald-800 text-white'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            Gracze ({playerUsers.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus('admins')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-colors shrink-0 cursor-pointer ${
              filterStatus === 'admins'
                ? 'bg-amber-600 text-white'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            Admini ({adminUsers.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus('blocked')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-colors shrink-0 cursor-pointer ${
              filterStatus === 'blocked'
                ? 'bg-rose-700 text-white'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            Zablokowani ({blockedUsers.length})
          </button>
          {pendingUsers.length > 0 && (
            <button
              type="button"
              onClick={() => setFilterStatus('pending')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-colors shrink-0 cursor-pointer ${
                filterStatus === 'pending'
                  ? 'bg-amber-500 text-white'
                  : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
              }`}
            >
              Oczekujący ({pendingUsers.length})
            </button>
          )}
        </div>
      </div>

      {/* ACCOUNTS LIST (RESPONSIVE CARDS & COMPACT VIEW) */}
      <div className="mt-4 space-y-2.5">
        {filteredUsers.length > 0 ? (
          filteredUsers.map((user) => {
            const isSelf = user.id === currentUser?.id;
            const isBlocked = user.status === 'blocked';
            const isPending = user.status === 'pending';
            const isRejected = user.status === 'rejected';
            const isAdmin = user.role === 'admin';

            return (
              <div
                key={user.id}
                className={`p-3.5 sm:p-4 rounded-2xl border transition-all ${
                  isBlocked
                    ? 'bg-rose-50/50 border-rose-200'
                    : isSelf
                    ? 'bg-amber-50/40 border-amber-300'
                    : 'bg-stone-50/70 hover:bg-stone-50 border-stone-200'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                  {/* User identity details */}
                  <div className="flex items-start gap-3 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 shadow-xs ${
                        isAdmin
                          ? 'bg-amber-500 text-white'
                          : isBlocked
                          ? 'bg-rose-600 text-white'
                          : 'bg-emerald-800 text-white'
                      }`}
                    >
                      {user.name.charAt(0)}
                    </div>

                    <div className="min-w-0 space-y-1 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-stone-900 text-sm">
                          {user.name}
                        </span>
                        {user.nickname && (
                          <span className="text-xs text-stone-500 italic">
                            „{user.nickname}”
                          </span>
                        )}
                        {isSelf && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 border border-amber-300">
                            To Ty (Twoje konto)
                          </span>
                        )}

                        {/* Role Badge */}
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${
                            isAdmin
                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                              : 'bg-stone-200 text-stone-700'
                          }`}
                        >
                          {isAdmin ? (
                            <>
                              <Shield className="w-3 h-3 text-amber-600" />
                              Komisarz (Admin)
                            </>
                          ) : (
                            'Dżentelmen (Gracz)'
                          )}
                        </span>

                        {/* Status Badge */}
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${
                            isBlocked
                              ? 'bg-rose-100 text-rose-800 border border-rose-300'
                              : isPending
                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                              : isRejected
                              ? 'bg-stone-200 text-stone-700'
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          }`}
                        >
                          {isBlocked ? (
                            <>
                              <Ban className="w-3 h-3 text-rose-600" />
                              Zablokowane (brak logowania)
                            </>
                          ) : isPending ? (
                            <>
                              <Clock className="w-3 h-3 text-amber-600" />
                              Oczekuje
                            </>
                          ) : isRejected ? (
                            'Odrzucone'
                          ) : (
                            <>
                              <Check className="w-3 h-3 text-emerald-600" />
                              Aktywne
                            </>
                          )}
                        </span>
                      </div>

                      {/* Contact metadata */}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-stone-500">
                        <span className="font-mono text-stone-700">
                          {user.email}
                        </span>
                        {user.phone && (
                          <span>
                            Tel: <strong className="text-stone-700">{user.phone}</strong>
                          </span>
                        )}
                        {user.preferredCourts && (
                          <span className="hidden sm:inline">
                            Korty: {user.preferredCourts}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* ADMIN ACTION TOOLBAR FOR THIS USER */}
                  <div className="flex flex-wrap items-center gap-1.5 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-stone-200">
                    {/* 1. Change Password Button */}
                    <button
                      type="button"
                      onClick={() => openPasswordModal(user)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-200 transition-colors cursor-pointer"
                      title="Zmień hasło dostępu dla tego gracza"
                    >
                      <KeyRound className="w-3.5 h-3.5 text-stone-500" />
                      <span>Hasło</span>
                    </button>

                    {/* 2. Change Role (Player <-> Admin) */}
                    <button
                      type="button"
                      disabled={isSelf}
                      onClick={() => handleChangeRole(user, isAdmin ? 'player' : 'admin')}
                      className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
                        isSelf
                          ? 'opacity-40 cursor-not-allowed bg-stone-100 text-stone-400 border-stone-200'
                          : isAdmin
                          ? 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-200 cursor-pointer'
                          : 'bg-stone-100 hover:bg-stone-200 text-stone-700 border-stone-200 cursor-pointer'
                      }`}
                      title={
                        isSelf
                          ? 'Nie możesz odebrać uprawnień samemu sobie'
                          : isAdmin
                          ? 'Zmień rolę na zwykłego gracza'
                          : 'Nadaj uprawnienia administratora (Komisarza Ligi)'
                      }
                    >
                      <Shield className="w-3.5 h-3.5 text-amber-600" />
                      <span>{isAdmin ? 'Zdejmij Admina' : 'Nadaj Admina'}</span>
                    </button>

                    {/* 3. Block / Unblock Account Button */}
                    {isBlocked ? (
                      <button
                        type="button"
                        onClick={() => handleUnblock(user)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 transition-colors cursor-pointer"
                        title="Odblokuj konto - przywróć możliwość logowania"
                      >
                        <Unlock className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Odblokuj</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={isSelf}
                        onClick={() => handleBlock(user)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
                          isSelf
                            ? 'opacity-40 cursor-not-allowed bg-stone-100 text-stone-400 border-stone-200'
                            : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200 cursor-pointer'
                        }`}
                        title={
                          isSelf
                            ? 'Nie możesz zablokować własnego konta'
                            : 'Zablokuj konto - gracz nie będzie mógł się zalogować'
                        }
                      >
                        <Ban className="w-3.5 h-3.5 text-rose-600" />
                        <span>Zablokuj</span>
                      </button>
                    )}

                    {/* 4. Delete Account Button */}
                    <button
                      type="button"
                      disabled={isSelf}
                      onClick={() => setDeleteModalUser(user)}
                      className={`p-1.5 rounded-xl border transition-colors ${
                        isSelf
                          ? 'opacity-30 cursor-not-allowed bg-stone-100 text-stone-400 border-stone-200'
                          : 'bg-white hover:bg-rose-50 text-stone-400 hover:text-rose-600 border-stone-200 hover:border-rose-300 cursor-pointer'
                      }`}
                      title={
                        isSelf
                          ? 'Nie możesz usunąć własnego konta'
                          : 'Usuń konto z rejestru użytkowników'
                      }
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-8 text-center bg-stone-50 rounded-2xl border border-dashed border-stone-200">
            <p className="text-xs text-stone-500 font-medium">
              Nie znaleziono kont spełniających kryteria wyszukiwania.
            </p>
          </div>
        )}
      </div>

      {/* MODAL: CHANGE PASSWORD */}
      {passwordModalUser && (
        <div className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-hidden">
          <div className="bg-white rounded-3xl shadow-2xl border border-stone-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 bg-gradient-to-r from-emerald-950 to-stone-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-400/20 flex items-center justify-center text-amber-300">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base">Zmiana Hasła Gracza</h3>
                  <p className="text-[11px] text-stone-300">
                    Ustaw nowe hasło dostępu dla konta
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPasswordModalUser(null)}
                className="p-1.5 rounded-full hover:bg-white/10 text-stone-300 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSavePassword} className="p-5 space-y-4 text-xs">
              {/* Target user information */}
              <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200 space-y-1">
                <div className="text-[10px] uppercase font-bold text-stone-400 tracking-wider">
                  Konto docelowe
                </div>
                <div className="font-bold text-stone-900 text-sm">
                  {passwordModalUser.name}
                </div>
                <div className="font-mono text-stone-600">
                  Login / E-mail: {passwordModalUser.email}
                </div>
              </div>

              {/* Password field with Show/Hide toggle and Generator */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-stone-700">Nowe hasło:</label>
                  <button
                    type="button"
                    onClick={() => {
                      const pass = generateSuggestedPassword();
                      setNewPasswordInput(pass);
                      setPasswordSuccess(null);
                    }}
                    className="inline-flex items-center gap-1 text-[11px] text-amber-700 hover:text-amber-800 font-bold hover:underline cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    Wygeneruj inne
                  </button>
                </div>

                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPasswordInput}
                    onChange={(e) => {
                      setNewPasswordInput(e.target.value);
                      setPasswordSuccess(null);
                    }}
                    placeholder="Wpisz nowe hasło (min. 6 znaków)..."
                    minLength={6}
                    className="w-full pl-3.5 pr-20 py-2.5 bg-stone-50 border border-stone-300 rounded-xl font-mono text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="p-1 text-stone-400 hover:text-stone-600 rounded cursor-pointer"
                      title={showPassword ? 'Ukryj hasło' : 'Pokaż hasło'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    <button
                      type="button"
                      onClick={handleCopyPassword}
                      className="p-1 text-stone-400 hover:text-emerald-700 rounded cursor-pointer"
                      title="Skopiuj hasło do schowka"
                    >
                      {copiedPassword ? (
                        <Check className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
                {copiedPassword && (
                  <p className="text-[11px] text-emerald-600 font-bold">
                    ✓ Skopiowano hasło do schowka!
                  </p>
                )}
              </div>

              {/* Success notification if saved */}
              {passwordSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-2xl text-emerald-900 space-y-1 animate-in fade-in">
                  <div className="flex items-center gap-1.5 font-bold text-xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Hasło zostało pomyślnie zmienione!</span>
                  </div>
                  <p className="text-[11px] text-stone-600">
                    Przekaż nowe hasło graczowi:{' '}
                    <strong className="font-mono text-stone-900 bg-white px-1.5 py-0.5 rounded border border-emerald-200">
                      {passwordSuccess}
                    </strong>
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setPasswordModalUser(null)}
                  className="px-4 py-2 rounded-xl text-stone-600 font-bold hover:bg-stone-100 transition-colors cursor-pointer"
                >
                  {passwordSuccess ? 'Zamknij' : 'Anuluj'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl font-bold text-white bg-emerald-800 hover:bg-emerald-900 shadow-sm transition-all cursor-pointer"
                >
                  Zapisz nowe hasło
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CONFIRM ACCOUNT DELETION */}
      {deleteModalUser && (
        <div className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-hidden">
          <div className="bg-white rounded-3xl shadow-2xl border border-stone-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 bg-rose-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center text-white">
                  <AlertTriangle className="w-5 h-5 text-rose-200" />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base">Usunięcie konta gracza</h3>
                  <p className="text-[11px] text-rose-200">Potwierdzenie operacji administracyjnej</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDeleteModalUser(null)}
                className="p-1.5 rounded-full hover:bg-white/10 text-rose-200 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <p className="text-stone-700">
                Czy na pewno chcesz trwale usunąć konto użytkownika{' '}
                <strong className="text-stone-900 font-bold">{deleteModalUser.name}</strong> (
                <span className="font-mono text-stone-600">{deleteModalUser.email}</span>)?
              </p>

              <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200 text-amber-900 space-y-1">
                <div className="font-bold text-xs flex items-center gap-1.5 text-amber-800">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>Konsekwencje usunięcia:</span>
                </div>
                <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-stone-600">
                  <li>Użytkownik straci możliwość logowania do aplikacji.</li>
                  <li>Wpisy meczowe i dotychczasowe punkty w tabeli ligowej pozostaną zachowane.</li>
                </ul>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setDeleteModalUser(null)}
                  className="px-4 py-2 rounded-xl text-stone-600 font-bold hover:bg-stone-100 transition-colors cursor-pointer"
                >
                  Anuluj
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  className="px-5 py-2 rounded-xl font-bold text-white bg-rose-700 hover:bg-rose-800 shadow-sm transition-all cursor-pointer"
                >
                  Tak, usuń konto
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Admin Add User / Player Modal */}
      {isAddUserModalOpen && (
        <AdminAddUserModal
          isOpen={isAddUserModalOpen}
          onClose={() => setIsAddUserModalOpen(false)}
          currentUser={currentUser || null}
          onPlayerCreated={(p) => {
            if (onPlayerCreated) onPlayerCreated(p);
            onRefreshUsers();
          }}
          onUserCreated={() => {
            onRefreshUsers();
          }}
        />
      )}
    </div>
  );
};
