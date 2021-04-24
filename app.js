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
  // Generate a player id
  // TODO: Fix this when you get the DB set up
  let playerId = "yak" + socket.id.slice(7, 12);
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
    // Find the correct lobby in lobbies
    let lobby = lobbies.find((lobby) => {
      return lobby.gameId === lobbyData.gameId;
    });

    if (lobby) {
      gameId = lobbyData.gameId;
      let orange =
        Math.floor(Math.random() * 2) === 0 ? lobbyData.playerId : playerId;
      let blue = orange === playerId ? lobbyData.playerId : playerId;
      let game = { gameId, orange, blue };

      // Remove instance from lobbies and add it to games
      lobbies.splice(lobbies.indexOf(lobby), 1);
      games.push(game);

      socket.join(gameId);
      io.to(gameId).emit("joined", game);
    } else {
      socket.emit("error", {
        message: `Room ${gameId} doesn't exist. Please try again.`,
      });
    }
  });

  socket.on("move", (moveData) => {
    let winCondition = checkWinCondition(
      moveData.grid,
      moveData.rowIndex,
      moveData.columnIndex
    );

    console.log(winCondition);
    // Check if someone won
    if (winCondition.isWin) {
      io.to(gameId).emit("win", {
        grid: moveData.grid,
        isDone: true,
        winner: moveData.currentValue,
        sequence: winCondition.sequence,
      });
    } else {
      // Prepare the board for the next move
      let nextMove = prepareNextMove(
        moveData.grid,
        moveData.rowIndex,
        moveData.columnIndex
      );
      console.log(nextMove);
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
});
