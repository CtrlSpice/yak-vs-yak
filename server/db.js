import pg from "pg";
const connectionString = process.env.DATABASE_URL;
//const connectionString = "https://localhost/yak-vs-yak";
let pool = new pg.Pool({ connectionString });

// Create game
export async function createGame(roomId, blueSocket, orangeSocket) {
  try {
    const client = await pool.connect();
    const query = {
      text: "INSERT INTO games(room_id, blue_socket, orange_socket) VALUES($1, $2, $3)",
      values: [roomId, blueSocket, orangeSocket],
    };
    await client.query(query);

    client.release();
  } catch (err) {
    console.log(err);
  }
}

// Create move
export async function createMove(
  roomId,
  colour,
  rowIndex,
  columnIndex,
  turnCount
) {
  try {
    const client = await pool.connect();
    const gameId = await getGameId(client, roomId);
    const query = {
      text: "INSERT INTO moves(game_id, colour, row_index, column_index, turn) VALUES($1, $2, $3, $4, $5)",
      values: [gameId, colour, rowIndex, columnIndex, turnCount],
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
    const query = {
      text: `UPDATE games SET is_done = 'true', winner = $1 WHERE room_id = $2`,
      values: [winner, roomId],
    };

    await client.query(query);

    client.release();
  } catch (err) {
    console.log(err);
  }
}

// Get the list of moves for a finihed game (random or last)
export async function getMoveList(roomId) {
  try {
    const client = await pool.connect();
    let gameId =
      roomId === "demo"
        ? await getRandomGameId(client)
        : await getGameId(client, roomId);

    const query = {
      text: `SELECT colour, row_index, column_index FROM moves WHERE game_id = $1 ORDER BY turn ASC`,
      values: [gameId],
    };
    const res = await client.query(query);

    client.release();
    console.log(res.rows);
    return res.rows;
  } catch (err) {
    console.log(err);
  }
}

export async function disconnect() {
  await pool.end();
}

async function getRandomGameId(client) {
  try {
    const query = `SELECT id FROM games WHERE blue_socket <> 'AI' AND orange_socket <> 'AI' AND is_done = TRUE ORDER BY RANDOM() LIMIT 1 `;
    const res = await client.query(query);
    const gameId = res.rows[0].id;

    return gameId;
  } catch (err) {
    console.log(err);
  }
}

async function getGameId(client, roomId) {
  try {
    const query = {
      text: `SELECT id FROM games WHERE room_id = $1`,
      values: [roomId],
    };
    const res = await client.query(query);
    const gameId = res.rows[0].id;

    return gameId;
  } catch (err) {
    console.log(err);
  }
}
