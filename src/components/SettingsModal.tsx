import React, { useState, useEffect } from 'react';
import {
  Settings,
  Save,
  Download,
  Upload,
  RefreshCw,
  BookOpen,
  ShieldCheck,
  Check,
  UserCheck,
  LogOut,
  AlertTriangle,
  UserCog,
  ShieldAlert,
} from 'lucide-react';
import { LeagueSettings, User, Player } from '../types';
import { subscribeToUsers } from '../lib/firebase';
import { AdminAccountsManager } from './AdminAccountsManager';
import { AdminSystemLogsViewer } from './AdminSystemLogsViewer';
import { LgtDocsSection } from './LgtDocsSection';
import { forceAppRefresh, LOCAL_VERSION } from '../utils/versionCheck';

interface SettingsModalProps {
  settings: LeagueSettings;
  onSaveSettings: (settings: LeagueSettings) => void;
  onExportData: () => void;
  onImportData: (jsonData: string) => void;
  onResetData: () => void;
  currentUser?: User | null;
  onLogout?: () => void;
  onEditMyProfile?: () => void;
  onPlayerCreated?: (newPlayer: Player) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  onSaveSettings,
  onExportData,
  onImportData,
  onResetData,
  currentUser,
  onLogout,
  onEditMyProfile,
  onPlayerCreated,
}) => {
  const [formData, setFormData] = useState<LeagueSettings>(settings);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [usersList, setUsersList] = useState<User[]>([]);

  useEffect(() => {
    if (currentUser?.role === 'admin') {
      const unsub = subscribeToUsers((firestoreUsers) => {
        setUsersList([...firestoreUsers]);
      });
      return () => unsub();
    }
  }, [currentUser?.role]);

  const handleRefreshUsers = () => {
    // Real-time subscription in useEffect already keeps usersList synchronized with Firestore
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings(formData);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        onImportData(content);
        alert('Dane ligi zostały pomyślnie zaimportowane!');
      } catch (err) {
        alert('Błąd podczas odczytu pliku JSON.');
      }
    };
    reader.readAsText(file);
  };

  if (currentUser?.role !== 'admin') {
    return (
      <div className="max-w-md mx-auto my-12 p-8 bg-white rounded-3xl border border-stone-200 text-center shadow-sm">
        <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center">
          <ShieldAlert className="w-7 h-7" />
        </div>
        <h3 className="text-lg font-bold text-stone-900 mb-2">Dostęp ograniczony</h3>
        <p className="text-sm text-stone-500">
          Dostęp do konfiguracji i ustawień ligi przysługuje wyłącznie Komisarzowi Ligi z uprawnieniami administratora.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Current User Account Banner */}
      {currentUser && (
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-400 text-emerald-950 font-black text-lg flex items-center justify-center shadow-sm shrink-0">
              {currentUser.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-bold text-stone-900 text-base">{currentUser.name}</h4>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  {currentUser.role === 'admin' ? 'Komisarz Ligi' : 'Zweryfikowany Dżentelmen'}
                </span>
              </div>
              <p className="text-xs text-stone-500">{currentUser.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
            {onEditMyProfile && (
              <button
                onClick={onEditMyProfile}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
              >
                <UserCog className="w-3.5 h-3.5 text-lime-400" />
                <span>Edytuj moje dane</span>
              </button>
            )}

            {onLogout && (
              <button
                onClick={onLogout}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-stone-100 hover:bg-rose-50 text-stone-700 hover:text-rose-700 border border-stone-200 hover:border-rose-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Wyloguj</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Admin Accounts Management Hub */}
      {currentUser?.role === 'admin' && (
        <>
          <AdminAccountsManager
            currentUser={currentUser}
            usersList={usersList}
            onRefreshUsers={handleRefreshUsers}
            onPlayerCreated={onPlayerCreated}
          />

          <AdminSystemLogsViewer />
        </>
      )}


      {/* Rules Reference Card */}
      <div className="bg-gradient-to-br from-emerald-950 to-stone-900 text-white rounded-3xl p-6 shadow-md border border-emerald-800/80">
        <div className="flex items-center gap-2.5 text-lime-400 mb-3">
          <BookOpen className="w-5 h-5" />
          <h3 className="font-bold text-base uppercase tracking-wider">Regulamin i Zasady Rozgrywek</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-stone-300">
          <div className="space-y-2 bg-white/5 p-4 rounded-2xl border border-white/10">
            <h4 className="font-bold text-white text-sm">🎾 Format Meczów:</h4>
            <ul className="list-disc pl-4 space-y-1">
              <li>Mecz toczy się do <strong>2 wygranych setów</strong> (format best-of-3).</li>
              <li>Set wygrywa gracz, który pierwszy zdobędzie <strong>6 gemów</strong> z przewagą min. 2 gemów (np. 6:4, 6:3, 6:0).</li>
              <li>Przy stanie 5:5 gra toczy się do 7:5.</li>
              <li>Przy stanie 6:6 rozgrywany jest <strong>klasyczny Tie-break do 7 punktów</strong> (z przewagą min. 2 pkt). Wynik seta to 7:6.</li>
            </ul>
          </div>

          <div className="space-y-2 bg-white/5 p-4 rounded-2xl border border-white/10">
            <h4 className="font-bold text-white text-sm">⚡ Trzeci set i punktacja:</h4>
            <ul className="list-disc pl-4 space-y-1">
              <li>W przypadku stanu 1:1 w setach, gracze mogą rozegrać pełny set lub <strong>Super Tie-break (do 10 punktów)</strong> dla oszczędności czasu rezerwacji kortu.</li>
              <li>Wygrana 2:0 = <strong>{settings.points2_0} pkt</strong> do tabeli</li>
              <li>Wygrana 2:1 = <strong>{settings.points2_1} pkt</strong> do tabeli</li>
              <li>Porażka 1:2 = <strong>{settings.points1_2} pkt</strong> (bonus za wywalczonego seta)</li>
              <li>Porażka 0:2 = <strong>{settings.points0_2} pkt</strong></li>
            </ul>
          </div>
        </div>
      </div>

      {/* Settings Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 shadow-sm border border-stone-200 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-stone-200">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-stone-900 text-base">Ustawienia Ligi</h3>
              <p className="text-xs text-stone-500">Konfiguracja nazwy rozgrywek i sposobu naliczania punktów</p>
            </div>
          </div>

          {savedSuccess && (
            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              <Check className="w-3.5 h-3.5" />
              Zapisano zmiany!
            </span>
          )}
        </div>

        {/* League & Season Names */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1.5">
              Nazwa Ligi
            </label>
            <input
              type="text"
              value={formData.leagueName}
              onChange={(e) => setFormData({ ...formData, leagueName: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-stone-300 text-sm font-semibold focus:ring-2 focus:ring-emerald-600 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1.5">
              Aktualny Sezon / Runda
            </label>
            <input
              type="text"
              value={formData.season}
              onChange={(e) => setFormData({ ...formData, season: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-stone-300 text-sm font-semibold focus:ring-2 focus:ring-emerald-600 focus:outline-none"
              required
            />
          </div>
        </div>

        {/* Point System Configuration */}
        <div>
          <label className="block text-xs font-bold text-stone-700 mb-2">
            System punktacji w tabeli ligowej
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200">
              <span className="block text-[11px] font-bold text-stone-600 mb-1">Wygrana 2:0</span>
              <input
                type="number"
                min={0}
                max={10}
                value={formData.points2_0}
                onChange={(e) => setFormData({ ...formData, points2_0: parseInt(e.target.value) || 0 })}
                className="w-full p-2 text-center font-black text-lg bg-white rounded-xl border border-stone-300"
              />
              <span className="block text-[10px] text-stone-400 mt-1 text-center">pkt</span>
            </div>

            <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200">
              <span className="block text-[11px] font-bold text-stone-600 mb-1">Wygrana 2:1</span>
              <input
                type="number"
                min={0}
                max={10}
                value={formData.points2_1}
                onChange={(e) => setFormData({ ...formData, points2_1: parseInt(e.target.value) || 0 })}
                className="w-full p-2 text-center font-black text-lg bg-white rounded-xl border border-stone-300"
              />
              <span className="block text-[10px] text-stone-400 mt-1 text-center">pkt</span>
            </div>

            <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200">
              <span className="block text-[11px] font-bold text-stone-600 mb-1">Porażka 1:2</span>
              <input
                type="number"
                min={0}
                max={10}
                value={formData.points1_2}
                onChange={(e) => setFormData({ ...formData, points1_2: parseInt(e.target.value) || 0 })}
                className="w-full p-2 text-center font-black text-lg bg-white rounded-xl border border-stone-300"
              />
              <span className="block text-[10px] text-stone-400 mt-1 text-center">pkt</span>
            </div>

            <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200">
              <span className="block text-[11px] font-bold text-stone-600 mb-1">Porażka 0:2</span>
              <input
                type="number"
                min={0}
                max={10}
                value={formData.points0_2}
                onChange={(e) => setFormData({ ...formData, points0_2: parseInt(e.target.value) || 0 })}
                className="w-full p-2 text-center font-black text-lg bg-white rounded-xl border border-stone-300"
              />
              <span className="block text-[10px] text-stone-400 mt-1 text-center">pkt</span>
            </div>
          </div>
        </div>

        {/* Super Tie-Break preference */}
        <div className="flex items-center justify-between p-4 bg-stone-50 rounded-2xl border border-stone-200">
          <div>
            <h4 className="text-sm font-bold text-stone-800">Domyślny Super Tie-break w 3. secie</h4>
            <p className="text-xs text-stone-500">
              Przy remisie 1:1 formularz domyślnie sugeruje tie-break do 10 punktów (tzw. Champion's Tiebreak).
            </p>
          </div>
          <input
            type="checkbox"
            checked={formData.superTiebreakDecider}
            onChange={(e) => setFormData({ ...formData, superTiebreakDecider: e.target.checked })}
            className="w-5 h-5 accent-emerald-700 cursor-pointer rounded"
          />
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-800 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-colors shadow-xs cursor-pointer"
          >
            <Save className="w-4 h-4 text-lime-400" />
            <span>Zapisz ustawienia</span>
          </button>
        </div>
      </form>

      {/* Backup & Data Management */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-stone-200 space-y-4">
        <div>
          <h3 className="font-bold text-stone-900 text-base">Zarządzanie Danymi i Kopia Zapasowa</h3>
          <p className="text-xs text-stone-500">
            Aplikacja zapisuje wszystkie dane bezpośrednio w przeglądarce (offline/PWA). Możesz pobrać plik kopii zapasowej lub przenieść go na inne urządzenie.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            onClick={onExportData}
            className="inline-flex items-center gap-2 px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4 text-emerald-700" />
            <span>Eksportuj dane do pliku JSON</span>
          </button>

          <label className="inline-flex items-center gap-2 px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-bold transition-colors cursor-pointer">
            <Upload className="w-4 h-4 text-emerald-700" />
            <span>Importuj dane z pliku JSON</span>
            <input
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>

          {confirmReset ? (
            <div className="flex items-center gap-2 ml-auto">
              <button
                onClick={() => {
                  setConfirmReset(false);
                  onResetData();
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Tak, wyczyść bazę na nowy sezon</span>
              </button>
              <button
                onClick={() => setConfirmReset(false)}
                className="px-2.5 py-2 text-stone-500 hover:text-stone-800 text-xs font-semibold cursor-pointer"
              >
                Anuluj
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmReset(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold transition-colors cursor-pointer ml-auto"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Wyczyść bazę na nowy sezon</span>
            </button>
          )}
        </div>
      </div>

      {/* Wersja Aplikacji i Wymuszenie Odświeżenia (Cache Busting) */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-stone-200 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="font-bold text-stone-900 text-base">Wersja Aplikacji i Pamięć Podręczna</h3>
            <p className="text-xs text-stone-500 mt-0.5">
              Aktywna wersja kompilacji: <span className="font-mono text-emerald-800 font-bold">{LOCAL_VERSION}</span>
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold rounded-xl">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Weryfikacja PWA Online
          </span>
        </div>

        <p className="text-xs text-stone-600 leading-relaxed">
          Aplikacja używa mechanizmu Service Worker do pracy w trybie offline i błyskawicznego ładowania. Jeśli po wdrożeniu nowej wersji na telefonie lub w przeglądarce widzisz stare dane albo brak zmian z aktualizacji, użyj poniższego przycisku, aby całkowicie wyczyścić lokalne bufory pamięci podręcznej i natychmiast załadować najnowszy kod.
        </p>

        <div className="pt-1">
          <button
            onClick={() => forceAppRefresh(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Wymuś natychmiastowe odświeżenie i wyczyść pamięć podręczną</span>
          </button>
        </div>
      </div>

      {/* LGT-Docs Documentation & Specification Section */}
      <LgtDocsSection />
    </div>
  );
};
