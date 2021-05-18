import { Server } from "socket.io";
import express from "express";
import { v4 as uuidv4 } from "uuid";
import { checkWinCondition, prepareNextMove } from "./server/gamePlay.js";
import { createGame, createMove, updateWinCondition } from "./server/db.js";

// App
const port = process.env.PORT || 4000;
const app = express();

app.use(express.static("build"));
app.use(express.static("public"));

const server = app.listen(port, () => {
  console.log(`Server is practicing active listening on port ${port}`);
});

app.get("/*", function (_req, res) {
  res.sendFile("./build/index.html");
});

// Socket
const io = new Server(server);

const games = [];
const lobbies = [];

io.on("connect", (socket) => {
  let playerId = socket.id;
  let roomId;
  let grid;

  socket.emit("connected", { playerId });

  socket.on("create", async (playerData) => {
    roomId = uuidv4().slice(0, 7);
    let mode = playerData.mode;
    let playerId = playerData.playerId;

    if (mode === "onePlayer") {
      // Clear any server errors
      socket.emit("error", null);

      // Randomly assign a colour to the player
      let orange = Math.floor(Math.random() * 2) === 0 ? "AI" : playerId;
      let blue = orange === playerId ? "AI" : playerId;
      let game = { roomId, orange, blue, mode };

      await createGame(roomId, blue, orange);

      games.push(game);
      socket.join(roomId);
      socket.emit("joined", game);

      // Force the first move if AI goes first
      if(blue === "AI"){
        io.to(roomId).emit("firstMove");
      }
    } else {
      // Two player game - push to lobbies and wait for other person to join
      let lobby = { roomId, playerId };
      lobbies.push(lobby);
      socket.join(roomId);
      socket.emit("created", { roomId, playerId, mode });
    }
  });

  socket.on("join", async (lobbyData) => {
    // Find the correct lobby in lobbies
    let lobby = lobbies.find((lobby) => {
      return lobby.roomId === lobbyData.roomId;
    });

    if (lobby) {
      roomId = lobby.roomId;
      let orange =
        Math.floor(Math.random() * 2) === 0 ? lobby.playerId : playerId;
      let blue = orange === playerId ? lobby.playerId : playerId;
      let mode = "twoPlayer";
      let game = { roomId, orange, blue, mode };

      // Add the game to the database
      await createGame(roomId, blue, orange);

      // Remove instance from lobbies and add it to games
      lobbies.splice(lobbies.indexOf(lobby), 1);
      games.push(game);

      socket.join(roomId);
      socket.emit("error", null);
      io.to(roomId).emit("joined", game);
    } else {
      socket.emit("error", {
        source: "StartMenu",
        on: "join",
        message: `Game ${lobbyData.roomId} doesn't exist. We are deeply sorry.`,
      });
    }
  });

  socket.on("move", async (moveData) => {
    // Save move
    try {
      await createMove(
        roomId,
        moveData.currentYak,
        moveData.rowIndex,
        moveData.columnIndex
      );
    } catch (error) {
      console.log(error);
    }

    let winCondition = checkWinCondition(
      moveData.grid,
      moveData.rowIndex,
      moveData.columnIndex
    );

    // Check if someone won
    if (winCondition.isWin) {
      // Update win condition
      try {
        await updateWinCondition(roomId, moveData.currentYak);
      } catch (error) {
        console.log(error);
      }

      io.to(roomId).emit("win", {
        grid: moveData.grid,
        isDone: true,
        winner: moveData.currentYak,
        sequence: winCondition.sequence,
      });
    } else {
      // Prepare the board for the next move
      let nextMove = prepareNextMove(
        moveData.grid,
        moveData.rowIndex,
        moveData.columnIndex
      );

      // Check if there's been a tie
      if (nextMove.isTie) {
        // Update win condition
        try {
          await updateWinCondition(roomId, "tie");
        } catch (error) {
          console.log(error);
        }

        io.to(roomId).emit("win", {
          grid: moveData.grid,
          isDone: true,
          winner: "tie",
          sequence: null,
        });
      } else {
        grid = nextMove.grid;
        io.to(roomId).emit("turn", { grid });
      }
    }
  });

  socket.on("disconnect", async () => {
    console.log(playerId + " disconnected.");

    // If a player disconnects from a lobby, delete the lobby
    let activeLobby = lobbies.find((lobby) => lobby.playerId === playerId);
    if (activeLobby) {
      let lobbyIndex = lobbies.indexOf(activeLobby);
      lobbies.splice(lobbyIndex, 1);
    }

    // If a player disconnects from a game, let the other player win
    let activeGame = games.find(
      (game) => game.orange === playerId || game.blue === playerId
    );
    if (activeGame) {
      let winner = playerId === activeGame.orange ? "blue" : "orange";
      let gameIndex = games.indexOf(activeGame);
      games.splice(gameIndex, 1);

      // Update database
      await updateWinCondition(roomId, winner);
      io.to(roomId).emit("disconnected", {
        winner,
      });
    }
  });

  socket.on("playAgain", async (gameData) => {
    // Swap the player colours to keep things interesting
    let prevGame = games.find((game) => game.roomId === gameData.roomId);
    if (prevGame) {
      let orange = prevGame.blue;
      let blue = prevGame.orange;
      let mode = gameData.mode;

      // Remove the previous game from games
      let prevIndex = games.indexOf(prevGame);
      games.splice(prevIndex, 1);

      // Create a new game
      roomId = uuidv4().slice(0, 7);
      if (orange !== "AI") io.sockets.sockets.get(orange).join(roomId);
      if (blue !== "AI") io.sockets.sockets.get(blue).join(roomId);

      // Add the new game to database
      await createGame(roomId, blue, orange);

      // Add new game to games array
      let game = { roomId, blue, orange, mode };
      games.push(game);

      io.to(roomId).emit("resetBoard");
      io.to(roomId).emit("joined", game);
      // Force the first move if AI goes first
      if(blue === "AI"){
        io.to(roomId).emit("firstMove");
      }
    } else {
      // If the other player left, go back to the menu screen
      socket.emit("resetGame");
    }
  });
});
