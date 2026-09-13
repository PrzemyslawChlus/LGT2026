import React, { useState } from 'react';
import {
  FileText,
  Download,
  Copy,
  Check,
  Eye,
  ExternalLink,
  FolderArchive,
  BookOpen,
  Terminal,
  ShieldCheck,
  ChevronRight,
  X,
} from 'lucide-react';
import { LGT_DOCS, DocFile, downloadDocFile, downloadAllDocs } from '../data/docsContent';

export const LgtDocsSection: React.FC = () => {
  const [selectedDoc, setSelectedDoc] = useState<DocFile | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [downloadAllSuccess, setDownloadAllSuccess] = useState(false);

  const handleCopy = (doc: DocFile) => {
    navigator.clipboard.writeText(doc.content).then(() => {
      setCopiedId(doc.id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const handleDownloadAll = () => {
    downloadAllDocs();
    setDownloadAllSuccess(true);
    setTimeout(() => setDownloadAllSuccess(false), 3000);
  };

  return (
    <div className="bg-white rounded-2xl p-5 sm:p-6 border border-stone-200 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200">
        <div className="flex items-start gap-3">
          <div className="p-2.5 bg-emerald-100 text-emerald-800 rounded-xl shrink-0 mt-0.5">
            <FolderArchive className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-display font-bold text-lg text-stone-900 flex items-center gap-2">
              <span>Dokumentacja i Specyfikacja (LGT-Docs)</span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                Lokalizacja: /LGT-Docs/
              </span>
            </h3>
            <p className="text-xs text-stone-500 mt-1">
              Kompletne pliki dokumentacji technicznej, specyfikacja odtworzenia projektu od zera oraz zestaw testów automatycznych.
            </p>
          </div>
        </div>

        <button
          onClick={handleDownloadAll}
          className="inline-flex items-center justify-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white shadow-xs transition-colors cursor-pointer shrink-0"
          title="Pobierz wszystkie pliki markdown na swój komputer"
        >
          {downloadAllSuccess ? (
            <>
              <Check className="w-3.5 h-3.5 text-lime-400" />
              <span>Pobrano pliki!</span>
            </>
          ) : (
            <>
              <Download className="w-3.5 h-3.5 text-lime-400" />
              <span>Pobierz cały pakiet (.md)</span>
            </>
          )}
        </button>
      </div>

      {/* Info Guide Box: Gdzie są pliki i jak je zgrać */}
      <div className="bg-stone-50 rounded-xl p-4 border border-stone-200 text-xs space-y-2.5 text-stone-700">
        <div className="font-bold text-stone-900 flex items-center gap-2 text-sm">
          <BookOpen className="w-4 h-4 text-emerald-700" />
          <span>Gdzie znajdują się te pliki?</span>
        </div>
        <ul className="list-disc pl-5 space-y-1.5 text-stone-600">
          <li>
            <strong className="text-stone-800">W repozytorium projektu:</strong> Wszystkie pliki zostały utworzone w folderze <code className="bg-stone-200/80 px-1.5 py-0.5 rounded font-mono text-emerald-950">/LGT-Docs/</code> w głównym katalogu aplikacji.
          </li>
          <li>
            <strong className="text-stone-800">W Google AI Studio:</strong> W lewym panelu bocznym przejdź do widoku plików projektu (<span className="font-semibold">Code / Pliki</span>), gdzie widoczny jest folder <code className="bg-stone-200/80 px-1.5 py-0.5 rounded font-mono">LGT-Docs</code>.
          </li>
          <li>
            <strong className="text-stone-800">Pobranie na Dysk Google:</strong> Możesz pobrać pliki jednym kliknięciem poniżej (przycisk <span className="font-semibold">Pobierz .md</span>) i wrzucić je bezpośrednio do swojego folderu <span className="font-semibold">LGT-Docs</span> na Dysku Google, lub wyeksportować cały projekt jako ZIP w menu Settings.
          </li>
        </ul>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {LGT_DOCS.map((doc) => (
          <div
            key={doc.id}
            className="p-4 rounded-xl border border-stone-200 hover:border-emerald-700/40 bg-white hover:bg-stone-50/50 transition-all flex flex-col justify-between gap-3 shadow-2xs"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                  {doc.badge}
                </span>
                <span className="font-mono text-[11px] text-stone-600">
                  {doc.filename}
                </span>
              </div>
              <h4 className="font-bold text-sm text-stone-900">{doc.title}</h4>
              <p className="text-xs text-stone-500 mt-1 line-clamp-2">
                {doc.description}
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-stone-100">
              <button
                onClick={() => setSelectedDoc(doc)}
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-stone-100 hover:bg-emerald-50 hover:text-emerald-900 text-stone-700 transition-colors cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5 text-emerald-700" />
                <span>Podgląd</span>
              </button>

              <button
                onClick={() => handleCopy(doc)}
                className="inline-flex items-center justify-center p-1.5 text-xs font-semibold rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors cursor-pointer"
                title="Kopiuj treść do schowka"
              >
                {copiedId === doc.id ? (
                  <Check className="w-4 h-4 text-emerald-600" />
                ) : (
                  <Copy className="w-4 h-4 text-stone-500" />
                )}
              </button>

              <button
                onClick={() => downloadDocFile(doc.filename, doc.content)}
                className="inline-flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-bold rounded-lg bg-emerald-900 hover:bg-emerald-800 text-white transition-colors cursor-pointer"
                title={`Pobierz ${doc.filename}`}
              >
                <Download className="w-3.5 h-3.5 text-lime-400" />
                <span>Pobierz</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Reader Modal */}
      {selectedDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl border border-stone-200 overflow-hidden">
            {/* Modal Top Bar */}
            <div className="p-4 sm:px-6 bg-emerald-950 text-white flex items-center justify-between gap-3 shrink-0">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-900 text-emerald-200 border border-emerald-800">
                    /LGT-Docs/{selectedDoc.filename}
                  </span>
                </div>
                <h3 className="font-bold text-base sm:text-lg text-white truncate mt-1">
                  {selectedDoc.title}
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCopy(selectedDoc)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-emerald-900/80 hover:bg-emerald-800 text-stone-200 border border-emerald-800 cursor-pointer"
                >
                  {copiedId === selectedDoc.id ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-lime-400" />
                      <span>Skopiowano</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-stone-300" />
                      <span>Kopiuj</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => downloadDocFile(selectedDoc.filename, selectedDoc.content)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-lime-400 hover:bg-lime-300 text-emerald-950 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-950" />
                  <span>Pobierz .md</span>
                </button>

                <button
                  onClick={() => setSelectedDoc(null)}
                  className="p-1.5 rounded-xl hover:bg-emerald-900 text-stone-300 hover:text-white cursor-pointer ml-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body: Document Content */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1 font-mono text-xs text-stone-800 bg-stone-50 leading-relaxed whitespace-pre-wrap select-text">
              {selectedDoc.content}
            </div>

            {/* Modal Footer */}
            <div className="p-3 sm:px-6 bg-white border-t border-stone-200 flex items-center justify-between text-xs text-stone-500">
              <span>LGT 2026 Documentation Engine</span>
              <button
                onClick={() => setSelectedDoc(null)}
                className="px-4 py-1.5 font-bold rounded-xl bg-stone-200 hover:bg-stone-300 text-stone-800 cursor-pointer"
              >
                Zamknij
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
