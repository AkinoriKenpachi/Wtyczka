let initialCellsCount = 10;
var initialBoard;
var saveBoard;

function generateBoard() {
  return Array.from({ length: 9 }, () => Array(9).fill(0));
}

function populateBoard(board) {
  return new Promise((resolve) => {
    const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    shuffleArray(numbers);

    for (let col = 0; col < 9; col++) {
      board[0][col] = numbers[col];
    }

    solveSudoku(board, 1, 0);

    const initialCells = new Set();

    while (initialCells.size < initialCellsCount) {
      const row = Math.floor(Math.random() * 9);
      const col = Math.floor(Math.random() * 9);
      initialCells.add(row * 9 + col);
    }

    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (!initialCells.has(row * 9 + col)) {
          board[row][col] = 0;
        }
      }
    }

    resolve(); // Call resolve() after the board has been fully populated
  });
}


function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

function solveSudoku(board, row = 0, col = 0) {
  if (row === 9) return true;

  const [nextRow, nextCol] = col === 8 ? [row + 1, 0] : [row, col + 1];

  if (board[row][col] !== 0) {
    return solveSudoku(board, nextRow, nextCol);
  }

  for (let num = 1; num <= 9; num++) {
    if (isValid(board, row, col, num)) {
      board[row][col] = num;
      if (solveSudoku(board, nextRow, nextCol)) return true;
      board[row][col] = 0;
    }
  }

  return false;
}

function isValid(board, row, col, num) {
  for (let i = 0; i < 9; i++) {
    if (board[row][i] === num || board[i][col] === num) return false;
  }

  const boxStartRow = Math.floor(row / 3) * 3;
  const boxStartCol = Math.floor(col / 3) * 3;
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      if (board[boxStartRow + i][boxStartCol + j] === num) return false;
    }
  }

  return true;
}

function isSolved(board) {
  for (let row = 0; row < 9; row++) {
    const rowSet = new Set();
    const colSet = new Set();
    for (let col = 0; col < 9; col++) {
      if (board[row][col] === 0 || board[col][row] === 0) {
        return false;
      }
      rowSet.add(board[row][col]);
      colSet.add(board[col][row]);
    }
    if (rowSet.size !== 9 || colSet.size !== 9) {
      return false;
    }
  }

  for (let boxRow = 0; boxRow < 3; boxRow++) {
    for (let boxCol = 0; boxCol < 3; boxCol++) {
      const boxSet = new Set();
      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
          const num = board[boxRow * 3 + i][boxCol * 3 + j];
          if (num === 0 || boxSet.has(num)) {
            return false;
          }
          boxSet.add(num);
        }
      }
    }
  }

  return true;
}
function drawBoard()
{
  const table = document.getElementById("sudoku-board");
  table.innerHTML = ""; 

  for (let row = 0; row < 9; row++) {
    const tr = document.createElement("tr");

    for (let col = 0; col < 9; col++) {
      const td = document.createElement("td");
      td.setAttribute("contenteditable", "true");
      td.classList.add("cell");

      if (col === 2 || col === 5) td.classList.add("bold-right");
      if (row === 2 || row === 5) td.classList.add("bold-bottom");

      tr.appendChild(td);
    }

    table.appendChild(tr);
  }
}
function displayBoard(board) {

	drawBoard();
  const cells = document.getElementsByClassName("cell");
  Array.from(cells).forEach((cell, i) => {
    const row = Math.floor(i / 9);
    const col = i % 9;
    const initialValue = board[row][col];

    if (initialValue !== 0) {
      cell.textContent = initialValue;
      cell.setAttribute("contenteditable", "false");
    } else {
      cell.textContent = "";
      cell.setAttribute("contenteditable", "true");
    }

    cell.addEventListener("input", (e) => {
      const value = e.target.textContent.trim();
      if (/^[1-9]$/.test(value)) {
        const num = parseInt(value, 10);
        if (isValid(board, row, col, num)) {
          e.target.style.backgroundColor = "#ffffff5c";
          board[row][col] = num;
          if (isSolved(board)) {
            alert("Congratulations! You've solved the puzzle!");
          }
        } else {
          e.target.style.backgroundColor = "red";
        }
      } else {
        e.target.textContent = "";
        e.target.style.backgroundColor = "red";
        board[row][col] = 0;
      }
    });
	 cell.addEventListener("keydown", (e) => {
		  if ((e.key.length > 1 || !/^[1-9]$/.test(e.key)) || e.key === "Backspace") {
			  if(e.key !== "Backspace") {
				e.preventDefault();
			  } else {
				e.preventDefault();
				e.target.textContent = "";
				e.target.style.backgroundColor = "#ffffff5c";
				board[row][col] = 0;
			  }
		  } else {
			// Allow only one character
			e.target.textContent = "";
		  }
		});
	});
}

function resetGame() {
   initialBoard = JSON.parse(JSON.stringify(saveBoard));
	displayBoard(initialBoard);
}

async function newGame(newInitialCellsCount) {
  initialCellsCount = newInitialCellsCount;
  initialBoard = generateBoard();
  await populateBoard(initialBoard);
  saveBoard = JSON.parse(JSON.stringify(initialBoard));
  displayBoard(initialBoard);
}
drawBoard();
// Example usage for resetting the game
document.getElementById("reset-button").addEventListener("click", resetGame);;

// Example usage for starting a new game with a user-defined number of initial cells
document.getElementById("new-game-button").addEventListener("click", () => {
  const userDefinedCellsCount = parseInt(prompt("Enter the number of initial cells:"));
  if (!isNaN(userDefinedCellsCount) && userDefinedCellsCount > 0 && userDefinedCellsCount <= 81) {
    newGame(userDefinedCellsCount);
  } else {
    alert("Please enter a valid number between 1 and 81.");
  }
});
