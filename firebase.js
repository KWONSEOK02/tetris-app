import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-database.js";
// 필요한 경우 여기에 firestore, auth 등도 import

const firebaseConfig = {
  apiKey: "AIzaSyDtqcRQ_N8Sx3I6NJm1GuXPbgOgii5O848",
  authDomain: "tetris-app-database.firebaseapp.com",
  projectId: "tetris-app-database",
  storageBucket: "tetris-app-database.firebasestorage.app",
  messagingSenderId: "1026165714141",
  appId: "1:1026165714141:web:e1b57223d5d8d184e23f34",
  databaseURL: "https://tetris-app-database-default-rtdb.firebaseio.com/"
};

export const firebaseApp = initializeApp(firebaseConfig);
export { getDatabase }; 