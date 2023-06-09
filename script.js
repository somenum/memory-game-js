const modalContainer = document.getElementById("modal-container");
const startModal = document.getElementById("start-modal");
const endModal = document.getElementById("end-modal");
const startButton = document.getElementById("start-btn");
const replayButton = document.getElementById("replay-btn");
const gameGrid = document.getElementById("game-grid");
const gameContainer = document.getElementById("game-container");
const timeLeftSpan = document.getElementById("time-left");
const endMessage = document.getElementById("end-message");
const cards = document.getElementsByClassName("card");

class Card {
  constructor(matchId, theme) {
    this.matchId = matchId;
    this.theme = theme;
    this.element = this.createCardElement();
  }

  createCardElement() {
    const card = document.createElement("div");
    card.classList.add("card", "card-hidden");
    card.style.setProperty("--theme-color", this.theme.color);
    card.style.setProperty("--theme-font", this.theme.font);
    card.dataset.matchId = this.matchId;

    const number = document.createElement("span");
    number.classList.add("card-number");
    number.innerText = this.matchId;
    card.appendChild(number);

    return card;
  }
}

class MatchGrid {
  constructor(args) {
    this.width = args.width;
    this.height = args.height;
    this.columns = args.columns;
    this.rows = args.rows;
    this.timeLimit = args.timeLimit;
    this.theme = args.theme;
    this.timer = null;
    this.isPaused = false;
    this.isGameStarted = false;
    this.matchCount = 0;
    this.totalMatches = (this.columns * this.rows) / 2;
    this.flippedCards = [];
  }

  initializeGrid() {
    gameGrid.style.gridTemplateColumns = `repeat(${this.columns}, 1fr)`;
    gameGrid.style.gridTemplateRows = `repeat(${this.rows}, 1fr)`;
    gameContainer.style.setProperty("--theme-font", this.theme.font);
    modalContainer.style.setProperty("--theme-font", this.theme.font);

    const cards = [];
    for (let i = 1; i <= this.totalMatches; i++) {
      cards.push(new Card(i, this.theme), new Card(i, this.theme));
    }

    // Shuffle the cards
    for (let i = cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [cards[i], cards[j]] = [cards[j], cards[i]];
    }

    for (let card of cards) {
      gameGrid.appendChild(card.element);
    }

    gameGrid.addEventListener("click", (event) => {
      const card = event.target.closest(".card");
      if (card) {
        this.flipCard(event);
      }
    });
  }

  flipCard(event) {
    if (this.isPaused || !this.isGameStarted || this.flippedCards.length >= 2) {
      return;
    }

    const card = event.target.closest(".card");
    if (
      !card ||
      this.flippedCards.length >= 2 ||
      card.classList.contains("flipped") ||
      this.flippedCards.includes(card)
    ) {
      return;
    }

    // Add Anime.js animation
    const animation = anime({
      targets: card,
      rotateY: 180,
      easing: "easeInOutSine",
      duration: 400,
      autoplay: false,
      direction: "alternate",
    });

    card.classList.remove("card-hidden");
    card.classList.add("flipped");
    this.flippedCards.push(card);
    animation.restart();

    if (this.flippedCards.length === 2) {
      const [card1, card2] = this.flippedCards;
      const matchId1 = card1.dataset.matchId;
      const matchId2 = card2.dataset.matchId;

      if (matchId1 === matchId2) {
        this.matchCount++;
        card1.removeEventListener("click", this.flipCard.bind(this));
        card2.removeEventListener("click", this.flipCard.bind(this));

        if (this.matchCount === this.totalMatches) {
          this.endGame(true);
        }

        this.flippedCards = [];
      } else {
        this.isPaused = true;
        setTimeout(() => {
          for (let flippedCard of this.flippedCards) {
            flippedCard.classList.add("card-hidden");
            flippedCard.classList.remove("flipped");
          }

          this.flippedCards = [];
          this.isPaused = false;
        }, 1000);
      }
    }
  }

  startGame() {
    if (this.isGameStarted) return;

    this.isGameStarted = true;
    modalContainer.style.display = "none";
    endMessage.innerText = "";

    this.resetGame();
    this.timer = setInterval(() => {
      if (this.remainingTime > 0) {
        this.remainingTime--;
        timeLeftSpan.innerText = this.remainingTime;
      } else {
        this.endGame(false);
      }
    }, 1000);
  }

  resetGame() {
    this.matchCount = 0;
    this.flippedCards = [];
    this.isPaused = false;
    this.remainingTime = this.timeLimit;

    for (let card of cards) {
      card.classList.add("card-hidden");
      card.classList.remove("flipped");
    }
    endMessage.innerText = "";
    timeLeftSpan.innerText = this.remainingTime;
  }

  pauseGame() {
    if (!this.isGameStarted || this.isPaused) return;

    this.isPaused = true;
    clearInterval(this.timer);
  }

  resumeGame() {
    if (!this.isGameStarted || !this.isPaused) return;

    this.isPaused = false;
    this.timer = setInterval(() => {
      if (this.remainingTime > 0) {
        this.remainingTime--;
        timeLeftSpan.innerText = this.remainingTime;
      } else {
        this.endGame(false);
      }
    }, 1000);
  }

  endGame(isWin) {
    clearInterval(this.timer);
    this.isGameStarted = false;
    this.isPaused = false;

    endMessage.innerText = isWin
      ? "Congratulations! You won!"
      : "Game over! Time ran out.";
    modalContainer.style.display = "flex";
    startModal.style.display = "none";
    endModal.style.display = "block";
  }
}

const game = new MatchGrid({
  width: 400,
  height: 400,
  columns: 4,
  rows: 4,
  timeLimit: 60,
  theme: {
    color: "#336699",
    font: "Helvetica, sans-serif",
  },
});

game.initializeGrid();

startButton.addEventListener("click", () => {
  game.startGame();
});

replayButton.addEventListener("click", () => {
  game.startGame();
  modalContainer.style.display = "none";
});

gameGrid.addEventListener("mouseleave", () => {
  game.pauseGame();
});

gameGrid.addEventListener("mouseenter", () => {
  game.resumeGame();
});
