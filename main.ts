import Game from "./src/Game.ts";
import { decodeMessage, encodeMessage } from "./src/Messages.ts";

const server = Deno.listen({ port: 8080 });

const connections: Deno.Conn[] = [];

const games: Map<string, Game> = new Map();

for await (const connection of server) {
  connections.push(connection);
  console.log('New connection from: ' + connection.remoteAddr.hostname);
  handle_connection(connection);
}

async function handle_connection(conn: Deno.Conn) {
  let game: Game | null = null;

  while (true) {
    const sizeBuf = new Uint8Array(2);
    const count = await conn.read(sizeBuf);

    if (!count) break;
    
    const dataView = new DataView(sizeBuf.buffer, sizeBuf.byteOffset, sizeBuf.byteLength);
    const msgSize = dataView.getUint16(0, false);

    const msgBuf = new Uint8Array(msgSize);
    await conn.read(msgBuf);
    
    const msg = decodeMessage(msgBuf);

    console.log(`Received ${msg['@']}`);

    switch (msg['@']) {
      case 'CreateGame': 
      {
        const gameId = Game.GenerateGameID();
        game = new Game(gameId, conn, msg.playerName);
        games.set(gameId, game);
        conn.write(encodeMessage('GameCreated', { gameId }));
        console.log('New Game Started: ' + gameId);
      }
        return;

      case 'JoinGame':
        if (games.has(msg.gameId)) {
          game = games.get(msg.gameId)!;
          if (game.players.length < 4) {
            console.log(`${msg.playerName} has joined Game ${msg.gameId} as Player ${game.players.length + 1}`);
            game.sendToAllPlayers('PlayerJoined', { playerNum: game.players.length + 1, playerName: msg.playerName });
            game.addPlayer(conn, msg.playerName);
            conn.write(encodeMessage('GameJoined', { playerNum: game.players.length, players: game.players.map(p => p.name) }));
  
            console.log('Forcing game to start');
            game.start();
          } else {
            console.log(`${msg.playerName} tried to join full Game ${msg.gameId}`);
            conn.write(encodeMessage('GameIsFull'));
          }
        } else {
          console.log(`${msg.playerName} tried to join non-existent game (${msg.gameId})`);
          conn.write(encodeMessage('GameNotFound'));
        }
        break;

      case 'StartGame':
        if (game) {
          game.start();
        }
        break;

      case 'Quit':
        {
          if (game) {
            game.removePlayer(conn);
          }
          conn.close();
          const idx = connections.indexOf(conn);
          connections.splice(idx, 1);
          return;
        }
    }
  }
}