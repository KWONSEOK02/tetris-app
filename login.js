// Firebase 모듈 임포트
import { firebaseApp } from './firebase.js';
import { 
    getAuth, 
    signInWithEmailAndPassword, 
    GoogleAuthProvider, 
    signInWithPopup,
    getAdditionalUserInfo
} from 'https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js';
import { getDatabase, ref, set, get } from 'https://www.gstatic.com/firebasejs/11.9.1/firebase-database.js';

// Firebase 초기화
const app = firebaseApp;
const auth = getAuth(app);
const database = getDatabase(app);
const googleProvider = new GoogleAuthProvider();

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const loginError = document.getElementById('loginError');
    const googleLoginBtn = document.getElementById('googleLoginBtn');

    // 구글 로그인
    googleLoginBtn.addEventListener('click', async () => {
        try {
            const result = await signInWithPopup(auth, googleProvider);
            const user = result.user;
            const additionalUserInfo = getAdditionalUserInfo(result);

            // 새로운 사용자인 경우 데이터베이스에 사용자 정보 저장
            if (additionalUserInfo.isNewUser) {
                await set(ref(database, 'users/' + user.uid), {
                    username: user.displayName || '사용자',
                    email: user.email,
                    createdAt: new Date().toISOString()
                });
            }

            // 기존 사용자의 경우 정보 가져오기
            const userRef = ref(database, 'users/' + user.uid);
            const snapshot = await get(userRef);
            const userData = snapshot.exists() ? snapshot.val() : null;

            // 로컬 스토리지에 사용자 정보 저장
            localStorage.setItem('user', JSON.stringify({
                uid: user.uid,
                email: user.email,
                username: userData?.username || user.displayName || '사용자'
            }));

            alert('구글 로그인 성공!');
            window.location.href = 'index.html';
        } catch (error) {
            console.error('구글 로그인 중 오류 발생:', error);
            let errorMessage = '구글 로그인 중 오류가 발생했습니다.';
            
            switch (error.code) {
                case 'auth/popup-closed-by-user':
                    errorMessage = '로그인 창이 닫혔습니다. 다시 시도해주세요.';
                    break;
                case 'auth/popup-blocked':
                    errorMessage = '팝업이 차단되었습니다. 팝업 차단을 해제해주세요.';
                    break;
                case 'auth/cancelled-popup-request':
                    errorMessage = '이미 로그인 창이 열려있습니다.';
                    break;
                case 'auth/account-exists-with-different-credential':
                    errorMessage = '이미 다른 방법으로 가입된 이메일입니다.';
                    break;
            }
            
            loginError.textContent = errorMessage;
            loginError.style.color = '#f44336';
        }
    });

    // 이메일/비밀번호 로그인 폼 제출 처리
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // 사용자 정보 가져오기
            const userRef = ref(database, 'users/' + user.uid);
            const snapshot = await get(userRef);
            const userData = snapshot.exists() ? snapshot.val() : null;

            localStorage.setItem('user', JSON.stringify({
                uid: user.uid,
                email: user.email,
                username: userData?.username || '사용자'
            }));

            alert('로그인 성공!');
            window.location.href = 'index.html';
        } catch (error) {
            let errorMessage = '로그인 중 오류가 발생했습니다.';
            
            switch (error.code) {
                case 'auth/invalid-email':
                    errorMessage = '유효하지 않은 이메일 형식입니다.';
                    break;
                case 'auth/user-disabled':
                    errorMessage = '해당 사용자 계정이 비활성화되었습니다.';
                    break;
                case 'auth/user-not-found':
                    errorMessage = '등록되지 않은 이메일입니다.';
                    break;
                case 'auth/wrong-password':
                    errorMessage = '잘못된 비밀번호입니다.';
                    break;
            }
            
            loginError.textContent = errorMessage;
            loginError.style.color = '#f44336';
            console.error(error);
        }
    });

    // 이미 로그인된 사용자 체크
    auth.onAuthStateChanged((user) => {
        if (user) {
            window.location.href = 'index.html';
        }
    });
}); 