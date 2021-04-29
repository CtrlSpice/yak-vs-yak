import React from "react";
import { useFormik } from "formik";

export default function StartMenu(props) {
  let playerId = props.playerId;
  let gameId = props.gameId;
  let socket = props.socket;
  let error = props.error;

  return (
    <div className="menu">
      <NewGameSection socket={socket} playerId={playerId} gameId={gameId} />
      <p>-or-</p>
      <JoinGameForm
        socket={socket}
        playerId={playerId}
        gameId={gameId}
        error={error}
      />
    </div>
  );
}

function JoinGameForm(props) {
  const serverError = props.error !== null && props.error.on === "join" ? props.error.message : null;

  const socket = props.socket;
  const formik = useFormik({
    initialValues: {
      gameId: "",
    },
    validateOnChange: false,
    validateOnBlur: false,
    validate: (val) => {
      let errors = {};

      if (!val.gameId) {
        errors.gameId = "Game id is required to join a game.";
      } else if (!/\b[a-zA-Z0-9]{7}\b/i.test(val.gameId)) {
        errors.gameId =
          "Invalid format. Please check your game id and try again.";
      } else if (val.gameId === props.gameId) {
        errors.gameId =
          "Your game will start once your opponent joins.";
      } 
      return errors;
    },

    onSubmit: (val) => {
      let gameId = val.gameId;
      socket.emit("join", { gameId });
    },
  });

  return (
    <React.Fragment>
      <p>Enter a game id to join an existing game:</p>
      <form onSubmit={formik.handleSubmit}>
        <input
          id="game-id-input"
          name="gameId"
          type="text"
          className="menu-input"
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          value={formik.values.gameId}
        />
        <button className="menu-button" type="submit">
          Join
        </button>
        {formik.touched.gameId && formik.errors.gameId ? (
          <div className="error">{formik.errors.gameId}</div>
        ) : (
          <div className="error">{serverError}</div>
        )}
      </form>
    </React.Fragment>
  );
}

function NewGameSection(props) {
  let playerId = props.playerId;
  let gameId = props.gameId;
  let socket = props.socket;

  if (gameId === null) {
    return (
      <button
        id="create-button"
        className="menu-button"
        onClick={() => socket.emit("create", { playerId })}
      >
        New Game
      </button>
    );
  } else {
    return <NewGameInfo gameId={gameId} />;
  }
}

class NewGameInfo extends React.Component {
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
        <p>Copy the game id and challenge your foe:</p>
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
