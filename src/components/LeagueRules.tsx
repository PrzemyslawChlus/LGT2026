import React from 'react';
import {
  BookOpen,
  Trophy,
  Zap,
  Award,
  Calendar,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Flame,
  Settings,
  ArrowRight,
} from 'lucide-react';
import { LeagueSettings, User } from '../types';

interface LeagueRulesProps {
  settings: LeagueSettings;
  currentUser: User | null;
  onGoToSettings?: () => void;
}

export const LeagueRules: React.FC<LeagueRulesProps> = ({
  settings,
  currentUser,
  onGoToSettings,
}) => {
  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-10">
      {/* Hero Header Card */}
      <div className="relative overflow-hidden bg-gradient-to-br from-emerald-950 via-emerald-900 to-stone-900 text-white rounded-3xl p-6 sm:p-8 shadow-md border border-emerald-800/80">
        <div className="absolute top-0 right-0 -mr-12 -mt-12 w-64 h-64 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-lime-400/20 text-lime-300 border border-lime-400/30 text-xs font-bold mb-4">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Oficjalny Regulamin • {settings.season}</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-display mb-2">
            Regulamin Rozgrywek: {settings.leagueName}
          </h2>
          <p className="text-emerald-200/90 text-sm sm:text-base max-w-2xl leading-relaxed">
            Zasady rywalizacji, formaty setów, system naliczania punktów oraz etykieta dżentelmenów obowiązujące w trwającym sezonie.
          </p>

          {currentUser?.role === 'admin' && onGoToSettings && (
            <div className="mt-5 pt-5 border-t border-white/10 flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2 text-xs text-stone-300">
                <span className="w-2 h-2 rounded-full bg-lime-400 animate-pulse" />
                <span>Jesteś zalogowany jako <strong>Komisarz Ligi</strong>.</span>
              </div>
              <button
                type="button"
                onClick={onGoToSettings}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-lime-400 hover:bg-lime-300 text-emerald-950 font-bold text-xs transition-colors cursor-pointer"
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Zarządzaj ustawieniami ligi</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Grid of Key Rule Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* 1. Format Meczów */}
        <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold shrink-0">
                <Trophy className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-stone-900 text-base">Format Meczów</h3>
                <p className="text-xs text-stone-500">Struktura setów i zasady wyłaniania zwycięzcy</p>
              </div>
            </div>

            <ul className="space-y-2.5 text-xs sm:text-sm text-stone-700">
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  Mecz toczy się do <strong>2 wygranych setów</strong> (format best-of-3).
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  Set wygrywa gracz, który jako pierwszy osiągnie <strong>6 gemów</strong> z przewagą minimum 2 gemów (np. 6:4, 6:2, 6:0).
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  Przy stanie <strong>5:5</strong> gra toczy się do 7 wygranych gemów (np. 7:5).
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  Przy stanie <strong>6:6</strong> rozgrywany jest <strong>klasyczny Tie-break do 7 punktów</strong> (z wymaganą przewagą min. 2 punktów). Wynik wpisywany jest jako 7:6.
                </span>
              </li>
            </ul>
          </div>

          <div className="mt-4 p-3 bg-stone-50 rounded-2xl border border-stone-200 text-xs text-stone-600">
            💡 <strong>Wskazówka:</strong> W formularzu wpisywania wyniku tie-break podaje się w nawiasie (np. 7:6(4)).
          </div>
        </div>

        {/* 2. Punktacja Ligowa */}
        <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-900 flex items-center justify-center font-bold shrink-0">
                <Zap className="w-5 h-5 text-amber-700" />
              </div>
              <div>
                <h3 className="font-extrabold text-stone-900 text-base">Punktacja w Tabeli</h3>
                <p className="text-xs text-stone-500">Podział punktów za wyniki meczu</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5 mb-4">
              <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200">
                <div className="text-[10px] uppercase font-bold text-emerald-700 tracking-wider">Wygrana 2:0</div>
                <div className="text-xl font-black text-emerald-950 mt-0.5">{settings.points2_0} pkt</div>
                <div className="text-[11px] text-emerald-700 mt-0.5">Komplet punktów</div>
              </div>

              <div className="p-3 bg-lime-50 rounded-2xl border border-lime-200">
                <div className="text-[10px] uppercase font-bold text-lime-800 tracking-wider">Wygrana 2:1</div>
                <div className="text-xl font-black text-lime-950 mt-0.5">{settings.points2_1} pkt</div>
                <div className="text-[11px] text-lime-800 mt-0.5">Zwycięstwo po 3 setach</div>
              </div>

              <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200">
                <div className="text-[10px] uppercase font-bold text-amber-800 tracking-wider">Porażka 1:2</div>
                <div className="text-xl font-black text-amber-950 mt-0.5">{settings.points1_2} pkt</div>
                <div className="text-[11px] text-amber-800 mt-0.5">Bonus za urwanego seta</div>
              </div>

              <div className="p-3 bg-stone-100 rounded-2xl border border-stone-200">
                <div className="text-[10px] uppercase font-bold text-stone-600 tracking-wider">Porażka 0:2</div>
                <div className="text-xl font-black text-stone-800 mt-0.5">{settings.points0_2} pkt</div>
                <div className="text-[11px] text-stone-500 mt-0.5">Brak punktów</div>
              </div>
            </div>

            <div className="text-xs text-stone-600 space-y-1.5">
              <p>
                ⚡ <strong>Decydujący 3. set (Super Tie-break):</strong> Przy stanie 1:1 w setach, gracze ze względu na limit czasu rezerwacji kortu mogą rozegrać <strong>Super Tie-break do 10 punktów</strong> (z przewagą min. 2 pkt).
              </p>
            </div>
          </div>

          <div className="mt-4 p-3 bg-amber-50/80 rounded-2xl border border-amber-200 text-xs text-amber-900">
            🔥 Każdy ugrany set ma znaczenie — porażka 1:2 daje cenny punkt do tabeli generalnej!
          </div>
        </div>

        {/* 3. Kolejność w Tabeli */}
        <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-800 flex items-center justify-center font-bold shrink-0">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-stone-900 text-base">Kolejność w Tabeli (Kryteria)</h3>
              <p className="text-xs text-stone-500">Hierarchia rozstrzygania remisów punktowych</p>
            </div>
          </div>

          <ol className="space-y-2 text-xs sm:text-sm text-stone-700 list-decimal pl-5">
            <li>
              <strong>Liczba punktów ligowych</strong> (główne kryterium).
            </li>
            <li>
              <strong>Bilans setów</strong> (wygrane sety minus przegrane sety).
            </li>
            <li>
              <strong>Bilans gemów</strong> (wygrane gemy minus przegrane gemy).
            </li>
            <li>
              <strong>Bezpośredni pojedynek (H2H)</strong> pomiędzy zainteresowanymi zawodnikami.
            </li>
            <li>
              <strong>Większa liczba rozegranych meczów</strong> (premiowanie aktywności w sezonie).
            </li>
          </ol>
        </div>

        {/* 4. Umawianie i Wprowadzanie Wyników */}
        <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-2xl bg-teal-100 text-teal-800 flex items-center justify-center font-bold shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-stone-900 text-base">Umawianie i Raportowanie</h3>
              <p className="text-xs text-stone-500">Komunikacja, rezerwacje i wpis wyników</p>
            </div>
          </div>

          <ul className="space-y-2.5 text-xs sm:text-sm text-stone-700">
            <li className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
              <span>
                <strong>Umawianie meczu:</strong> Skorzystaj z zakładki <em>„Kto z kim”</em> lub <em>„Gracze”</em>, aby jednym kliknięciem napisać na WhatsApp lub zadzwonić do rywala.
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
              <span>
                <strong>Zaraz po zejściu z kortu:</strong> Dowolny z graczy wprowadza wynik w aplikacji przyciskiem <em>„Wpisz wynik” (+)</em>.
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
              <span>
                <strong>Synchronizacja na żywo:</strong> Wynik zostaje natychmiast zapisany w chmurze Firestore i odświeża tabelę u wszystkich dżentelmenów.
              </span>
            </li>
          </ul>
        </div>
      </div>

      {/* 5. Zasada Rewanżów i Odstępu 2 Miesięcy (Nowa reguła) */}
      <div className="bg-gradient-to-br from-amber-50 to-orange-50/50 rounded-3xl p-6 border-2 border-amber-300 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-amber-200 text-amber-950 flex items-center justify-center font-black shrink-0 shadow-xs">
            <Calendar className="w-5 h-5 text-amber-900" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-amber-200 text-amber-950 text-[10px] font-black uppercase tracking-wider mb-0.5">
              Reguła Sezonu
            </div>
            <h3 className="font-extrabold text-stone-900 text-base sm:text-lg">
              Rewanże i Odstęp 2 Miesięcy Kalendarzowych
            </h3>
            <p className="text-xs text-stone-600">Zasady rozgrywania ponownych meczów z tym samym rywalem</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs sm:text-sm text-stone-800">
          <div className="bg-white/80 backdrop-blur-xs p-4 rounded-2xl border border-amber-200 flex flex-col justify-between">
            <div>
              <div className="font-extrabold text-amber-950 flex items-center gap-1.5 mb-1.5">
                <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center text-xs font-black shrink-0">1</span>
                <span>Więcej niż 1 mecz z rywalem</span>
              </div>
              <p className="text-stone-600 text-xs leading-relaxed">
                Dopuszczone jest rozegranie więcej niż jednego pojedynku z tym samym przeciwnikiem w trakcie całego sezonu ligowego.
              </p>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-xs p-4 rounded-2xl border border-amber-200 flex flex-col justify-between">
            <div>
              <div className="font-extrabold text-amber-950 flex items-center gap-1.5 mb-1.5">
                <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center text-xs font-black shrink-0">2</span>
                <span>Min. 2 miesiące kalendarzowe</span>
              </div>
              <p className="text-stone-600 text-xs leading-relaxed">
                Od poprzedniego meczu muszą minąć minimum <strong>2 miesiące kalendarzowe</strong>, aby system przepuścił mecz jako ligowy i <strong>zaliczył punkty do tabeli</strong>.
              </p>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-xs p-4 rounded-2xl border border-amber-200 flex flex-col justify-between">
            <div>
              <div className="font-extrabold text-amber-950 flex items-center gap-1.5 mb-1.5">
                <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center text-xs font-black shrink-0">3</span>
                <span>Mecz Towarzyski (przed 2 mc)</span>
              </div>
              <p className="text-stone-600 text-xs leading-relaxed">
                Jeśli 2 miesiące nie minęły, mecz zostaje automatycznie oznaczony etykietą <strong>„Towarzyski”</strong> — wprowadzający otrzymuje komunikat, a punkty ligowe nie są naliczane.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 6. Gentleman's Code */}
      <div className="bg-stone-900 text-white rounded-3xl p-6 sm:p-7 border border-stone-800 shadow-sm">
        <div className="flex items-center gap-3 mb-3 text-amber-400">
          <ShieldCheck className="w-6 h-6" />
          <h3 className="text-base sm:text-lg font-bold">Gentleman's Code — Etykieta na Korcie</h3>
        </div>
        <p className="text-xs sm:text-sm text-stone-300 leading-relaxed mb-4">
          Liga Gentlemanów Tenisa to nie tylko rywalizacja sportowa, ale przede wszystkim kultura gry, wzajemny szacunek i radość ze wspólnego czasu na korcie.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-stone-300">
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
            <div className="font-bold text-white mb-1">🎯 Wywoływanie autów</div>
            <div>Każdy zawodnik ocenia ślady i auty po swojej stronie kortu. W razie uzasadnionej wątpliwości punkt jest natychmiast powtarzany.</div>
          </div>
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
            <div className="font-bold text-white mb-1">🤝 Punktualność i koszty</div>
            <div>Dżentelmeni zjawiają się na korcie 5 minut przed czasem. Koszt rezerwacji kortu oraz nowe piłki dzielone są po połowie.</div>
          </div>
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
            <div className="font-bold text-white mb-1">🎾 Uścisk dłoni</div>
            <div>Niezależnie od wyniku i emocji, mecz zawsze kończy się serdecznym uściskiem dłoni przy siatce i podziękowaniem za grę.</div>
          </div>
        </div>
      </div>
    </div>
  );
};
