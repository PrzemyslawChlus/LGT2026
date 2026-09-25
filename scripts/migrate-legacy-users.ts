import { initializeApp } from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  setDoc,
  deleteDoc,
} from 'firebase/firestore';
import config from '../firebase-applet-config.json';

// Admin app instance
const adminApp = initializeApp(config, 'MigrationAdminApp');
const adminAuth = getAuth(adminApp);
const db = getFirestore(adminApp, config.firestoreDatabaseId);

// Worker app instance for isolated user account creation in Firebase Auth
const workerApp = initializeApp(config, 'MigrationWorkerApp');
const workerAuth = getAuth(workerApp);

async function runMigration() {
  console.log('🎾 Rozpoczynam automatyczną migrację wszystkich zarejestrowanych graczy...');

  // 1. Zaloguj administratora (Adrian)
  console.log('🔑 Logowanie Administratora do bazy Firestore...');
  const adminCred = await signInWithEmailAndPassword(
    adminAuth,
    'adrianladak001@gmail.com',
    'Dukat2004!'
  );
  console.log(`✅ Zalogowano Administratora (UID: ${adminCred.user.uid})`);

  // 2. Pobierz wszystkie istniejące dokumenty w kolekcji users
  const snap = await getDocs(collection(db, 'users'));
  console.log(`📦 Łączna liczba dokumentów użytkowników w Firestore: ${snap.size}`);

  const userItems: { id: string; data: any }[] = [];
  snap.forEach((d) => {
    userItems.push({ id: d.id, data: d.data() });
  });

  let migratedCount = 0;
  let alreadyMigratedCount = 0;
  let skippedCount = 0;

  for (const item of userItems) {
    const data = item.data;
    const email = data.email?.trim().toLowerCase();
    const rawPass = data.passwordHash || 'Tenis123!';
    let cleanPass = String(rawPass).trim();
    if (cleanPass.length < 6) cleanPass = cleanPass.padEnd(6, '!');

    if (!email) {
      console.warn(`⚠️ Pominięto dokument bez e-maila: ${item.id}`);
      skippedCount++;
      continue;
    }

    console.log(`\n--------------------------------------------------`);
    console.log(`👤 Gracz: ${data.name} <${email}>`);
    console.log(`   Aktualne ID dokumentu: ${item.id}`);

    // Sprawdź czy to konto już jest zmigrowane (ID to UID o dł. 28 znaków i brak hasła)
    if (!item.id.startsWith('u_') && !data.passwordHash) {
      console.log(`   ℹ️ To konto jest już poprawnie zmigrowane (UID: ${item.id}).`);
      alreadyMigratedCount++;
      continue;
    }

    let authUid = '';

    // Spróbuj utworzyć konto w Firebase Auth
    try {
      const res = await createUserWithEmailAndPassword(workerAuth, email, cleanPass);
      authUid = res.user.uid;
      console.log(`   ✅ Utworzono konto w Firebase Auth (UID: ${authUid}) z dotychczasowym hasłem`);
      await signOut(workerAuth);
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') {
        console.log(`   ℹ️ Konto Firebase Auth już istnieje dla tego e-maila. Logowanie w celu pobrania UID...`);
        try {
          const res = await signInWithEmailAndPassword(workerAuth, email, cleanPass);
          authUid = res.user.uid;
          console.log(`   ✅ Pomyślnie dopasowano UID z Firebase Auth: ${authUid}`);
          await signOut(workerAuth);
        } catch (signInErr: any) {
          // Jeśli hasło było inne lub zmienione, spróbuj pobrać UID jeśli dokument ma już format UID
          if (!item.id.startsWith('u_')) {
            authUid = item.id;
            console.log(`   ℹ️ Użyto istniejącego identyfikatora UID dokumentu: ${authUid}`);
          } else {
            console.warn(`   ⚠️ Konto w Firebase Auth istnieje pod innym hasłem dla ${email}. Wymagany reset hasła.`);
          }
        }
      } else {
        console.error(`   ❌ Błąd Firebase Auth:`, err.message);
      }
    }

    if (authUid) {
      // Przygotuj zaktualizowany profil bez pola passwordHash
      const newProfile: Record<string, any> = {
        id: authUid,
        email: email,
        name: data.name || '',
        role: data.role || 'player',
        status: data.status || 'approved',
        createdAt: data.createdAt || Date.now(),
      };

      if (data.nickname) newProfile.nickname = data.nickname;
      if (data.phone) newProfile.phone = data.phone;
      if (data.playerId) newProfile.playerId = data.playerId;
      if (data.playStyle) newProfile.playStyle = data.playStyle;
      if (data.preferredCourts) newProfile.preferredCourts = data.preferredCourts;
      if (data.preferredTimes) newProfile.preferredTimes = data.preferredTimes;

      // Zapisz dokument w Firestore pod kluczem UID
      await setDoc(doc(db, 'users', authUid), newProfile, { merge: true });
      console.log(`   ✅ Zapisano profil w Firestore pod kluczem users/${authUid} (BEZ passwordHash)`);

      // Jeśli stary dokument miał prefiks u_ (np. u_17889...), usuń go
      if (item.id !== authUid && item.id.startsWith('u_')) {
        await deleteDoc(doc(db, 'users', item.id));
        console.log(`   🧹 Usunięto przestarzały dokument z jawnym hasłem: users/${item.id}`);
      }

      migratedCount++;
    } else {
      console.warn(`   ⚠️ Nie udało się zmapować UID dla konta ${email}. Dokument zachowany.`);
      skippedCount++;
    }
  }

  console.log(`\n==================================================`);
  console.log(`🎉 PODSUMOWANIE MIGRACJI:`);
  console.log(`   Zmigrowano pomyślnie: ${migratedCount}`);
  console.log(`   Już wcześniej zmigrowanych: ${alreadyMigratedCount}`);
  console.log(`   Pominięto / Wymaga uwagi: ${skippedCount}`);
  console.log(`==================================================\n`);

  process.exit(0);
}

runMigration().catch((err) => {
  console.error('Błąd krytyczny podczas migracji:', err);
  process.exit(1);
});
