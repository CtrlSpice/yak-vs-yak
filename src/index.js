import React from "react";
import ReactDOM from "react-dom";
import StartMenu from "./components/startMenu.js";
import Board from "./components/board.js";
import socketClient from "socket.io-client";

class Game extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      socket: null,
      playerId: null,
      roomId: null,
      mode: null,
      colour: null,
      moveList: [],
      isActive: false,
      error: null,
    };
  }

  componentDidMount() {
    let socket = socketClient();
    this.setState({ socket });

    socket.on("connected", (data) => {
      let playerId = data.playerId;
      this.setState({ playerId });
    });

    socket.on("created", (data) => {
      let roomId = data.roomId;
      let mode = data.mode;
      this.setState({ roomId, mode });
    });

    socket.on("joined", (data) => {
      let mode = data.mode;
      let roomId = data.roomId;
      let isActive = true;

      let colour;
      if (mode === "demo") {
        colour = "observer";
      } else {
        colour = data.orange === this.state.playerId ? "orange" : "blue";
      }

      this.setState({ roomId, colour, mode, isActive });
      socket.emit("updateRoomId", roomId);
    });

    socket.on("resetGame", () => {
      this.setState({
        roomId: null,
        colour: null,
        mode: null,
        moveList: [],
        isActive: false,
        error: null,
      });
    });

    socket.on("error", (error) => this.setState({ error }));
  }

  renderStartMenu() {
    return (
      <StartMenu
        roomId={this.state.roomId}
        playerId={this.state.playerId}
        socket={this.state.socket}
        error={this.state.error}
      />
    );
  }

  render() {
    if (this.state.isActive) {
      return (
        <div className="game">
          <Board
            roomId={this.state.roomId}
            colour={this.state.colour}
            socket={this.state.socket}
            moveList={this.state.moveList}
            mode={this.state.mode}
          />
        </div>
      );
    } else {
      return <div className="game">{this.renderStartMenu()}</div>;
    }
  }
}

// ========================================
ReactDOM.render(<Game />, document.getElementById("root"));
