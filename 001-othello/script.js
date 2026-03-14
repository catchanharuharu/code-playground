// ゲーム状態の管理
class OthelloGame {
  constructor() {
    this.board = Array(8)
      .fill(null)
      .map(() => Array(8).fill(null));
    this.currentPlayer = "black";
    this.blackScore = 2;
    this.whiteScore = 2;
    this.isGameOver = false;
    this.showHints = false;
    this.passCount = 0;

    this.initializeBoard();
    this.render();
    this.updateScores();
    this.attachEventListeners();
  }

  // 初期配置
  initializeBoard() {
    this.board[3][3] = "white";
    this.board[3][4] = "black";
    this.board[4][3] = "black";
    this.board[4][4] = "white";
  }

  // ボードをレンダリング
  render() {
    const boardElement = document.getElementById("board");
    boardElement.innerHTML = "";

    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const cell = document.createElement("div");
        cell.className = "cell";
        cell.dataset.row = row;
        cell.dataset.col = col;

        if (this.board[row][col]) {
          const stone = document.createElement("div");
          stone.className = `stone ${this.board[row][col]}`;
          cell.appendChild(stone);
        }

        // 合法手の表示
        if (
          this.showHints &&
          !this.isGameOver &&
          this.isValidMove(row, col, this.currentPlayer)
        ) {
          cell.classList.add("valid-move");
        }

        cell.addEventListener("click", () => this.handleCellClick(row, col));
        boardElement.appendChild(cell);
      }
    }

    this.updateTurnIndicator();
  }

  // セルクリック処理
  handleCellClick(row, col) {
    // 白のターンの場合は人間が操作できない
    if (this.currentPlayer === "white") {
      return;
    }

    if (this.isGameOver || this.board[row][col] !== null) {
      return;
    }

    if (!this.isValidMove(row, col, this.currentPlayer)) {
      this.showMessage("そこには置けません", "warning");
      return;
    }

    this.makeMove(row, col, this.currentPlayer);
  }

  // 手を実行
  makeMove(row, col, player) {
    this.placeStone(row, col, player);
    this.flipStones(row, col, player);

    // アニメーション完了を待ってからターン交代
    const flipCount = this.countFlips(row, col, player);
    const animationDelay = flipCount * 50 + 200;

    setTimeout(() => {
      this.updateScores();

      // ターン交代
      this.currentPlayer = this.currentPlayer === "black" ? "white" : "black";
      this.passCount = 0;

      // 次のプレイヤーが置ける場所があるかチェック
      if (!this.hasValidMoves(this.currentPlayer)) {
        this.handlePass();
      } else {
        this.render();

        // 白のターンならコンピュータが考える
        if (this.currentPlayer === "white" && !this.isGameOver) {
          setTimeout(() => this.computerMove(), 600);
        }
      }
    }, animationDelay);
  }

  // コンピュータの手
  computerMove() {
    if (this.isGameOver) {
      return;
    }

    const validMoves = this.getValidMoves("white");

    if (validMoves.length === 0) {
      return;
    }

    // 簡易AI: 最も多くの石を裏返せる手を選ぶ
    let bestMove = null;
    let maxFlips = -1;

    for (const [row, col] of validMoves) {
      const flips = this.countFlips(row, col, "white");

      // 角を優先
      const isCorner = (row === 0 || row === 7) && (col === 0 || col === 7);
      const bonus = isCorner ? 100 : 0;

      const score = flips + bonus;

      if (score > maxFlips) {
        maxFlips = score;
        bestMove = [row, col];
      }
    }

    if (bestMove) {
      const [row, col] = bestMove;
      this.makeMove(row, col, "white");
    }
  }

  // 合法手のリストを取得
  getValidMoves(player) {
    const moves = [];
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        if (this.isValidMove(row, col, player)) {
          moves.push([row, col]);
        }
      }
    }
    return moves;
  }

  // 裏返せる石の数をカウント
  countFlips(row, col, player) {
    const directions = [
      [-1, -1],
      [-1, 0],
      [-1, 1],
      [0, -1],
      [0, 1],
      [1, -1],
      [1, 0],
      [1, 1],
    ];

    const opponent = player === "black" ? "white" : "black";
    let totalFlips = 0;

    for (const [dx, dy] of directions) {
      const line = [];
      let x = row + dx;
      let y = col + dy;

      while (
        x >= 0 &&
        x < 8 &&
        y >= 0 &&
        y < 8 &&
        this.board[x][y] === opponent
      ) {
        line.push([x, y]);
        x += dx;
        y += dy;
      }

      if (
        x >= 0 &&
        x < 8 &&
        y >= 0 &&
        y < 8 &&
        this.board[x][y] === player &&
        line.length > 0
      ) {
        totalFlips += line.length;
      }
    }

    return totalFlips;
  }

  // 石を配置
  placeStone(row, col, player) {
    this.board[row][col] = player;
  }

  // 石を裏返す
  flipStones(row, col, player) {
    const directions = [
      [-1, -1],
      [-1, 0],
      [-1, 1],
      [0, -1],
      [0, 1],
      [1, -1],
      [1, 0],
      [1, 1],
    ];

    const opponent = player === "black" ? "white" : "black";
    const toFlip = [];

    for (const [dx, dy] of directions) {
      const line = [];
      let x = row + dx;
      let y = col + dy;

      while (
        x >= 0 &&
        x < 8 &&
        y >= 0 &&
        y < 8 &&
        this.board[x][y] === opponent
      ) {
        line.push([x, y]);
        x += dx;
        y += dy;
      }

      if (
        x >= 0 &&
        x < 8 &&
        y >= 0 &&
        y < 8 &&
        this.board[x][y] === player &&
        line.length > 0
      ) {
        toFlip.push(...line);
      }
    }

    // アニメーション付きで裏返す
    toFlip.forEach(([x, y], index) => {
      setTimeout(() => {
        this.board[x][y] = player;
        this.animateFlip(x, y);
      }, index * 50);
    });
  }

  // 裏返しアニメーション
  animateFlip(row, col) {
    const cells = document.querySelectorAll(".cell");
    const index = row * 8 + col;
    const cell = cells[index];
    const stone = cell.querySelector(".stone");

    if (stone) {
      stone.classList.add("flipping");
      setTimeout(() => {
        stone.className = `stone ${this.board[row][col]}`;
      }, 300);
    }
  }

  // 合法手判定
  isValidMove(row, col, player) {
    if (this.board[row][col] !== null) {
      return false;
    }

    const directions = [
      [-1, -1],
      [-1, 0],
      [-1, 1],
      [0, -1],
      [0, 1],
      [1, -1],
      [1, 0],
      [1, 1],
    ];

    const opponent = player === "black" ? "white" : "black";

    for (const [dx, dy] of directions) {
      let x = row + dx;
      let y = col + dy;
      let hasOpponent = false;

      while (
        x >= 0 &&
        x < 8 &&
        y >= 0 &&
        y < 8 &&
        this.board[x][y] === opponent
      ) {
        hasOpponent = true;
        x += dx;
        y += dy;
      }

      if (
        hasOpponent &&
        x >= 0 &&
        x < 8 &&
        y >= 0 &&
        y < 8 &&
        this.board[x][y] === player
      ) {
        return true;
      }
    }

    return false;
  }

  // 合法手が存在するかチェック
  hasValidMoves(player) {
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        if (this.isValidMove(row, col, player)) {
          return true;
        }
      }
    }
    return false;
  }

  // パス処理
  handlePass() {
    this.passCount++;

    if (this.passCount >= 2) {
      // 両者ともパス = ゲーム終了
      this.endGame();
      return;
    }

    this.showMessage(
      `${
        this.currentPlayer === "black" ? "あなた" : "CPU"
      }は置ける場所がありません。パスします。`,
      "info"
    );

    setTimeout(() => {
      this.currentPlayer = this.currentPlayer === "black" ? "white" : "black";

      if (!this.hasValidMoves(this.currentPlayer)) {
        this.handlePass();
      } else {
        this.render();

        // 白のターンならコンピュータが考える
        if (this.currentPlayer === "white" && !this.isGameOver) {
          setTimeout(() => this.computerMove(), 800);
        }
      }
    }, 2000);
  }

  // スコア更新
  updateScores() {
    this.blackScore = 0;
    this.whiteScore = 0;

    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        if (this.board[row][col] === "black") {
          this.blackScore++;
        } else if (this.board[row][col] === "white") {
          this.whiteScore++;
        }
      }
    }

    document.getElementById("blackScore").textContent = this.blackScore;
    document.getElementById("whiteScore").textContent = this.whiteScore;

    // ボードが満杯かチェック
    if (this.blackScore + this.whiteScore === 64) {
      this.endGame();
    }
  }

  // ターン表示更新
  updateTurnIndicator() {
    const turnText = this.currentPlayer === "black" ? "YOU" : "CPU";
    document.getElementById("currentTurn").textContent = turnText;

    const blackPlayer = document.getElementById("blackPlayer");
    const whitePlayer = document.getElementById("whitePlayer");

    if (this.currentPlayer === "black") {
      blackPlayer.classList.add("active");
      whitePlayer.classList.remove("active");
    } else {
      whitePlayer.classList.add("active");
      blackPlayer.classList.remove("active");
    }
  }

  // メッセージ表示
  showMessage(message, type = "info") {
    const messageElement = document.getElementById("gameMessage");
    messageElement.textContent = message;
    messageElement.className = "game-message show";

    setTimeout(() => {
      messageElement.classList.remove("show");
    }, 3000);
  }

  // ゲーム終了
  endGame() {
    this.isGameOver = true;
    const modal = document.getElementById("gameOverModal");
    const result = document.getElementById("modalResult");

    let resultText = "";
    if (this.blackScore > this.whiteScore) {
      resultText = "🎉 あなたの勝利! 🎉";
    } else if (this.whiteScore > this.blackScore) {
      resultText = "😢 CPUの勝利... 😢";
    } else {
      resultText = "🤝 引き分け! 🤝";
    }

    result.textContent = resultText;
    document.getElementById("modalBlackScore").textContent = this.blackScore;
    document.getElementById("modalWhiteScore").textContent = this.whiteScore;

    modal.classList.add("show");
  }

  // ヒント切り替え
  toggleHints() {
    this.showHints = !this.showHints;
    const hintBtn = document.getElementById("hintBtn");

    if (this.showHints) {
      hintBtn.classList.add("active");
    } else {
      hintBtn.classList.remove("active");
    }

    this.render();
  }

  // リセット
  reset() {
    this.board = Array(8)
      .fill(null)
      .map(() => Array(8).fill(null));
    this.currentPlayer = "black";
    this.blackScore = 2;
    this.whiteScore = 2;
    this.isGameOver = false;
    this.showHints = false;
    this.passCount = 0;

    const hintBtn = document.getElementById("hintBtn");
    hintBtn.classList.remove("active");

    const modal = document.getElementById("gameOverModal");
    modal.classList.remove("show");

    this.initializeBoard();
    this.render();
    this.updateScores();

    document.getElementById("gameMessage").textContent = "";
  }

  // イベントリスナー設定
  attachEventListeners() {
    document
      .getElementById("resetBtn")
      .addEventListener("click", () => this.reset());
    document
      .getElementById("hintBtn")
      .addEventListener("click", () => this.toggleHints());
    document
      .getElementById("playAgainBtn")
      .addEventListener("click", () => this.reset());
  }
}

// ゲーム開始
let game;
window.addEventListener("DOMContentLoaded", () => {
  game = new OthelloGame();
});
