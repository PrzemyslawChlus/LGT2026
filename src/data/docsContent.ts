import docsChangelog from '../../LGT-Docs/CHANGELOG.md?raw';
import docsApp from '../../LGT-Docs/DOKUMENTACJA_APLIKACJI.md?raw';
import docsSpec from '../../LGT-Docs/SPECYFIKACJA_ODTWORZENIA_PROJEKTU.md?raw';
import docsTests from '../../LGT-Docs/TESTY_AUTOMATYCZNE_PO_DEPLOYU.md?raw';
import docsReadme from '../../LGT-Docs/README.md?raw';

export interface DocFile {
  id: string;
  title: string;
  filename: string;
  description: string;
  badge: string;
  content: string;
}

export const LGT_DOCS: DocFile[] = [
  {
    id: 'changelog',
    title: 'Dziennik Zmian (Changelog)',
    filename: 'CHANGELOG.md',
    description: 'Chronologiczny rejestr wydań, nowych funkcji, poprawek i ulepszeń systemu LGT 2026.',
    badge: 'v2026.20260922.2230',
    content: docsChangelog,
  },
  {
    id: 'app-docs',
    title: 'Dokumentacja Aplikacji',
    filename: 'DOKUMENTACJA_APLIKACJI.md',
    description: 'Architektura Cloud Run, Firebase Hosting, domena lgt2026.pl, model danych i reguły ligi.',
    badge: 'Architektura & Reguły',
    content: docsApp,
  },
  {
    id: 'repro-spec',
    title: 'Specyfikacja Odtworzenia (Master Prompt)',
    filename: 'SPECYFIKACJA_ODTWORZENIA_PROJEKTU.md',
    description: 'Samowystarczalna specyfikacja L4 pozwalająca innemu agentowi AI odtworzyć projekt od zera.',
    badge: 'Dla Agenta AI',
    content: docsSpec,
  },
  {
    id: 'tests-guide',
    title: 'Przewodnik po Testach Post-Deploy',
    filename: 'TESTY_AUTOMATYCZNE_PO_DEPLOYU.md',
    description: 'Zestaw 44 testów automatycznych, weryfikacja SSL domeny lgt2026.pl, algorytmów i powiadomień.',
    badge: '44 Testy (PASS)',
    content: docsTests,
  },
  {
    id: 'readme',
    title: 'Przegląd Pakietu (README)',
    filename: 'README.md',
    description: 'Spis zawartości katalogu LGT-Docs oraz polecenia szybkiego startu.',
    badge: 'Indeks',
    content: docsReadme,
  },
];

export function downloadDocFile(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function downloadAllDocs() {
  LGT_DOCS.forEach((doc, idx) => {
    setTimeout(() => {
      downloadDocFile(doc.filename, doc.content);
    }, idx * 250);
  });
}
