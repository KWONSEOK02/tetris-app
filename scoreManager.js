export class ScoreManager {
    constructor(updateScoreCallback, updateLevelCallback) {
        this.score = 0;
        this.level = 1;
        this.linesCleared = 0;
        this.updateScoreCallback = updateScoreCallback;
        this.updateLevelCallback = updateLevelCallback;
    }

    addLinesCleared(count) {
        const scoreTable = [0, 100, 300, 500, 800]; // 1,2,3,4줄 한 번에 제거 시 점수
        this.score += scoreTable[count] || 0;
        this.linesCleared += count;

        const newLevel = Math.floor(this.linesCleared / 5) + 1;
        if (newLevel > this.level) {
            this.level = newLevel;
            this.updateLevelCallback?.(this.level);
        }

        this.updateScoreCallback?.(this.score);
    }

    reset() {
        this.score = 0;
        this.level = 1;
        this.linesCleared = 0;
    }

    
    getLevelSpeed() {
        return Math.max(100, 500 - (this.level - 1) * 50); // 예: 레벨마다 속도 증가
    }
    
} 