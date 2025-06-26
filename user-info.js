import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";
import { getDatabase, ref, get } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-database.js";
import { firebaseApp } from "./firebase.js";

const auth = getAuth(firebaseApp);
const db = getDatabase(firebaseApp);

onAuthStateChanged(auth, async (user) => {
    if (user) {
        const userRef = ref(db, `users/${user.uid}`);
        const snapshot = await get(userRef);
        const userData = snapshot.exists() ? snapshot.val() : null;

        const nickname = userData?.username || user.displayName || '사용자';

        // .user-logout-row에 닉네임 표시
        const userNicknameDiv = document.createElement('div');
        userNicknameDiv.textContent = `👤 ${nickname}`;
        userNicknameDiv.style.marginTop = '0';
        userNicknameDiv.style.color = '#333';
        userNicknameDiv.style.fontWeight = 'bold';
        userNicknameDiv.style.marginRight = '10px';
        userNicknameDiv.style.fontSize = '16px';
        userNicknameDiv.style.display = 'flex';
        userNicknameDiv.style.alignItems = 'center';
        //userNicknameDiv.style.justifyContent = 'flex-start'; // (가로 왼쪽 정렬) // 임시

        const rowDiv = document.querySelector('.user-logout-row');
        if (rowDiv) {
            rowDiv.insertBefore(userNicknameDiv, rowDiv.querySelector('button'));
        }
    }
});