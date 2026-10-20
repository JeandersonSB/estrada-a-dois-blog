import assert from 'node:assert/strict';
import { before, after, test } from 'node:test';
import { readFileSync } from 'node:fs';
import { initializeApp, deleteApp } from 'firebase/app';
import {
  connectFirestoreEmulator, getFirestore, doc, setDoc, getDocFromServer,
  deleteDoc, deleteField, updateDoc, getDocs, collection, terminate, setLogLevel,
} from 'firebase/firestore';

// Never run these authenticated fixtures against a real Firebase project.
const projectId = 'demo-rota-biker-security';
assert.equal(process.env.FIRESTORE_EMULATOR_HOST, '127.0.0.1:8080',
  'Start the local emulator with the demo project before running these tests.');
const monuments = JSON.parse(readFileSync(new URL('../app/rota-biker/monuments.json', import.meta.url), 'utf8'));
const firstId = monuments[0].id;
const apps = [];
const dbs = [];
let alice, bob, guest;

function client(uid) {
  const app = initializeApp({ projectId, apiKey: 'demo-key', appId: 'demo-app' }, uid || 'guest');
  const db = getFirestore(app);
  connectFirestoreEmulator(db, '127.0.0.1', 8080, uid ? {
    mockUserToken: { sub: uid, email: `${uid}@example.test`, firebase: { sign_in_provider: 'google.com' } },
  } : undefined);
  apps.push(app); dbs.push(db);
  return db;
}
const denied = operation => assert.rejects(operation, error => error.code === 'permission-denied');
const own = (db, uid) => doc(db, 'bikerVisits', uid);

before(async () => {
  setLogLevel('silent');
  alice = client('alice'); bob = client('bob'); guest = client();
  await setDoc(own(alice, 'alice'), { visits: { [firstId]: true } });
  await setDoc(own(bob, 'bob'), { visits: {} });
});
after(async () => {
  if (alice) await deleteDoc(own(alice, 'alice'));
  if (bob) await deleteDoc(own(bob, 'bob'));
  await Promise.all(dbs.map(db => terminate(db)));
  await Promise.all(apps.map(app => deleteApp(app)));
});

test('each authenticated user can read only their own document', async () => {
  assert.equal((await getDocFromServer(own(alice, 'alice'))).data().visits[firstId], true);
  assert.deepEqual((await getDocFromServer(own(bob, 'bob'))).data(), { visits: {} });
  await denied(getDocFromServer(own(bob, 'alice')));
  await denied(getDocFromServer(own(alice, 'bob')));
});
test('neither user can create, modify or delete the other user history', async () => {
  for (const [db, other] of [[alice, 'bob'], [bob, 'alice']]) {
    await denied(setDoc(own(db, other), { visits: {} }));
    await denied(updateDoc(own(db, other), { [`visits.${firstId}`]: true }));
    await denied(deleteDoc(own(db, other)));
    await denied(setDoc(own(db, 'another-user'), { visits: {} }));
  }
});
test('unauthenticated clients cannot read, create, update or delete visits', async () => {
  await denied(getDocFromServer(own(guest, 'alice')));
  await denied(setDoc(own(guest, 'guest'), { visits: {} }));
  await denied(updateDoc(own(guest, 'alice'), { visits: {} }));
  await denied(deleteDoc(own(guest, 'alice')));
});
test('listing user histories is denied, including to an authenticated user', async () => {
  for (const db of [alice, bob, guest]) await denied(getDocs(collection(db, 'bikerVisits')));
});
test('only known monument IDs and the literal true are accepted', async () => {
  await denied(setDoc(own(alice, 'alice'), { visits: { unknown: true } }));
  for (const value of [false, 1, 0, 'true', null, [], { nested: true }]) {
    await denied(setDoc(own(alice, 'alice'), { visits: { [firstId]: value } }));
  }
});
test('missing, malformed or extra fields are rejected', async () => {
  for (const data of [{}, { visits: [] }, { visits: null }, { visits: 'all' },
    { visits: {}, admin: true }, { visits: {}, location: { lat: 0, lng: 0 } }]) {
    await denied(setDoc(own(alice, 'alice'), data));
  }
});
test('all current monuments fit, and the app can mark and unmark with merge', async () => {
  const visits = Object.fromEntries(monuments.map(m => [m.id, true]));
  await setDoc(own(alice, 'alice'), { visits });
  assert.deepEqual((await getDocFromServer(own(alice, 'alice'))).data().visits, visits);
  await setDoc(own(alice, 'alice'), { visits: { [firstId]: deleteField() } }, { merge: true });
  assert.equal((await getDocFromServer(own(alice, 'alice'))).data().visits[firstId], undefined);
  await setDoc(own(alice, 'alice'), { visits: { [firstId]: true } }, { merge: true });
  assert.equal((await getDocFromServer(own(alice, 'alice'))).data().visits[firstId], true);
  await setDoc(own(alice, 'alice'), { visits: {} });
});
test('unrelated collections are denied by default', async () => {
  await denied(setDoc(doc(alice, 'accounts', 'alice'), { admin: true }));
  await denied(getDocFromServer(doc(alice, 'accounts', 'alice')));
});
