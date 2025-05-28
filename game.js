import { ScoreManager } from './scoreManager.js';

class TetrisGame {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.blockSize = 40; // 각 블록의 크기를 40px로 변경 (400px / 10칸 = 40px)
        this.cols = this.canvas.width / this.blockSize;  // 10칸
        this.rows = this.canvas.height / this.blockSize; // 20칸
        
        // 점수 표시 캔버스 설정
        this.scoreCanvas = document.getElementById('score-display');
        this.scoreCtx = this.scoreCanvas.getContext('2d');
        
        // 레벨 표시 캔버스 설정
        this.levelCanvas = document.getElementById('level-display');
        this.levelCtx = this.levelCanvas.getContext('2d');
        
        // 다음 블록 미리보기 캔버스 설정
        this.nextPieceDisplay = document.getElementById('next-piece-display');
        this.nextPieceCtx = this.nextPieceDisplay.getContext('2d');
        this.nextPieceDisplay.width = 100;
        this.nextPieceDisplay.height = 100;
        
        // ScoreManager 초기화
        this.scoreManager = new ScoreManager(
            (score) => this.updateScoreDisplay(score),
            (level) => {
                this.updateLevelDisplay(level);
                this.updateGameSpeed();
            }
        );
        
        // 게임 상태
        this.currentPiece = null;
        this.nextPiece = this.getRandomPiece(); // 처음 시작할 때 다음 블록 미리 준비
        this.currentRotation = 0;
        this.currentX = 0;
        this.currentY = 0;
        this.isPlaying = false;
        this.gameInterval = null;
        this.isFastDropping = false;
        this.fastDropTimer = null;

        // 게임 보드 초기화 (20x10 크기)
        this.board = Array(this.rows).fill().map(() => Array(this.cols).fill(0));
        
        // 게임 초기화
        this.init();

