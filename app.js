import { Server } from "socket.io";
import express from "express";
import { v4 as uuidv4 } from "uuid";
import { checkWinCondition, prepareNextMove } from "./server/gamePlay.js";

// App
const port = process.env.PORT | 4000;
const app = express();

const server = app.listen(port, () => {
  console.log(`Server is practicing active listening on port ${port}`);
});

// Socket
const io = new Server(server);

// Rooms
const games = [];
const lobbies = [];

io.on("connect", (socket) => {
  let playerId = socket.id;
  let gameId;
  let grid;

  socket.emit("connected", { playerId });

  socket.on("create", (playerData) => {
    gameId = uuidv4().slice(0, 7);
    let playerId = playerData.playerId;
    let lobby = { gameId, playerId };

    lobbies.push(lobby);
    socket.join(gameId);
    socket.emit("created", lobby);
  });

  socket.on("join", (lobbyData) => {
    console.log(lobbyData);
    // Find the correct lobby in lobbies
    let lobby = lobbies.find((lobby) => {
      return lobby.gameId === lobbyData.gameId;
    });

    if (lobby) {
      gameId = lobby.gameId;
      let orange =
        Math.floor(Math.random() * 2) === 0 ? lobby.playerId : playerId;
      let blue = orange === playerId ? lobby.playerId : playerId;
      let game = { gameId, orange, blue };

      // Remove instance from lobbies and add it to games
      lobbies.splice(lobbies.indexOf(lobby), 1);
      games.push(game);

      socket.join(gameId);
      socket.emit("error", null);
      io.to(gameId).emit("joined", game);
    } else {
      socket.emit("error", {
        source: "StartMenu",
        on: "join",
        message: `Game ${lobbyData.gameId} doesn't exist. We are deeply sorry.`,
      });
    }
  });

  socket.on("move", (moveData) => {
    let winCondition = checkWinCondition(
      moveData.grid,
      moveData.rowIndex,
      moveData.columnIndex
    );

    // Check if someone won
    if (winCondition.isWin) {
      io.to(gameId).emit("win", {
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
        io.to(gameId).emit("win", {
          grid: moveData.grid,
          isDone: true,
          winner: "tie",
          sequence: null,
        });
      } else {
        // Send off the grid ready for the next move.
        grid = nextMove.grid;
        io.to(gameId).emit("turn", { grid });
      }
    }
  });

  socket.on("disconnect", () => {
    console.log(playerId + " disconnected.");
    // If a player disconnects from a lobby, delete the lobby
    let activeLobby = games.find((lobby) => lobby.playerId === playerId);
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

      io.to(gameId).emit("disconnected", {
        winner,
      });
    }
  });

  socket.on("playAgain", (gameData) => {
    // Swap the player colours to keep things interesting
    let prevGame = games.find((game) => game.gameId === gameData.gameId);
    if (prevGame) {
      console.log(prevGame);
      let orange = prevGame.blue;
      let blue = prevGame.orange;

      // Remove the previous game from games
      let prevIndex = games.indexOf(prevGame);
      games.splice(prevIndex, 1);

      // Create a new game
      gameId = uuidv4().slice(0, 7);
      io.sockets.sockets.get(orange).join(gameId);
      io.sockets.sockets.get(blue).join(gameId);

      //Add new game to games array
      let game = { gameId, blue, orange };
      games.push(game);

      io.to(gameId).emit("resetBoard");
      io.to(gameId).emit("joined", game);
    } else {
      socket.emit("resetGame");
    }
  });
});
