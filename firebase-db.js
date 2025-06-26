import { getDatabase, ref, push, query, orderByChild, limitToLast, get } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-database.js";
import { firebaseApp } from "./firebase.js";

const db = getDatabase(firebaseApp);

// 점수 저장 (닉네임도 함께 저장)
export async function saveScore(score, nickname) {
    if (!nickname) {
        console.warn("닉네임이 undefined입니다. 저장하지 않음");
        return;
    }
    const scoreRef = ref(db, 'scores');
    await push(scoreRef, {
        score: score,
        nickname: nickname,
        timestamp: Date.now()
    });
}

// Top N 점수 가져오기 (최신순, 높은 점수순)
export async function getTopScores(limit = 5) {
    const scoreRef = ref(db, 'scores');
    const q = query(scoreRef, orderByChild('score'), limitToLast(limit));
    const snapshot = await get(q);
    // 점수 내림차순 정렬
    const scores = [];
    snapshot.forEach(child => {
        scores.push(child.val());
    });
    return scores.sort((a, b) => b.score - a.score);
} 