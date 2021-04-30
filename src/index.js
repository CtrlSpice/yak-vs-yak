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
      gameId: null,
      colour: null,
      isActive: false,
      error: null,
    };
  }

  componentDidMount() {
    let socket = socketClient();
    console.log(socket);
    this.setState({ socket });

    socket.on("connected", (data) => {
      let playerId = data.playerId;
      this.setState({ playerId });
    });

    socket.on("created", (data) => {
      let gameId = data.gameId;
      this.setState({ gameId });
    });

    socket.on("joined", (data) => {
      let colour = data.orange === this.state.playerId ? "orange" : "blue";
      let gameId = data.gameId;
      let isActive = true;

      this.setState({ gameId, colour, isActive });
    });

    socket.on("resetGame", () => {
      this.setState({
        gameId: null,
        colour: null,
        isActive: false,
        error: null,
      });
    });

    socket.on("error", (error) => this.setState({ error }));
  }

  renderStartMenu() {
    return (
      <StartMenu
        gameId={this.state.gameId}
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
            gameId={this.state.gameId}
            colour={this.state.colour}
            socket={this.state.socket}
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
