import decoder from "./Decoder.ts";
import encoder from "./Encoder.ts";
import { PlayerScores, Tile } from "./Types.ts";

export type MessageType = 'CreateGame' 
| 'GameCreated' 
| 'JoinGame' 
| 'GameJoined'
| 'GameNotFound'
| 'GameIsFull'
| 'PlayerJoined' 
| 'StartGame' 
| 'GameStarted'  
| 'PlayerTurn' 
| 'PlayHand' 
| 'PlayerResigned' 
| 'RulesViolation' 
| 'GameEnded'
| 'Quit';

export interface BaseMessage {
    '@': MessageType;
}

export interface CreateGameMessage extends BaseMessage {
    '@': 'CreateGame';
    playerName: string;
}

export interface JoinGameMessage extends BaseMessage {
    '@': 'JoinGame';
    gameId: string;
    playerName: string;
}

export interface QuitMessage extends BaseMessage {
    '@': 'Quit';
}

export interface GameCreatedMessage extends BaseMessage {
    '@': 'GameCreated';
    gameId: string;
}

export interface StartGameMessage extends BaseMessage {
    '@': 'StartGame';
}

export interface GameStartedMessage extends BaseMessage {
    '@': 'GameStarted';
    factories: Tile[][];
    players: string[];
}

export interface GameJoinedMessage extends BaseMessage {
    '@': 'GameJoined';
    playerNum: number;
    players: string[];
}

export interface GameNotFoundMessage extends BaseMessage {
    '@': 'GameNotFound';
}

export interface PlayerResignedMessage extends BaseMessage {
    '@': 'PlayerResigned';
    playerName: string;
    playerNum: number;
}

export interface PlayerTurnMessage extends BaseMessage {
    '@': 'PlayerTurn';
    playerNum: number;
}

export interface RulesViolationMessage extends BaseMessage {
    '@': 'RulesViolation';
    message: string;
}

export interface GameEndedMessage extends BaseMessage {
    '@': 'GameEnded';
    scores: PlayerScores;
}

export interface PlayerJoinedMessage extends BaseMessage {
    '@': 'PlayerJoined';
    playerNum: number;
    playerName: string;
}

export interface PlayHandMessage extends BaseMessage {
    '@': 'PlayHand';
    drawFromFactory: number;
    tileType: Tile;
    placeInQueue: number;
}

export interface GameIsFullMessage extends BaseMessage {
    '@': 'GameIsFull';
}

export type MessageOfType<T> =
    T extends 'CreateGame' ? CreateGameMessage :
    T extends 'JoinGame' ? JoinGameMessage :
    T extends 'GameCreated' ? GameCreatedMessage :
    T extends 'StartGame' ? StartGameMessage :
    T extends 'GameStarted' ? GameStartedMessage :
    T extends 'GameJoined' ? GameJoinedMessage :
    T extends 'GameNotFound' ? GameNotFoundMessage :
    T extends 'PlayerResigned' ? PlayerResignedMessage :
    T extends 'PlayerTurn' ? PlayerTurnMessage :
    T extends 'RulesViolation' ? RulesViolationMessage :
    T extends 'GameEnded' ? GameEndedMessage :
    T extends 'PlayerJoined' ? PlayerJoinedMessage :
    T extends 'PlayHand' ? PlayHandMessage :
    T extends 'GameIsFull' ? GameIsFullMessage :
    T extends 'Quit' ? QuitMessage :
    never;

export function prependMsgSize(jsonBytes: Uint8Array): Uint8Array {
    const sizeBytes = new Uint8Array([jsonBytes.length & 0xff00, jsonBytes.length & 0xff]);
    const msgBytes = new Uint8Array(jsonBytes.length + 2);
    msgBytes.set(sizeBytes, 0);
    msgBytes.set(jsonBytes, 2);
    return msgBytes;
}

export function encodeMessage<T extends MessageType>(type: T, msg?: Partial<MessageOfType<T>>) {
    if (typeof msg === 'undefined') {
        return prependMsgSize(encoder.encode(JSON.stringify({'@': type})));
    }

    msg['@'] = type;
    const jsonBytes = encoder.encode(JSON.stringify(msg));
    return prependMsgSize(jsonBytes);
}

export function decodeMessage<T extends AzulMessage>(buf: Uint8Array): T {
    const inMsg = decoder.decode(buf).replace(/[\0\r\n]/g, '');
    try {
        return JSON.parse(inMsg);
    } catch (_e) {
        console.log('Failed to parse JSON!', inMsg);
        Deno.exit();
    }
}

export type AzulMessage = CreateGameMessage
    | JoinGameMessage
    | GameCreatedMessage
    | StartGameMessage
    | GameStartedMessage
    | GameJoinedMessage
    | GameNotFoundMessage
    | PlayerResignedMessage
    | PlayerTurnMessage
    | RulesViolationMessage
    | GameEndedMessage
    | PlayerJoinedMessage
    | PlayHandMessage
    | GameIsFullMessage
    | QuitMessage;