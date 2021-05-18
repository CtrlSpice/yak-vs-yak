export function checkWinCondition(gameGrid, rowIndex, columnIndex) {
  // Check if the move that was just played wins the game
  let winSequenceLength = 4;
  let directions = [
    { head: "W", tail: "E" }, // Horizontal
    { head: "N", tail: "S" }, // Vertical
    { head: "NE", tail: "SW" }, // + Diag
    { head: "NW", tail: "SE" }, // - Diag
  ];

  // Concatonate the head and tail sequences with the current block.
  for (let direction of directions) {
    // Order doesn't matter here
    let sequence = buildSequence(
      gameGrid,
      rowIndex,
      columnIndex,
      direction.head
    ).concat(
      [[rowIndex, columnIndex]],
      buildSequence(gameGrid, rowIndex, columnIndex, direction.tail)
    );

    if (sequence.length >= winSequenceLength)
      return { isWin: true, sequence: sequence };
  }

  return { isWin: false };
}

export function prepareNextMove(gameGrid, rowIndex, columnIndex) {
  let grid = gameGrid;

  // Works with both odd and even number of columns, in case we want a bigger grid
  let mid = Math.floor(grid.length / 2);

  // Follow Connect Four rules with mid as the ingress point,
  if (columnIndex < mid && grid[rowIndex][columnIndex + 1] === "locked") {
    // If the square to the right is locked, make it available
    grid[rowIndex][columnIndex + 1] = "open";
  } else if (
    columnIndex > mid &&
    grid[rowIndex][columnIndex - 1] === "locked"
  ) {
    // If the square to the left is locked, make it available
    grid[rowIndex][columnIndex - 1] = "open";
  }

  // Check for a tie
  let isTie = !grid.some((row) => row.includes("open"));
  if (isTie) {
    return { isTie };
  }
  return { grid };
}

// Builds an array of adjacent squares that have the same value
function buildSequence(grid, rowIndex, columnIndex, direction, sequence = []) {
  let seq = sequence;
  let currentValue = grid[rowIndex][columnIndex];
  let nextValue;
  let nextRow;
  let nextColumn;

  // This can be simplified. It's just easier to debug this way.
  switch (direction) {
    case "N":
      nextRow = rowIndex - 1;
      nextColumn = columnIndex;
      break;

    case "S":
      nextRow = rowIndex + 1;
      nextColumn = columnIndex;
      break;

    case "E":
      nextRow = rowIndex;
      nextColumn = columnIndex + 1;
      break;

    case "W":
      nextRow = rowIndex;
      nextColumn = columnIndex - 1;
      break;

    case "NE":
      nextRow = rowIndex - 1;
      nextColumn = columnIndex + 1;
      break;

    case "SW":
      nextRow = rowIndex + 1;
      nextColumn = columnIndex - 1;
      break;

    case "NW":
      nextRow = rowIndex - 1;
      nextColumn = columnIndex - 1;
      break;

    case "SE":
      nextRow = rowIndex + 1;
      nextColumn = columnIndex + 1;
      break;

    default:
      break;
  }

  if (nextRow >= 0 && nextRow < grid.length) {
    nextValue = grid[nextRow][nextColumn];
    if (currentValue === nextValue) {
      seq.push([nextRow, nextColumn]);
      seq = buildSequence(grid, nextRow, nextColumn, direction, seq);
    }
  }
  return seq;
}
