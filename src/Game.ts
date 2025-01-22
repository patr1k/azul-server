import { encodeMessage, MessageOfType, MessageType } from "./Messages.ts";
import Player from "./Player.ts";
import TileManager from "./TileManager.ts";
import { PlayerScores, Tile } from "./Types.ts";

enum GameState {
    Setup,
    Playing,
    Paused,
    Ended
};

class Game {
    public id: string;
    public state: GameState;
    public players: Player[];
    public tileMngr: TileManager;
    public factories: Tile[][];
    public penaltyTileInCenter: boolean;
    public playerTurn: number;

    constructor(id: string, connection: Deno.Conn, hostName: string) {
        this.id = id;
        this.state = GameState.Setup;
        this.players = [new Player(connection, hostName)];
        this.playerTurn = 0;
        this.tileMngr = new TileManager();
        this.factories = [];
        this.penaltyTileInCenter = true;
    }

    static GenerateGameID() {
        const length = 6;
        let result = '';
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        const charactersLength = characters.length;
        let counter = 0;
        while (counter < length) {
            result += characters.charAt(Math.floor(Math.random() * charactersLength));
            counter += 1;
        }
        return result;
    }

    getPlayerNum(conn: Deno.Conn): number {
        for (const playerNum in this.players) {
            if (this.players[playerNum].conn === conn) {
                return Number(playerNum);
            }
        }

        return -1;
    }

    addPlayer(conn: Deno.Conn, name: string) {
        if (this.players.length < 4) {
            this.players.push(new Player(conn, name));
        }
    }

    removePlayer(conn: Deno.Conn) {
        if (this.state === GameState.Setup) {
            const num = this.getPlayerNum(conn);
            this.players.splice(num, 1);
            return;
        }

        this.resignPlayer(conn);
    }

    resignPlayer(conn: Deno.Conn) {
        const num = this.getPlayerNum(conn);
        this.players[num].conn = null;
        this.players[num].resigned = true;
        this.sendToAllPlayers(
            'PlayerResigned',
            {
                playerName: this.players[num].name,
                playerNum: num + 1
            }
        );
    }

    drawFromFactory(factory: number, tileType: Tile) {
        for (const tile of this.factories[factory]) {
            if (tile !== tileType) {
                this.factories[0].push(tile);
            }
        }
        this.factories[factory] = [];
    }

    start() {
        this.state = GameState.Playing;

        let factoryCount: number;
        switch (this.players.length) {
            default:
            case 2: factoryCount = 5; break;
            case 3: factoryCount = 7; break;
            case 4: factoryCount = 9; break;
        }

        // Factory 0 is really the center area
        this.factories.push([]);

        for (let i = 1; i <= factoryCount; i++) {
            this.factories.push(this.tileMngr.draw(4));
        }

        this.penaltyTileInCenter = true;

        this.sendToAllPlayers('GameStarted', { factories: this.factories, players: this.players.map(p => p.name) });
        this.sendToAllPlayers('PlayerTurn', { playerNum: this.playerTurn + 1 });
    }

    playHand(drawFromFactory: number, tileType: Tile, playOnRow: number) {
        this.drawFromFactory(drawFromFactory, tileType);
        if (drawFromFactory === 0 && this.penaltyTileInCenter === true) {
            this.players[this.playerTurn].takePenaltyTile();
            this.penaltyTileInCenter = false;
        }
        this.players[this.playerTurn].playHand(tileType, drawFromFactory, playOnRow);
    
        // check if all the factories (and center) are empty
        if (!this.factories.some(f => f.length > 0)) {
            let gameEnded = false;
            for (const player of this.players) {
                const returnTiles = player.endOfRound();
                this.tileMngr.addToBin(returnTiles);
                if (player.completed) {
                    gameEnded = true;
                }
            }
            if (gameEnded) {
                const scores: PlayerScores = {};
                for (const player of this.players) {
                    scores[player.name] = player.score;
                }
                this.sendToAllPlayers('GameEnded', { scores });
            }
        }
    }

    async sendToAllPlayers<T extends MessageType>(type: T, msg?: Partial<MessageOfType<T>>, exceptConn?: Deno.Conn) {
        const data = encodeMessage(type, msg);
        for (const playerNum in this.players) {
            if (this.players[playerNum].conn) {
                if (exceptConn && this.players[playerNum].conn === exceptConn) continue;
                await this.players[playerNum].conn.write(data);
            }
        }
    }
}

export default Game;