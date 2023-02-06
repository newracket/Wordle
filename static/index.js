const alphaRegex = new RegExp("[a-zA-Z]");
let winningWord = "";

let validWords;
let currentRow = 1;
let gameWon = null;

let shaking = false;

setup()
  .then(() => console.log("Setup complete"))
  .catch((e) => console.error(e));

/**
 * Sets up the wordle grid and loads saved data if available
 * @returns {Promise<void>}
 */
async function setup() {
  await doFetches();

  const savedData = JSON.parse(localStorage.getItem("savedData"));
  let savedGrid;

  if (savedData) {
    if (savedData.winningWord !== winningWord) {
      localStorage.removeItem("savedData");
    } else {
      currentRow = savedData.currentRow;
      savedGrid = savedData.grid;
      gameWon = savedData.gameWon;
    }
  }

  const grid = document.getElementById("wordleGrid");
  let row = document.createElement("div");
  row.classList.add("wordleRow");
  row.id = "wordleRow1";

  let wordLetters = winningWord.split("");
  for (let i = 0; i <= 30; i++) {
    if (i % 5 === 0 && i !== 0) {
      [...row.children].forEach((box) => {
        updateLetterFromLocalStorage(
          savedGrid,
          box,
          wordLetters,
          checkWrongPlace
        );
      });
      wordLetters = winningWord.split("");

      grid.appendChild(row);
      row = document.createElement("div");
      row.classList.add("wordleRow");
      row.id = `wordleRow${Math.ceil((i + 1) / 5)}`;
    }

    const box = document.createElement("div");
    box.classList.add("wordleBox");
    box.id = `wordleBox${i + 1}`;
    updateLetterFromLocalStorage(
      savedGrid,
      box,
      wordLetters,
      checkCorrectPlace
    );

    row.appendChild(box);
  }

  document.body.addEventListener("keydown", (event) => {
    letterEvent(event.key);
  });
  updateGameStatus();
}

async function doFetches() {
  return new Promise((resolve) => {
    let firstDone = false;
    fetch(validWordsUrl).then((r) => {
      r.json().then((data) => {
        validWords = data;
        console.log(validWords);

        if (firstDone) resolve();
        else firstDone = true;
      });
    });

    fetch(winningWordUrl).then((r) => {
      r.text().then((data) => {
        winningWord = data.toUpperCase();

        if (firstDone) resolve();
        else firstDone = true;
      });
    });
  });
}

function checkCorrectPlace(letter, col, box, wordLetters) {
  const keyboardLetter = document.getElementById(letter);

  if (winningWord[col] === letter) {
    box.classList.add("correctPlace");
    keyboardLetter.classList.add("correctPlace");
    wordLetters[col] = "";
  }
}

function checkWrongPlace(letter, col, box, wordLetters) {
  const keyboardLetter = document.getElementById(letter);
  let classWord = "wrongLetter";

  if (wordLetters.includes(letter)) {
    classWord = "wrongPlace";
    wordLetters[wordLetters.indexOf(letter)] = "";
  }

  box.classList.add(classWord);
  keyboardLetter.classList.add(classWord);
}

/**
 * Updates each letter in the wordle grid from local storage
 * @param savedGrid {string[][]} The saved grid
 * @param box {HTMLDivElement} The current box
 */
function updateLetterFromLocalStorage(
  savedGrid,
  box,
  wordLetters,
  colorsFunction
) {
  if (!savedGrid) return;

  const i = parseInt(box.id.replace(/\D*/, "")) - 1;
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

  colorsFunction(letter, col, box, wordLetters);
}

function handleClick(event) {
  letterEvent(event.innerText !== "Delete" ? event.innerText : "Backspace");
}

/**
 * Handles the keydown event
 * @param key {string} The key that was pressed
 */
function letterEvent(key) {
  if (gameWon !== null) return;

  const letter = key;
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

  const savedData = { currentRow, gameWon, winningWord, grid };
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
    if (!shaking) {
      shaking = true;
      setTimeout(() => {
        row.classList.remove("shakeWord");
        [...row.children].forEach((e) => e.classList.remove("invalidWord"));
        shaking = false;
      }, 1000);
    }

    return;
  }

  // Matches each letter with the correct word
  const wordLetters = winningWord.split("");
  [...row.children].forEach((e, i) => {
    checkCorrectPlace(e.innerText, i, e, wordLetters);
  });
  [...row.children].forEach((e, i) => {
    checkWrongPlace(e.innerText, i, e, wordLetters);
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
