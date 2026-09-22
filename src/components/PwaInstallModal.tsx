import React from 'react';
import { X, Download, Share, PlusSquare, Smartphone, CheckCircle2 } from 'lucide-react';

interface PwaInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPromptInstall?: () => void;
  canDirectInstall: boolean;
}

export const PwaInstallModal: React.FC<PwaInstallModalProps> = ({
  isOpen,
  onClose,
  onPromptInstall,
  canDirectInstall,
}) => {
  if (!isOpen) return null;

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as unknown as { MSStream?: unknown }).MSStream;

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-hidden">
      <div className="bg-white rounded-3xl shadow-2xl border border-stone-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="p-5 bg-gradient-to-r from-emerald-950 to-emerald-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-lime-400 text-emerald-950 flex items-center justify-center font-bold">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base">Zainstaluj aplikację na telefonie</h2>
              <p className="text-xs text-emerald-300">Dostęp offline i wygoda na korcie</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-emerald-300 hover:text-white rounded-lg hover:bg-emerald-800/80 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4 text-sm text-stone-700">
          <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs text-emerald-900">
            <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
            <span>
              Aplikacja PWA działa jak natywna aplikacja w telefonie — bez paska przeglądarki i z natychmiastowym ładowaniem.
            </span>
          </div>

          {canDirectInstall && onPromptInstall ? (
            <div className="text-center py-2 space-y-3">
              <p className="text-xs text-stone-600">
                Twoja przeglądarka obsługuje bezpośrednią instalację jednym kliknięciem:
              </p>
              <button
                onClick={() => {
                  onPromptInstall();
                  onClose();
                }}
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-lime-400 to-lime-500 hover:from-lime-300 hover:to-lime-400 text-emerald-950 font-black rounded-2xl text-sm shadow-md cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Zainstaluj teraz na urządzeniu</span>
              </button>
            </div>
          ) : isIOS ? (
            <div className="space-y-3">
              <h4 className="font-bold text-stone-900 text-xs uppercase tracking-wider text-emerald-800">
                Instrukcja dla iPhone / iPad (Safari):
              </h4>
              <ol className="space-y-2.5 text-xs text-stone-600">
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center shrink-0">
                    1
                  </span>
                  <span>W Safari kliknij ikonę <strong>Udostępnij</strong> (<Share className="w-3.5 h-3.5 inline text-blue-600" />) na dolnym pasku.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center shrink-0">
                    2
                  </span>
                  <span>Przewiń w dół i wybierz opcję <strong>„Do ekranu początkowego”</strong> (<PlusSquare className="w-3.5 h-3.5 inline text-stone-700" />).</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center shrink-0">
                    3
                  </span>
                  <span>Kliknij <strong>„Dodaj”</strong> w prawym górnym rogu. Ikona ligi pojawi się na pulpicie!</span>
                </li>
              </ol>
            </div>
          ) : (
            <div className="space-y-3">
              <h4 className="font-bold text-stone-900 text-xs uppercase tracking-wider text-emerald-800">
                Instrukcja instalacji (Android / Chrome / Edge):
              </h4>
              <ol className="space-y-2.5 text-xs text-stone-600">
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center shrink-0">
                    1
                  </span>
                  <span>Kliknij menu z trzema kropkami <strong>(⋮)</strong> w prawym górnym rogu przeglądarki.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center shrink-0">
                    2
                  </span>
                  <span>Wybierz <strong>„Zainstaluj aplikację”</strong> lub <strong>„Dodaj do ekranu głównego”</strong>.</span>
                </li>
              </ol>
            </div>
          )}

          <div className="pt-2 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
            >
              Rozumiem
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
