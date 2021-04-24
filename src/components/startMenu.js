import React, { useState } from "react";

export default function StartMenu(props) {
  let playerId = props.playerId;
  let gameId = props.gameId;
  let socket = props.socket;

  let createSection =
    gameId === null ? (
      <button
        id="create-button"
        className="menu-button"
        onClick={() => socket.emit("create", { playerId })}
      >
        New Game
      </button>
    ) : (
      <GameInfo gameId={gameId} />
    );

  return (
    <div className="menu">
      {createSection}
      <p>-or-</p>
      <JoinForm socket={socket} playerId={playerId} gameId={gameId}/>
    </div>
  );
}

function JoinForm(props) {
  const socket = props.socket;
  const playerId = props.playerId;
  const [inputGameId, setInputGameId] = useState("");

  const handleSubmit = (event) => {
    event.preventDefault();

    if (inputGameId === props.gameId) {
      alert("Surely, there must be easier ways to play with yourself.");
      return;
    }

    let regexp = /\w{7}/gi;
    let gameId = inputGameId.slice(0, 7);

    if (regexp.test(gameId)) {
      socket.emit("join", { playerId, gameId });
    } else {
      // TODO: Something useful
      console.log("Invalid game id format");
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <label htmlFor="join-input">
        Enter a game id to join an existing game:
      </label>
      <input
        id="join-input"
        className="menu-input"
        type="text"
        value={inputGameId}
        onChange={(event) => setInputGameId(event.target.value)}
      />
      <input className="menu-button" type="submit" value="Join" />
    </form>
  );
}

class GameInfo extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      gameId: props.gameId,
      isCopied: false,
    };
    this.gameIdText = React.createRef();
    this.handleCopy = this.handleCopy.bind(this);
  }

  handleCopy() {
    let txt = this.gameIdText.current;
    txt.select();

    let isCopied = document.execCommand("copy");
    this.setState({ isCopied });
  }

  render() {
    return (
      <div className="create-section">
        <label htmlFor="create-button">
          Copy the game id and challenge your foe:
        </label>
        <input
          id="new-game-id"
          className="menu-input"
          ref={this.gameIdText}
          value={this.state.gameId}
          readOnly
        />
        <button className="menu-button" onClick={this.handleCopy}>
          Copy
        </button>
      </div>
    );
  }
}
