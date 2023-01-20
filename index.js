const alphaRegex = new RegExp("[a-zA-Z]");
const wordLength = 5;
const winningWord = "POINT";

let validWords;
let currentRow = 1;
let gameWon = null;

setup()
  .then(() => console.log("Setup complete"))
  .catch((e) => console.error(e));

/**
 * Sets up the wordle grid and loads saved data if available
 * @returns {Promise<void>}
 */
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

  fetch("./words.json").then((r) => {
    r.json().then((data) => {
      validWords = data;
    });
  });
}

/**
 * Updates each letter in the wordle grid from local storage
 * @param savedGrid {string[][]} The saved grid
 * @param box {HTMLDivElement} The current box
 */
function updateLetterFromLocalStorage(savedGrid, box) {
  if (!savedGrid) return;

  const i = parseInt(box.id.replace(/[^\d]*/, "")) - 1;
  const row = Math.floor(i / 5);
  if (row > 4) return;

  const col = i % 5;
  const letter = savedGrid[row][col];
  if (letter.length === 0) return;

  box.innerText = letter;
  if (row >= currentRow - 1) {
    if (letter !== "") {
      box.classList.add("letterPresent");
    }

    return;
  }

  if (winningWord[col] === letter) {
    box.classList.add("correctPlace");
  } else if (winningWord.includes(letter)) {
    box.classList.add("wrongPlace");
  } else if (letter.length > 0) {
    box.classList.add("wrongLetter");
  }
}

/**
 * Handles the keydown event
 * @param event {KeyboardEvent} The keydown event
 */
function letterEvent(event) {
  if (gameWon !== null) return;

  const letter = event.key;
  const row = document.getElementById(`wordleRow${currentRow}`);

  if (letter.length === 1 && alphaRegex.test(letter)) {
    // Letter
    addLetter(row, letter.toUpperCase());
  } else if (letter === "Backspace") {
    // Backspace
    if (row.firstElementChild.innerText.length === 0) return;
    removeLetter(row);
  } else if (letter === "Enter") {
    // Enter
    if (row.lastElementChild.innerText.length === 0) return;
    checkWord(row);
  }

  updateLocalStorage();
}

/**
 * Adds a letter to the row
 * @param row {HTMLDivElement} The row
 * @param letter {string} The letter
 */
function addLetter(row, letter) {
  // Check if row is full
  const emptyElements = [...row.children].filter(
    (e) => e.innerText.length === 0
  );
  if (emptyElements.length === 0) return;

  const firstElement = emptyElements[0];
  firstElement.innerText = letter;
  firstElement.classList.add("letterPresent");
}

/**
 * Removes the last letter from the row
 * @param row {HTMLDivElement} The row
 */
function removeLetter(row) {
  const reversedBoxes = [...row.children]
    .filter((e) => e.innerText.length > 0)
    .reverse();
  if (reversedBoxes.length === 0) return;

  reversedBoxes[0].innerText = "";
  reversedBoxes[0].classList.remove("letterPresent");
}

function updateLocalStorage() {
  const grid = [...document.getElementById("wordleGrid").children].map((row) =>
    [...row.children].map((e) => e.innerText)
  );

  const savedData = { currentRow, gameWon, grid };
  localStorage.setItem("savedData", JSON.stringify(savedData));
}

/**
 * Checks if the word is valid
 * @param row {HTMLDivElement} The current row
 */
function checkWord(row) {
  // Check if word is valid
  const word = [...row.children].reduce((a, b) => a + b.innerText, "");
  if (!validWords.includes(word.toLowerCase())) {
    // Adds red border and shakes the row
    [...row.children].forEach((e) => e.classList.add("invalidWord"));
    row.classList.add("shakeWord");

    // Stops shaking and removes red border after 1 second
    setTimeout(() => {
      row.classList.remove("shakeWord");
      [...row.children].forEach((e) => e.classList.remove("invalidWord"));
    }, 1000);

    return;
  }

  // Matches each letter with the correct word
  [...row.children].forEach((e, i) => {
    const currentLetter = e.innerText;

    if (winningWord[i] === currentLetter) {
      e.classList.add("correctPlace");
    } else if (winningWord.includes(currentLetter)) {
      e.classList.add("wrongPlace");
    } else {
      e.classList.add("wrongLetter");
    }
  });

  currentRow++;
  // Check if game is won
  if ([...row.children].reduce((a, b) => a + b.innerText, "") === winningWord) {
    gameWon = true;
  } else if (currentRow >= 7) {
    gameWon = false;
  }

  updateGameStatus();
}

/**
 * Updates the game status
 */
function updateGameStatus() {
  if (gameWon === null) return;

  let statusText;
  if (gameWon === true) {
    statusText = `Congrats! You guessed the word ${winningWord} in ${
      currentRow === 2 ? `${currentRow - 1} try` : `${currentRow - 1} tries`
    }.`;
  } else {
    statusText = `The correct word is ${winningWord}. You may try again tomorrow!`;
  }

  document.getElementById("statusText").innerText = statusText;
}
