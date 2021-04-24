import React from "react";
import "../index.css";

const gridWidth = 7;

export default class Board extends React.Component {
  constructor(props) {
    super(props);

    // Start with a 7x7 grid full 'o trees (locked) and grass (open)
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
    console.log("My colour: " + props.colour);
    this.state = {
      grid: grid,
      isDone: false,
      blueIsNext: true,
      winner: null,
      winSequence: null,
    };
  }

  componentDidMount() {
    let socket = this.props.socket;

    socket.on("win", (data) => {
      this.setState(data);
    });

    socket.on("turn", (data) => {
      console.log(data);
      this.setState({grid : data.grid, blueIsNext: !this.state.blueIsNext})
    });
  }

  handleClick(rowIndex, columnIndex) {
    let currentYak = this.state.blueIsNext ? "blue" : "orange";
    if (this.state.isDone || currentYak !== this.props.colour) return;

    let socket = this.props.socket;
    let grid = this.state.grid.map((row) => row.slice());

    // Click on an open (grass) square while the game is running
    if (grid[rowIndex][columnIndex] === "open") {
      // Unleash the yak.
      grid[rowIndex][columnIndex] = currentYak;
      socket.emit("move", { grid, rowIndex, columnIndex, currentYak });
    }
  }

  renderSquare(rowIndex, columnIndex) {
    // TODO Add class name according to win sequence
    let className = "square";
    return (
      <Square
        position={"r" + rowIndex + "c" + columnIndex}
        value={this.state.grid[rowIndex][columnIndex]}
        className={className}
        onClick={() => this.handleClick(rowIndex, columnIndex)}
      />
    );
  }

  render() {
    let currentPlayer = this.state.blueIsNext ? "blue" : "orange";
    let win = "";
    let turn = "";

    if (this.state.isDone) {
      win = <WinLabel winner={this.state.winner} />;
    } else {
      turn = <TurnLabel currentPlayer={currentPlayer} />;
    }

    let grid = this.state.grid.map((row) => row.slice());
    let gameBoard = grid.map((_, rowIndex) => (
      <div key={"r" + rowIndex} className="board-row">
        {grid[rowIndex].map((_, cloumnIndex) =>
          this.renderSquare(rowIndex, cloumnIndex)
        )}
      </div>
    ));

    return (
      <div>
        <div className="status">{win}</div>
        <div className="game-board">{gameBoard}</div>
        <div className="status">{turn}</div>
      </div>
    );
  }
}

function Square(props) {
  let src = "images/" + props.value + ".svg";
  return (
    <button
      key={props.position}
      className={props.className}
      onClick={props.onClick}
    >
      <img className="meeple" src={src} alt={props.value} />
    </button>
  );
}

function TurnLabel(props) {
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

function WinLabel(props) {
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
