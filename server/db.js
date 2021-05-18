import pg from "pg";
const connectionString = process.env.DATABASE_URL;

let pool = new pg.Pool({ connectionString });

// Create game
export async function createGame(roomId, blueSocket, orangeSocket) {
  try {
    const client = await pool.connect();
    const query = {
      text:
        "INSERT INTO games(room_id, blue_socket, orange_socket) VALUES($1, $2, $3) RETURNING id",
      values: [roomId, blueSocket, orangeSocket],
    };

    await client.query(query);

    client.release();
  } catch (err) {
    console.log(err);
  }
}

// Create move
export async function createMove(roomId, colour, rowIndex, columnIndex) {
  try {
    const client = await pool.connect();
    const gameId = await getGameId(client, roomId);

    const query = {
      text:
        "INSERT INTO moves(game_id, colour, row_index, column_index) VALUES($1, $2, $3, $4) RETURNING id",
      values: [gameId, colour, rowIndex, columnIndex],
    };

    await client.query(query);

    client.release();
  } catch (err) {
    console.log(err);
  }
}

// Update game
export async function updateWinCondition(roomId, winner) {
  try {
    const client = await pool.connect();
    const query = `UPDATE games SET is_done = 'true', winner = '${winner}' WHERE room_id = '${roomId}' RETURNING id`;

    await client.query(query);

    client.release();
  } catch (err) {
    console.log(err);
  }
}

export async function disconnect() {
  await pool.end();
}

async function getGameId(client, roomId) {
  try {
    const query = `SELECT id FROM games WHERE room_id = '${roomId}'`;
    const res = await client.query(query);
    const gameId = res.rows[0].id;

    return gameId;
  } catch (err) {
    console.log(err);
  }
}
