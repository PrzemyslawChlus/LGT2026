/**
 * Skrypt automatycznego backupu bazy ligi tenisowej do formatu JSON.
 * Pobiera kolekcje: players, matches, settings, users z bazy Firestore
 * i zapisuje plik z datą np. backup-liga-2026-09-09.json.
 *
 * Uruchomienie:
 *   npm run backup
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import * as fs from 'fs';
import * as path from 'path';

// Wczytanie konfiguracji Firebase
const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
if (!fs.existsSync(configPath)) {
  console.error('❌ Brak pliku firebase-applet-config.json!');
  process.exit(1);
}

const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

const app = initializeApp(firebaseConfig);
const db = firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

async function runBackup() {
  const timestamp = new Date().toISOString().split('T')[0];
  console.log(`🎾 Rozpoczynam pobieranie backupu z bazy Firestore (${firebaseConfig.firestoreDatabaseId})...`);

  try {
    // 1. Gracze
    const playersSnap = await getDocs(collection(db, 'players'));
    const players = playersSnap.docs.map((d) => d.data());

    // 2. Mecze
    const matchesSnap = await getDocs(collection(db, 'matches'));
    const matches = matchesSnap.docs.map((d) => d.data());

    // 3. Ustawienia
    const settingsSnap = await getDocs(collection(db, 'settings'));
    const settings = settingsSnap.docs.map((d) => d.data())[0] || null;

    // 4. Użytkownicy (z wyczyszczonymi hasłami dla bezpieczeństwa)
    const usersSnap = await getDocs(collection(db, 'users'));
    const users = usersSnap.docs.map((d) => {
      const u = d.data();
      return {
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        status: u.status,
        createdAt: u.createdAt,
      };
    });

    const backupData = {
      version: '2.0',
      exportedAt: new Date().toISOString(),
      leagueName: 'Liga Dżentelmenów',
      databaseId: firebaseConfig.firestoreDatabaseId,
      stats: {
        totalPlayers: players.length,
        totalMatches: matches.length,
        totalUsers: users.length,
      },
      players,
      matches,
      settings,
      users,
    };

    const backupsDir = path.resolve(process.cwd(), 'backups');
    if (!fs.existsSync(backupsDir)) {
      fs.mkdirSync(backupsDir, { recursive: true });
    }

    const outputFile = path.join(backupsDir, `backup-liga-${timestamp}.json`);
    fs.writeFileSync(outputFile, JSON.stringify(backupData, null, 2), 'utf-8');

    console.log(`✅ Sukces! Backup zapisany w: ${outputFile}`);
    console.log(`📊 Zabezpieczono: ${players.length} graczy, ${matches.length} meczów, ${users.length} kont użytkowników.`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Błąd podczas wykonywania backupu:', error);
    process.exit(1);
  }
}

runBackup();
