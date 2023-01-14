const alphaRegex = new RegExp("[a-zA-Z]");
const wordLength = 5;
const word = "POINT";

let currentRow = 1;
let gameWon = null;

setup();

function setup() {
  const savedData = JSON.parse(localStorage.getItem("savedData"));
  let savedGrid;

  if (savedData) {
    currentRow = savedData.currentRow;
    savedGrid = savedData.grid;
    gameWon = savedData.gameWon;
  }

  const grid = document.getElementById("wordleGrid");
  let row = document.createElement("div");
  row.classList.add("wordleRow");
  row.id = "wordleRow1";

  for (let i = 0; i <= 30; i++) {
    if (i % 5 === 0 && i !== 0) {
      grid.appendChild(row);
      row = document.createElement("div");
      row.classList.add("wordleRow");
      row.id = `wordleRow${Math.ceil((i + 1) / 5)}`;
    }

    const box = document.createElement("div");
    box.classList.add("wordleBox");
    box.id = `wordleBox${i + 1}`;
    updateLetterFromLocalStorage(savedGrid, box);

    row.appendChild(box);
  }

  document.body.addEventListener("keydown", letterEvent);
  updateGameStatus();
}

function updateLetterFromLocalStorage(savedGrid, box) {
  if (!savedGrid) return;

  const i = parseInt(box.id.replace(/[^\d]*/, "")) - 1;
  const row = Math.floor(i / 5);
  if (row > 4) return;

  const col = i % 5;
  const letter = savedGrid[row][col];
  if (letter.length === 0) return;

  box.innerText = letter;
  if (row >= currentRow - 1) return;
  
  if (word[col] === letter) {
    box.classList.add("correctPlace");
  } else if (word.includes(letter)) {
    box.classList.add("wrongPlace");
  } else if (letter.length > 0) {
    box.classList.add("wrongLetter");
  }
}

function letterEvent(event) {
  if (gameWon !== null) return;

  const letter = event.key;
  const row = document.getElementById(`wordleRow${currentRow}`);

  if (letter.length === 1 && alphaRegex.test(letter)) {
    addLetter(row, letter.toUpperCase());
  } else if (letter === "Backspace") {
    if (row.firstElementChild.innerText.length === 0) return;
    removeLetter(row);
  } else if (letter === "Enter") {
    if (row.lastElementChild.innerText.length === 0) return;
    checkWord(row);
  }

  updateLocalStorage();
}

function addLetter(row, letter) {
  const emptyElements = [...row.children].filter(e => e.innerText.length === 0);
  if (emptyElements.length === 0) return;

  const firstElement = emptyElements[0];
  firstElement.innerText = letter;
}

function removeLetter(row) {
  const reversedBoxes = [...row.children].filter(e => e.innerText.length > 0).reverse();
  if (reversedBoxes.length === 0) return;

  reversedBoxes[0].innerText = "";
}

function updateLocalStorage() {
  const grid = [...document.getElementById("wordleGrid").children].map(row =>
    [...row.children].map(e => e.innerText));

  const savedData = { currentRow, gameWon, grid };
  localStorage.setItem("savedData", JSON.stringify(savedData));
}

function checkWord(row) {
  [...row.children].forEach((e, i) => {
    const currentLetter = e.innerText;

    if (word[i] === currentLetter) {
      e.classList.add("correctPlace");
    } else if (word.includes(currentLetter)) {
      e.classList.add("wrongPlace");
    } else {
      e.classList.add("wrongLetter");
    }
  });

  currentRow++;
  if ([...row.children].reduce((a, b) => a += b.innerText, "") === word) {
    gameWon = true;
  } else if (currentRow >= 7) {
    gameWon = false;
  }

  updateGameStatus();
}

function updateGameStatus() {
  if (gameWon === null) return;

  let statusText;
  if (gameWon === true) {
    statusText = `Congrats! You guessed the word ${word} in ${currentRow === 2 ? `${currentRow - 1} try` : `${currentRow - 1} tries`}.`;
  } else {
    statusText = `The correct word is ${word}. You may try again tomorrow!`;
  }

  document.getElementById("statusText").innerText = statusText;
}