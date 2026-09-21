import { execSync } from 'child_process';

const GITHUB_TOKEN = process.env.GITHUB_TOKEN?.trim();
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

  // Ustawienie tożsamości autora commita (jeśli nie jest ustawiona)
  try {
    execSync('git config user.name "Przemysław Chlus"', { stdio: 'pipe' });
    execSync('git config user.email "przemyslaw.chlus@comp-plus.pl"', { stdio: 'pipe' });
  } catch {
    // ignorujemy jeśli już ustawione
  }

  // Sprawdzenie statusu repozytorium
  const status = execSync('git status --porcelain', { encoding: 'utf-8' });
  if (status.trim().length > 0) {
    console.log('📦 Znaleziono niezacommitowane zmiany. Tworzenie commita...');
    execSync('git add -A', { stdio: 'inherit' });
    const commitMsg = process.argv.slice(2).join(' ').trim() || `chore: synchronizacja aplikacji z ${new Date().toISOString()}`;
    execSync(`git commit -m "${commitMsg.replace(/"/g, '\\"')}"`, { stdio: 'inherit' });
  } else {
    console.log('ℹ️ Brak nowych lokalnych zmian do zacommitowania.');
  }

  console.log(`📤 Wypychanie zmian do https://github.com/${REPO_OWNER}/${REPO_NAME} (${BRANCH})...`);
  
  // Wypchnięcie zmian z użyciem tokena w locie, nie zapisując go w konfiguracji git
  const remoteUrlWithToken = `https://${REPO_OWNER}:${GITHUB_TOKEN}@github.com/${REPO_OWNER}/${REPO_NAME}.git`;
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
