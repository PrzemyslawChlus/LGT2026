import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

let rawToken = process.env.GITHUB_TOKEN?.trim() || '';
// Usuwamy ewentualny znak '=' lub cudzysłowy jeśli wkradły się podczas wklejania
if (rawToken.startsWith('=')) {
  rawToken = rawToken.substring(1).trim();
}
if ((rawToken.startsWith('"') && rawToken.endsWith('"')) || (rawToken.startsWith("'") && rawToken.endsWith("'"))) {
  rawToken = rawToken.slice(1, -1).trim();
}
const GITHUB_TOKEN = rawToken;
const REPO_OWNER = 'PrzemyslawChlus';
const REPO_NAME = 'LGT2026';
const BRANCH = 'main';

if (!GITHUB_TOKEN) {
  console.error('\n❌ BŁĄD: Zmienna środowiskowa GITHUB_TOKEN nie jest ustawiona.');
  console.error('👉 Przejdź do: AI Studio -> Settings (zębatka) -> Secrets / Environment Variables');
  console.error('👉 Dodaj klucz: GITHUB_TOKEN z wartością Twojego tokena Personal Access Token (PAT).\n');
  process.exit(1);
}

try {
  console.log('🚀 Przygotowywanie synchronizacji z GitHub...');

  // Upewnienie się, że repozytorium git jest zainicjalizowane
  if (!fs.existsSync('.git')) {
    try {
      execSync('git init -b main', { stdio: 'pipe' });
      execSync(`git remote add origin https://github.com/${REPO_OWNER}/${REPO_NAME}.git`, { stdio: 'pipe' });
    } catch {}
  }

  // Ustawienie tożsamości autora commita (jeśli nie jest ustawiona)
  try {
    execSync('git config user.name "Przemysław Chlus"', { stdio: 'pipe' });
    execSync('git config user.email "przemyslaw.chlus@comp-plus.pl"', { stdio: 'pipe' });
  } catch {
    // ignorujemy jeśli już ustawione
  }

  // 1. Zaktualizuj wersję aplikacji w public/version.json
  const versionFile = path.resolve('public/version.json');
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  const timeStr = `${String(now.getUTCHours()).padStart(2, '0')}${String(now.getUTCMinutes()).padStart(2, '0')}`;
  const newVersion = `v2026.${dateStr}.${timeStr}`;

  const versionPayload = {
    version: newVersion,
    buildTime: now.getTime(),
    buildDate: now.toISOString(),
  };
  fs.writeFileSync(versionFile, JSON.stringify(versionPayload, null, 2) + '\n', 'utf-8');
  console.log(`🏷️ Zaktualizowano numer wersji aplikacji: ${newVersion}`);

  // 2. Fetch i integracja ze zdalnym repozytorium GitHub
  const remoteUrlWithToken = `https://${REPO_OWNER}:${GITHUB_TOKEN}@github.com/${REPO_OWNER}/${REPO_NAME}.git`;
  try {
    console.log(`📥 Pobieranie najnowszych zmian z repozytorium zdalnego (${BRANCH})...`);
    execSync(`git fetch ${remoteUrlWithToken} ${BRANCH}`, { stdio: 'inherit' });
    
    // Sprawdzamy czy FETCH_HEAD istnieje
    try {
      execSync(`git merge FETCH_HEAD -m "chore: integracja z najnowszą wersją repozytorium" --allow-unrelated-histories -X ours`, { stdio: 'inherit' });
    } catch (mergeErr) {
      console.log('ℹ️ Merge zakończony lub pominięty.');
    }
  } catch (fetchErr) {
    console.log('ℹ️ Brak zdalnego brancha lub fetch pominięty.');
  }

  // 3. Sprawdzenie statusu repozytorium
  const status = execSync('git status --porcelain', { encoding: 'utf-8' });
  if (status.trim().length > 0) {
    console.log('📦 Znaleziono zmiany do zacommitowania. Tworzenie commita...');
    execSync('git add -A', { stdio: 'inherit' });
    const commitMsg = process.argv.slice(2).join(' ').trim() || `feat: dodanie weryfikacji meczow po terminie i powiadomien push 2h (${newVersion})`;
    execSync(`git commit -m "${commitMsg.replace(/"/g, '\\"')}"`, { stdio: 'inherit' });
  } else {
    console.log('ℹ️ Brak nowych lokalnych zmian do zacommitowania.');
  }

  console.log(`📤 Wypychanie zmian do https://github.com/${REPO_OWNER}/${REPO_NAME} (${BRANCH})...`);
  
  // Wypchnięcie zmian z użyciem tokena w locie, nie zapisując go w konfiguracji git
  execSync(`git push ${remoteUrlWithToken} ${BRANCH}`, { stdio: 'inherit' });

  // Zabezpieczenie: upewnienie się, że origin nie zawiera tokena
  try {
    execSync(`git remote set-url origin https://github.com/${REPO_OWNER}/${REPO_NAME}.git`, { stdio: 'pipe' });
  } catch {
    // origin może nie istnieć
  }

  console.log('✅ Pomyślnie zsynchronizowano z GitHubem!\n');
} catch (error: any) {
  console.error('\n❌ Wystąpił błąd podczas wypychania zmian:', error?.message || error);
  // Zabezpieczenie: przywrócenie czystego URL
  try {
    execSync(`git remote set-url origin https://github.com/${REPO_OWNER}/${REPO_NAME}.git`, { stdio: 'pipe' });
  } catch {}
  process.exit(1);
}
