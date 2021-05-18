import React from "react";
import { useFormik } from "formik";

export default function StartMenu(props) {
  let playerId = props.playerId;
  let roomId = props.roomId;
  let socket = props.socket;
  let error = props.error;

  return (
    <div className="menu">
      <OnePlayerSection socket={socket} playerId={playerId} />
      <p>-or-</p>
      <TwoPlayerSection
        socket={socket}
        playerId={playerId}
        roomId={roomId}
      />
      <p>-or-</p>
      <JoinGameForm
        socket={socket}
        playerId={playerId}
        roomId={roomId}
        error={error}
      />
    </div>
  );
}

function OnePlayerSection(props) {
  let playerId = props.playerId;
  let socket = props.socket;
  let mode = "onePlayer";

  return (
    <button
      id="create-button"
      className="menu-button"
      onClick={() => socket.emit("create", { playerId, mode })}
    >
      One-Yak Game
    </button>
  );
}

function TwoPlayerSection(props) {
  let playerId = props.playerId;
  let roomId = props.roomId;
  let socket = props.socket;
  let mode = "twoPlayer";

  if (roomId === null) {
    return (
      <button
        id="create-button"
        className="menu-button"
        onClick={() => socket.emit("create", { playerId, mode })}
      >
        Two-Yak Game
      </button>
    );
  } else {
    return <TwoPlayerInfo roomId={roomId} />;
  }
}

class TwoPlayerInfo extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      roomId: props.roomId,
      isCopied: false,
    };
    this.roomIdText = React.createRef();
    this.handleCopy = this.handleCopy.bind(this);
  }

  handleCopy() {
    let txt = this.roomIdText.current;
    txt.select();

    let isCopied = document.execCommand("copy");
    this.setState({ isCopied });
  }

  render() {
    return (
      <div className="create-section">
        <p>Copy the room id and challenge your foe:</p>
        <input
          id="new-game-id"
          className="menu-input"
          ref={this.roomIdText}
          value={this.state.roomId}
          readOnly
        />
        <button className="menu-button" onClick={this.handleCopy}>
          Copy
        </button>
      </div>
    );
  }
}

function JoinGameForm(props) {
  const serverError =
    props.error !== null && props.error.on === "join"
      ? props.error.message
      : null;

  const socket = props.socket;
  const formik = useFormik({
    initialValues: {
      roomId: "",
    },
    validateOnChange: false,
    validateOnBlur: false,
    validate: (val) => {
      let errors = {};

      if (!val.roomId) {
        errors.roomId = "Game id is required to join a game.";
      } else if (!/\b[a-zA-Z0-9]{7}\b/i.test(val.roomId)) {
        errors.roomId =
          "Invalid format. Please check your game id and try again.";
      } else if (val.roomId === props.roomId) {
        errors.roomId = "Your game will start once your opponent joins.";
      }
      return errors;
    },

    onSubmit: (val) => {
      let roomId = val.roomId;
      socket.emit("join", { roomId });
    },
  });

  return (
    <React.Fragment>
      <p>Enter a game id to join an existing game:</p>
      <form onSubmit={formik.handleSubmit}>
        <input
          id="game-id-input"
          name="roomId"
          type="text"
          className="menu-input"
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          value={formik.values.roomId}
        />
        <button className="menu-button" type="submit">
          Join
        </button>
        {formik.errors.roomId ? (
          <div className="error">{formik.errors.roomId}</div>
        ) : (
          <div className="error">{serverError}</div>
        )}
      </form>
    </React.Fragment>
  );
}
