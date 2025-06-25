import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";
import { firebaseApp } from "./firebase.js";

const auth = getAuth(firebaseApp);

onAuthStateChanged(auth, (user) => {
    if (!user) {
        // 로그인이 안 되어 있으면 로그인 페이지로 리다이렉트
        window.location.href = "login.html";
    }
});

// 로그아웃 버튼 기능
const logoutButton = document.getElementById('logout-button');
if (logoutButton) {
    logoutButton.addEventListener('click', () => {
        localStorage.removeItem('user');
        auth.signOut();
        window.location.href = 'login.html';
    });
} 