import { AzulMessage, decodeMessage, encodeMessage } from "./src/Messages.ts";
import { Tile } from "./src/Types.ts";

const conn = await Deno.connect({ hostname: '127.0.0.1', port: 8080 });

const mode = prompt('Do you want to (J)oin or (S)tart a game?') ?? 'S';
let playerName: string = '';
let playerNum: number = 0;
let players: string[] = [];
if (mode.toUpperCase() === 'J') {
    const gameId = prompt('Game ID?') ?? '';
    playerName = prompt('Player Name?') ?? '';
    await conn.write(encodeMessage('JoinGame', { gameId, playerName }));
} else if (mode.toUpperCase() === 'S') {
    playerName = prompt('Player Name?') ?? '';
    await conn.write(encodeMessage('CreateGame', { playerName }));
} else {
    console.log('Invalid option');
    Deno.exit();
}

let repeatStep = false;
let msg: AzulMessage | null = null;
while (true) {
    if (!repeatStep) {
        const sizeBuf = new Uint8Array(2);
        const count = await conn.read(sizeBuf);
    
        if (!count) break;
        
        const dataView = new DataView(sizeBuf.buffer, sizeBuf.byteOffset, sizeBuf.byteLength);
        const msgSize = dataView.getUint16(0, false);
    
        const msgBuf = new Uint8Array(msgSize);
        await conn.read(msgBuf);
        
        msg = decodeMessage(msgBuf);
    } else {
        repeatStep = false;
    }

    if (msg === null) break;

    switch (msg['@']) {
        case 'GameCreated':
            console.log(`Create Game ${msg.gameId}`);
            console.log('Waiting for more players');
            playerNum = 1;
            break;

        case 'PlayerJoined':
            console.log(`${msg.playerName} Has Joined The Game As Player ${msg.playerNum}`);
            break;

        case 'GameJoined':
            console.log(`You Have Joined ${msg.players[0]}'s Game As Player ${msg.playerNum}`);
            playerNum = msg.playerNum;
            break;

        case 'GameStarted':
            console.log(`The Game Has Started!`);
            players = msg.players;
            showPlayers(msg.players);
            showFactories(msg.factories);
            break;

        case 'PlayerTurn':
            if (msg.playerNum === playerNum) {
                console.log('It\'s your turn!');
                const factory = Number(prompt('Which factory are you drawing from (0 for center)') ?? '0');
                const tile = prompt('Which tile type are you drawing (R, Y, B, W, K)') ?? '';
                const queue = Number(prompt('Which queue are you placing your tiles into (0 for tray)') ?? 0);
                await conn.write(encodeMessage('PlayHand', { drawFromFactory: factory, tileType: tile as Tile, placeInQueue: queue }));
            } else {
                console.log(`It's ${players[msg.playerNum - 1]}'s Turn (Player ${msg.playerNum})`);
            }

            break;

        case 'RulesViolation':
            console.log(`Violation! ${msg.message}`);
            repeatStep = true;
            break;
    }
}

function showPlayers(players: string[]) {
    for (const player in players) {
        console.log(`Player ${Number(player) + 1}: ${players[player]}`)
    }
}

function showFactories(factories: Tile[][]) {
    console.log('Center', factories[0]);
    for (let i = 1; i < factories.length; i++) {
        console.log(`Factory ${i}`, factories[i]);
    }
}
