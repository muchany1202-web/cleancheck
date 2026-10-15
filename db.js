// Shared database access (Cloud Firestore). Works offline: writes are queued and sent when the phone reconnects.
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {
  initializeFirestore, persistentLocalCache, collection, addDoc, query, orderBy, limit, onSnapshot
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
let db;
try { db = initializeFirestore(app, { localCache: persistentLocalCache() }); }
catch (e) { db = initializeFirestore(app, {}); }

export function addCheck(rec) { return addDoc(collection(db, "checks"), rec); }
export function addCleaning(rec) { return addDoc(collection(db, "cleanings"), rec); }

function watch(name, max, cb, errCb) {
  const q = query(collection(db, name), orderBy("ts", "desc"), limit(max));
  return onSnapshot(q, (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...d.data() }))), errCb);
}
export function onChecks(cb, errCb) { return watch("checks", 500, cb, errCb); }
export function onCleanings(cb, errCb) { return watch("cleanings", 300, cb, errCb); }