        // 키보드 이벤트 바인딩
        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.handleKeyUp = this.handleKeyUp.bind(this);
    }

    // 점수 표시 업데이트
    updateScoreDisplay(score) {
        const ctx = this.scoreCtx;
        ctx.clearRect(0, 0, this.scoreCanvas.width, this.scoreCanvas.height);
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, this.scoreCanvas.width, this.scoreCanvas.height);
        ctx.fillStyle = '#fff';
        ctx.font = '24px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(score.toString(), this.scoreCanvas.width / 2, this.scoreCanvas.height / 2);
    }

    // 레벨 표시 업데이트
    updateLevelDisplay(level) {
        const ctx = this.levelCtx;
        ctx.clearRect(0, 0, this.levelCanvas.width, this.levelCanvas.height);
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, this.levelCanvas.width, this.levelCanvas.height);
        ctx.fillStyle = '#fff';
        ctx.font = '24px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(level.toString(), this.levelCanvas.width / 2, this.levelCanvas.height / 2);
    }

    init() {
        // 캔버스 초기화
        this.ctx.scale(1, 1);
        this.drawNextPiece();
        this.updateScoreDisplay(0);
        this.updateLevelDisplay(1);

        // 시작 버튼 이벤트 리스너
        const startButton = document.getElementById('start-button');
        startButton.addEventListener('click', () => this.startGame());
    }

    startGame() {
        if (this.isPlaying) return;
        
        this.isPlaying = true;
        this.board = Array(this.rows).fill().map(() => Array(this.cols).fill(0));
        this.scoreManager.reset();
        
        // 다음 블록 설정하고 첫 블록 생성
        this.nextPiece = this.getRandomPiece();
        this.createNewPiece();
        
        // 키보드 이벤트 리스너 추가
        document.addEventListener('keydown', this.handleKeyDown);
        document.addEventListener('keyup', this.handleKeyUp);
        
        this.startGravity();

        // 버튼 텍스트 변경
        const startButton = document.getElementById('start-button');
        startButton.textContent = '게임 중';
        startButton.disabled = true;
    }

    stopGame() {
        this.isPlaying = false;
        this.stopGravity();
        this.stopFastDrop();
        
        // 키보드 이벤트 리스너 제거
        document.removeEventListener('keydown', this.handleKeyDown);
        document.removeEventListener('keyup', this.handleKeyUp);
        
        // 버튼 초기화
        const startButton = document.getElementById('start-button');
        startButton.textContent = '게임 시작';
        startButton.disabled = false;
    }

    // 키보드 keydown 이벤트 처리
    handleKeyDown(event) {
        if (!this.isPlaying) return;

        switch (event.code) {
            case 'ArrowLeft': // 왼쪽 화살표
                this.moveLeft();
                break;
            case 'ArrowRight': // 오른쪽 화살표
                this.moveRight();
                break;
            case 'ArrowUp': // 위쪽 화살표
                this.rotate();
                break;
            case 'ArrowDown': // 아래 화살표
                this.fastDrop();
                break;
            case 'Space': // 스페이스바
                this.instantDrop();
                break;
        }
    }

    // 키보드 keyup 이벤트 처리
    handleKeyUp(event) {
        if (!this.isPlaying) return;

        switch (event.code) {
            case 'ArrowDown': // 아래 화살표
                this.stopFastDrop();
                break;
        }
    }

    // 중력 시작 (자동 하강)
    startGravity() {
        if (this.gameInterval) return;
        this.gameInterval = setInterval(() => {
            this.moveDown();
        }, this.scoreManager.getLevelSpeed());
    }

    // 중력 정지
    stopGravity() {
        if (this.gameInterval) {
            clearInterval(this.gameInterval);
            this.gameInterval = null;
        }
    }

    // 빠른 하강
    fastDrop() {
        if (this.isFastDropping) return;
        this.isFastDropping = true;

        this.stopGravity();
        const shape = this.getCurrentShape();

        const moveDown = () => {
            if (!this.isCollision(this.currentX, this.currentY + 1, shape)) {
                this.currentY++;
                this.draw();
                this.fastDropTimer = setTimeout(moveDown, 30);
            } else {
                this.stopFastDrop();
                this.freezePiece();
            }
        };

        moveDown();
    }

    // 빠른 하강 정지
    stopFastDrop() {
        if (this.fastDropTimer) {
            clearTimeout(this.fastDropTimer);
            this.fastDropTimer = null;
        }
        this.isFastDropping = false;
        if (this.isPlaying) {
            this.startGravity();
        }
    }

    // 왼쪽으로 이동
    moveLeft() {
        const shape = this.getCurrentShape();
        if (!this.isCollision(this.currentX - 1, this.currentY, shape)) {
            this.currentX--;
            this.draw();
        }
    }

    // 오른쪽으로 이동
    moveRight() {
        const shape = this.getCurrentShape();
        if (!this.isCollision(this.currentX + 1, this.currentY, shape)) {
            this.currentX++;
            this.draw();
        }
    }

    // 블록 회전
    rotate() {
        const nextRotation = (this.currentRotation + 1) % SHAPES[this.currentPiece].length;
        const shape = SHAPES[this.currentPiece][nextRotation];
        
        // 회전 후 충돌 검사
        if (!this.isCollision(this.currentX, this.currentY, shape)) {
            this.currentRotation = nextRotation;
            this.draw();
        } else {
            // 벽 근처에서 회전이 막힐 경우 왼쪽/오른쪽으로 한 칸 이동 후 회전 시도
            // 왼쪽으로 이동 시도
            if (!this.isCollision(this.currentX - 1, this.currentY, shape)) {
                this.currentX--;
                this.currentRotation = nextRotation;
                this.draw();
            }
            // 오른쪽으로 이동 시도
            else if (!this.isCollision(this.currentX + 1, this.currentY, shape)) {
                this.currentX++;
                this.currentRotation = nextRotation;
                this.draw();
            }
        }
    }

    // 랜덤 블록 생성
    getRandomPiece() {
        const pieces = 'IOTSZJL';
        return pieces[Math.floor(Math.random() * pieces.length)];
    }

    // 새로운 테트로미노 생성
    createNewPiece() {
        // 현재 블록을 다음 블록으로 설정
        this.currentPiece = this.nextPiece;
        this.currentRotation = 0;
        
        // 시작 위치 설정
        const pieceData = tetrominoes[this.currentPiece];
        this.currentX = pieceData.startX;
        this.currentY = pieceData.startY;

        // 다음 블록 준비
        this.nextPiece = this.getRandomPiece();
        this.drawNextPiece();
    }

    // 다음 블록 그리기
    drawNextPiece() {
        const ctx = this.nextPieceCtx;
        const blockSize = 30;
        
        // 캔버스 초기화
        ctx.clearRect(0, 0, this.nextPieceDisplay.width, this.nextPieceDisplay.height);
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, this.nextPieceDisplay.width, this.nextPieceDisplay.height);

        const shape = SHAPES[this.nextPiece][0]; // 첫 번째 회전 상태 사용
        const color = tetrominoes[this.nextPiece].color;

        // 블록 중앙 정렬을 위한 오프셋 계산
        const offsetX = (this.nextPieceDisplay.width - shape[0].length * blockSize) / 2;
        const offsetY = (this.nextPieceDisplay.height - shape.length * blockSize) / 2;

        // 블록 그리기
        for(let y = 0; y < shape.length; y++) {
            for(let x = 0; x < shape[y].length; x++) {
                if(shape[y][x]) {
                    ctx.fillStyle = color;
                    ctx.fillRect(
                        offsetX + x * blockSize, 
                        offsetY + y * blockSize, 
                        blockSize, 
                        blockSize
                    );
                    ctx.strokeStyle = '#fff';
                    ctx.strokeRect(
                        offsetX + x * blockSize, 
                        offsetY + y * blockSize, 
                        blockSize, 
                        blockSize
                    );
                }
            }
        }
    }

    // 충돌 검사
    isCollision(x, y, shape) {
        for(let row = 0; row < shape.length; row++) {
            for(let col = 0; col < shape[row].length; col++) {
                if(shape[row][col]) {
                    const newX = x + col;
                    const newY = y + row;

                    if (
                        newX < 0 || 
                        newX >= this.cols || 
                        newY >= this.rows ||
                        (newY >= 0 && this.board[newY][newX])
                    ) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    // 블록 고정
    freezePiece() {
        const shape = this.getCurrentShape();
        for(let y = 0; y < shape.length; y++) {
            for(let x = 0; x < shape[y].length; x++) {
                if(shape[y][x]) {
                    const boardY = this.currentY + y;
                    if(boardY < 0) {
                        // 게임 오버
                        this.stopGame();
                        return;
                    }
                    this.board[boardY][this.currentX + x] = tetrominoes[this.currentPiece].color;
                }
            }
        }
        this.clearLines(); // 줄 제거 체크
        this.createNewPiece();
    }

    // 완성된 줄 제거
    clearLines() {
        let linesCleared = 0;

        for (let y = this.rows - 1; y >= 0; y--) {
            const isFull = this.board[y].every(cell => cell !== 0);
            
            if (isFull) {
                this.board.splice(y, 1); // 해당 줄 제거
                this.board.unshift(Array(this.cols).fill(0)); // 맨 위에 빈 줄 추가
                linesCleared++;
                y++; // 같은 줄 다시 검사 (줄 내려왔으므로)
            }
        }

        if (linesCleared > 0) {
            this.scoreManager.addLinesCleared(linesCleared);
        }
    }

    // 아래로 이동
    moveDown() {
        const shape = this.getCurrentShape();
        if(!this.isCollision(this.currentX, this.currentY + 1, shape)) {
            this.currentY++;
        } else {
            this.freezePiece();
        }
        this.draw();
    }

    // 현재 조각의 모양 가져오기
    getCurrentShape() {
        return SHAPES[this.currentPiece][this.currentRotation];
    }

    // 게임 보드 그리기
    draw() {
        // 캔버스 클리어
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 배경 그리기
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // 고정된 블록 그리기
        this.drawBoard();
        
        // 고스트 블록 그리기
        this.drawGhostPiece();
        
        // 현재 떨어지는 조각 그리기
        this.drawCurrentPiece();
    }

    // 보드에 있는 블록들 그리기
    drawBoard() {
        for(let y = 0; y < this.rows; y++) {
            for(let x = 0; x < this.cols; x++) {
                if(this.board[y][x]) {
                    this.drawBlock(x, y, this.board[y][x], false);
                }
            }
        }
    }

    // 현재 떨어지는 조각 그리기
    drawCurrentPiece() {
        const shape = this.getCurrentShape();
        const color = tetrominoes[this.currentPiece].color;

        for(let y = 0; y < shape.length; y++) {
            for(let x = 0; x < shape[y].length; x++) {
                if(shape[y][x]) {
                    this.drawBlock(this.currentX + x, this.currentY + y, color, false);
                }
            }
        }
    }

    // 단일 블록 그리기
    drawBlock(x, y, color, isGhost = false) {
        if(y < 0) return; // 화면 위의 블록은 그리지 않음
        
        this.ctx.fillStyle = color;
        
        if (isGhost) {
            // 고스트 블록은 반투명하게 처리
            this.ctx.globalAlpha = 0.3;
        }

        this.ctx.fillRect(x * this.blockSize, y * this.blockSize, this.blockSize, this.blockSize);
        
        // 블록 테두리
        this.ctx.strokeStyle = isGhost ? color : '#fff';
        this.ctx.strokeRect(x * this.blockSize, y * this.blockSize, this.blockSize, this.blockSize);
        
        // 투명도 초기화
        if (isGhost) {
            this.ctx.globalAlpha = 1.0;
        }
    }

    // 즉시 하강
    instantDrop() {
        const shape = this.getCurrentShape();
        let nextY = this.currentY;

        // 충돌이 발생할 때까지 y값 증가
        while (!this.isCollision(this.currentX, nextY + 1, shape)) {
            nextY++;
        }

        // 최종 위치로 이동
        if (nextY !== this.currentY) {
            this.currentY = nextY;
            this.draw();
        }
        
        // 블록 고정
        this.freezePiece();
    }

    // 고스트 블록의 Y 위치 계산
    getGhostY() {
        const shape = this.getCurrentShape();
        let ghostY = this.currentY;

        // 충돌이 발생할 때까지 아래로 이동
        while (!this.isCollision(this.currentX, ghostY + 1, shape)) {
            ghostY++;
        }

        return ghostY;
    }

    // 고스트 블록 그리기
    drawGhostPiece() {
        const shape = this.getCurrentShape();
        const color = tetrominoes[this.currentPiece].color;
        const ghostY = this.getGhostY();

        for(let y = 0; y < shape.length; y++) {
            for(let x = 0; x < shape[y].length; x++) {
                if(shape[y][x]) {
                    this.drawBlock(this.currentX + x, ghostY + y, color, true);
                }
            }
        }
    }

    // 레벨 변경 시 속도 업데이트
    updateGameSpeed() {
        if (this.isPlaying) {
            this.stopGravity();
            this.startGravity();
        }
    }
}

// 게임 시작
document.addEventListener('DOMContentLoaded', () => {
    const game = new TetrisGame();
}); 