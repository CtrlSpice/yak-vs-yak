import React from "react";
import "../index.css";

const gridWidth = 7;

const cleanGrid = () => {
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
  return grid;
};

export default class Board extends React.Component {
  constructor(props) {
    super(props);

    let grid = cleanGrid();
    this.state = {
      grid: grid,
      isDone: false,
      blueIsNext: true,
      winner: null,
      sequence: null,
      message: null,
    };
  }

  componentDidMount() {
    let socket = this.props.socket;
    let mode = this.props.mode;

    socket.on("win", (data) => {
      this.setState(data);
    });

    socket.on("firstMove", () => {
      let currentYak = this.state.blueIsNext ? "blue" : "orange";
      // Blue goes first. Let the AI go first if it is blue.
      if (mode === "onePlayer" && currentYak !== this.props.colour) {
        console.log("AI makes first move.");
        this.aiMove();
      }
    });

    socket.on("turn", (data) => {
      this.setState({ grid: data.grid, blueIsNext: !this.state.blueIsNext });
      let currentYak = this.state.blueIsNext ? "blue" : "orange";

      if (mode === "onePlayer" && currentYak !== this.props.colour) {
        this.aiMove();
      }
    });

    socket.on("disconnected", (data) => {
      // Handle forfeit
      if (!this.state.isDone) {
        this.setState({
          isDone: true,
          winner: data.winner,
          message: "Your opponent saw something shiny and wandered off.",
        });
      }
    });

    socket.on("resetBoard", () => {
      let grid = cleanGrid();
      this.setState({
        grid: grid,
        isDone: false,
        blueIsNext: true,
        winner: null,
        sequence: null,
        message: null,
      });
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

  aiMove() {
    // The simplest AI. It places a yak on an open square
    if (this.state.isDone) return;
    let currentYak = this.state.blueIsNext ? "blue" : "orange";
    let socket = this.props.socket;
    let grid = this.state.grid.map((row) => row.slice());

    // TODO: Figure out how to do this with reduce()
    let openSpaces = [];

    for (let row = 0; row < grid.length; row++) {
      for (let col = 0; col < grid[row].length; col++) {

        if (grid[row][col] === "open") {
          openSpaces.push([row, col])
        }
      }
    }

    let [rowIndex, columnIndex] = openSpaces[Math.floor(Math.random() * openSpaces.length)]

    console.log(rowIndex, columnIndex);
    grid[rowIndex][columnIndex] = currentYak;
    socket.emit("move", { grid, rowIndex, columnIndex, currentYak });
  }

  renderSquare(rowIndex, columnIndex) {
    let className =
      this.state.sequence !== null &&
      this.state.sequence.some(
        (position) => position[0] === rowIndex && position[1] === columnIndex
      )
        ? "square win"
        : "square";

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
    let top = "";
    let bottom = "";
    let playAgain = null;

    if (this.state.isDone) {
      let socket = this.props.socket;
      let roomId = this.props.roomId;
      let mode = this.props.mode;

      top = <WinLabel winner={this.state.winner} colour={this.props.colour} />;
      bottom = this.state.message || <SadLabel />;
      playAgain = (
        <button
          className="menu-button"
          onClick={() => {
            socket.emit("playAgain", { roomId, mode });
          }}
        >
          Another?
        </button>
      );
    } else {
      top = <GameLabel colour={this.props.colour} />;
      bottom = (
        <TurnLabel currentPlayer={currentPlayer} colour={this.props.colour} />
      );
      playAgain = null;
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
        <div className="status">{top}</div>
        <div className="game-board">{gameBoard}</div>
        <div className="status">{bottom}</div>
        <div className="status">{playAgain}</div>
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
  let currentPlayer =
    props.currentPlayer === props.colour
      ? " your "
      : props.currentPlayer + " yack's ";
  return (
    <p>
      It's
      <span className={"subtitle " + props.currentPlayer}>
        {" " + currentPlayer}
      </span>
      turn.
    </p>
  );
}

function GameLabel(props) {
  let indefiniteArticle = props.colour === "orange" ? " an " : " a ";
  return (
    <React.Fragment>
      <p>
        You are {indefiniteArticle}
        <span className={"subtitle " + props.colour}>{props.colour + " "}</span>
        yak.
      </p>
    </React.Fragment>
  );
}

function SadLabel() {
  const sadness = [
    "Was it worth it? Was any of it really worth it?",
    "But at what cost?",
    "You felled the trees that bore the fruit of your long labour.",
    "The land may never recover from your greed.",
    "We all lose, if you think about it.",
    "Did you learn anything? Anything at all?",
    "All that ecological upheaval, for nothing.",
    "Take a moment to reflect on the futility of it all.",
    "And so the dens and burrows stood empty in your wake.",
  ];

  let randomSad = sadness[Math.floor(Math.random() * sadness.length)];
  return <p>{randomSad}</p>;
}

function WinLabel(props) {
  let label = "";
  if (props.colour === props.winner) {
    label = (
      <p>
        Yay.
        <span className={"subtitle " + props.winner}>{" You "}</span>
        win.
      </p>
    );
  } else {
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
    label = (
      <p>
        Boo.
        <span className={"subtitle " + props.winner}>{winner}</span>
        wins.
      </p>
    );
  }
  return label;
}
