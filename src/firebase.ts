import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyCk_K5CQYAPVxWcUOptOOreyPvEAkf1HgY",
  authDomain: "mediturno-hospital.firebaseapp.com",
  databaseURL: "https://mediturno-hospital-default-rtdb.firebaseio.com",
  projectId: "mediturno-hospital",
  storageBucket: "mediturno-hospital.firebasestorage.app",
  messagingSenderId: "370555136854",
  appId: "1:370555136854:web:68e953b861201c359c84f7"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

export { app, auth, db };
