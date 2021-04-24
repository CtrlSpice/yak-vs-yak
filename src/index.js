import React from "react";
import ReactDOM from "react-dom";
import StartMenu from "./components/startMenu.js";
import Board from "./components/board.js";
import socketClient from "socket.io-client";

const hostname = "localhost";
const port = process.env.PORT | 4000;

class Game extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      socket: null,
      playerId: null,
      gameId: null,
      colour: null,
      isActive: false,
      isDone: false,
      error: null,
    };
  }

  componentDidMount() {
    let server = `${hostname}:${port}`;
    let socket = socketClient(server);
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
      let error = null;
      
      this.setState({ gameId, colour, isActive, error});
    });

    socket.on("error", (data) => {
      // TODO: handle your errors.
      this.setState({ error: data.message });
    });
  }

  renderStartMenu() {
    return (
      <StartMenu
        gameId={this.state.gameId}
        playerId={this.state.playerId}
        socket={this.state.socket}
      />
    );
  }

  render() {
    if (this.state.isActive) {
      return (
        <div className="game">
          <Board colour={this.state.colour} socket={this.state.socket}/>
        </div>
      );
    } else {
      return <div className="game">{this.renderStartMenu()}</div>;
    }
  }
}

// ========================================
ReactDOM.render(<Game />, document.getElementById("root"));
