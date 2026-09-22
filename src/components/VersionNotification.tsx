import React, { useState, useEffect } from 'react';
import { RefreshCw, Sparkles, X } from 'lucide-react';
import { checkServerVersion, forceAppRefresh, LOCAL_VERSION } from '../utils/versionCheck';

export const VersionNotification: React.FC = () => {
  const [hasUpdate, setHasUpdate] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const performCheck = async () => {
      const result = await checkServerVersion();
      if (isMounted && result.hasUpdate) {
        setHasUpdate(true);
      }
    };

    // 1. Initial check after 3 seconds
    const initialTimer = setTimeout(performCheck, 3000);

    // 2. Periodic check every 60 seconds
    const interval = setInterval(performCheck, 60 * 1000);

    // 3. Check when user returns to the tab/app
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        performCheck();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      isMounted = false;
      clearTimeout(initialTimer);
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  if (!hasUpdate || dismissed) return null;

  const handleUpdateClick = async () => {
    setIsUpdating(true);
    await forceAppRefresh(true);
  };

  return (
    <div
      id="version-update-banner"
      className="fixed bottom-20 sm:bottom-6 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-md bg-stone-900/95 text-white p-3.5 sm:p-4 rounded-2xl shadow-2xl backdrop-blur-md border border-emerald-500/40 flex items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-5 duration-300"
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-9 h-9 rounded-xl bg-emerald-700/80 flex items-center justify-center shrink-0 text-lime-300">
          <Sparkles className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-bold text-white tracking-wide truncate">
            Dostępna nowa wersja Ligi
          </p>
          <p className="text-[11px] text-stone-300 truncate">
            Wdrożono aktualizację. Kliknij, aby odświeżyć.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        <button
          id="btn-confirm-version-update"
          onClick={handleUpdateClick}
          disabled={isUpdating}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isUpdating ? 'animate-spin' : ''}`} />
          <span>{isUpdating ? 'Odświeżanie...' : 'Odśwież'}</span>
        </button>

        <button
          id="btn-dismiss-version-update"
          onClick={() => setDismissed(true)}
          title="Odłóż na później"
          className="p-1.5 text-stone-400 hover:text-white rounded-lg transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
