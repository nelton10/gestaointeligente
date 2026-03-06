import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// O seu bloco try/catch e configurações do Firebase entram exclusivamente aqui
const firebaseConfig = {
  apiKey: "AIzaSyCb2Cmqwivdgb_YgCUQbcx43S38QYRDapA",
  authDomain: "gestao-anisio.firebaseapp.com",
  projectId: "gestao-anisio",
  storageBucket: "gestao-anisio.firebasestorage.app",
  messagingSenderId: "946435999048",
  appId: "1:946435999048:web:a3cae6ed73c21a30b59f7d"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const appId = 'gestao-anisio-v1';