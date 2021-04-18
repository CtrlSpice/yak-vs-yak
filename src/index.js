import React from "react";
import ReactDOM from "react-dom";
import { checkWinCondition, prepareNextMove } from "./game.js";
import "./index.css";

const gridWidth = 7;

function Square(props) {
  let src = "images/" + props.value + ".svg";
  return (
    <button key={props.position} className="square" onClick={props.onClick}>
      <img className="meeple" src={src} alt={props.value} />
    </button>
  );
}

function TurnStatus(props) {
  let currentPlayer = props.currentPlayer + " yack";
  return (
    <p>
      It's
      <span className={"subtitle " + props.currentPlayer}>
        {" " + currentPlayer}
      </span>
      's turn.
    </p>
  );
}

function FinalStatus(props) {
  let winner = "";

  switch (props.winner) {
    case "blue":
      winner = " Blue Yak ";
      break;
    case "orange":
      winner = " Orange Yak ";
      break;

    case "tie":
      winner = " Capitalism ";
      break;

    default:
      break;
  }
  return (
    <p>
      Yay.
      <span className={"subtitle " + props.winner}>{winner}</span>
      wins.
    </p>
  );
}

class Board extends React.Component {
  constructor(props) {
    super(props);
    // Start with a 7x7 grid full of null
    let grid = [];
    for (let rowIndex = 0; rowIndex < gridWidth; rowIndex++) {
      let row = [];
      for (let columnIndex = 0; columnIndex < gridWidth; columnIndex++) {
        if (columnIndex === 0 || columnIndex === gridWidth - 1) {
          row.push("open");
        } else row.push("locked");
      }
      grid.push(row);
    }

    this.state = {
      grid: grid,
      isDone: false,
      blueIsNext: true,
      winner: null,
    };
  }

  handleClick(rowIndex, columnIndex) {
    if (this.state.isDone) return;

    let grid = this.state.grid.map((row) => row.slice());
    let currentValue = this.state.blueIsNext ? "blue" : "orange";

    // Click on an open (grass) square while the game is running
    if (!this.state.isDone && grid[rowIndex][columnIndex] === "open") {
      let nextState;
      grid[rowIndex][columnIndex] = currentValue;
      //this.setState({ grid: grid });

      // Check win condition
      let winCondition = checkWinCondition(grid, rowIndex, columnIndex);
      if (winCondition.isWin) {
        nextState = { grid: grid, isDone: true, winner: currentValue };
      } else {
        // Set the board up for the next move
        nextState = prepareNextMove(
          grid,
          rowIndex,
          columnIndex,
          this.state.blueIsNext
        );
      }
      this.setState(nextState);
    }
  }

  renderSquare(rowIndex, columnIndex) {
    return (
      <Square
        position={"r" + rowIndex + "c" + columnIndex}
        value={this.state.grid[rowIndex][columnIndex]}
        onClick={() => this.handleClick(rowIndex, columnIndex)}
      />
    );
  }

  render() {
    let currentPlayer = this.state.blueIsNext ? "blue" : "orange";
    let status = this.state.isDone ? (
      <FinalStatus winner={this.state.winner} />
    ) : (
      <TurnStatus currentPlayer={currentPlayer} />
    );

    // This is less awkward. Less 🐢
    let grid = this.state.grid.slice(); //Strictly to make the next bit readable
    let gameBoard = grid.map((_, rowIndex) => (
      <div key={"r" + rowIndex} className="board-row">
        {grid[rowIndex].map((_, cloumnIndex) =>
          this.renderSquare(rowIndex, cloumnIndex)
        )}
      </div>
    ));
    return (
      <div>
        <div className="status">{status}</div>
        <div className="game-board">{gameBoard}</div>
      </div>
    );
  }
}

class Game extends React.Component {
  render() {
    return (
      <div className="game">
        <Board />
      </div>
    );
  }
}

// ========================================
ReactDOM.render(<Game />, document.getElementById("root"));
