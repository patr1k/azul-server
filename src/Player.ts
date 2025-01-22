import { encodeMessage } from "./Messages.ts";
import { Board, Queues, ReturnTiles, Tile, TileIndices, Tray, TrayPenalties } from "./Types.ts";

const tileIndexMap: TileIndices = {
    'B': [0, 1, 2, 3, 4],
    'Y': [1, 2, 3, 4, 0],
    'R': [2, 3, 4, 0, 1],
    'K': [3, 4, 0, 1, 2],
    'W': [4, 0, 1, 2, 3],
}

const trayPenalties: TrayPenalties = [1, 1, 2, 2, 2, 3, 3];

class Player {
    public conn: Deno.Conn | null;
    public name: string;
    public resigned: boolean;
    public completed: boolean;
    public score: number;

    public queues: Queues = [
        [ null ],
        [ null, null ],
        [ null, null, null ],
        [ null, null, null, null ],
        [ null, null, null, null, null ],
    ];

    public board: Board = [
        [ false, false, false, false, false ],
        [ false, false, false, false, false ],
        [ false, false, false, false, false ],
        [ false, false, false, false, false ],
        [ false, false, false, false, false ],
    ];

    public tray: Tray = [ null, null, null, null, null, null, null ];

    constructor(conn: Deno.Conn, name: string) {
        this.conn = conn;
        this.resigned = false;
        this.completed = false;
        this.name = name;
        this.score = 0;
    }

    playHand(tileType: Tile, tileCount: number, playOnRow: number) {
        // Are we playing onto the tray?
        if (playOnRow === 0) {
            const nextEmpty = this.tray.findIndex(c => c === null);
            for (let i = nextEmpty; i < (nextEmpty + tileCount) && i < 7; i++) {
                this.tray[i] = tileType;
            }
            return;
        }

        // Reindex on 0
        playOnRow -= 1;

        // Make sure tile type can be played on this row
        if (this.board[playOnRow][tileIndexMap[tileType][playOnRow]]) {
            // cant play this tile type on this row
            this.conn?.write(encodeMessage('RulesViolation', { message: 'The row has already completed this tile type' }));
            return;
        }

        // Fill remaining spaces in queue, then put extras onto tray
        while (tileCount-- > 0) {
            const nextCell = this.queues[playOnRow].findIndex(c => c === null);
            if (nextCell > -1) {
                this.queues[playOnRow][nextCell] = tileType;
            } else {
                const nextTray = this.tray.findIndex(c => c === null);
                if (nextTray > -1) {
                    this.tray[nextTray] = tileType;
                } else {
                    break;
                }
            }
        }
    }

    endOfRound(): ReturnTiles {
        // create a return tile pile
        const returnTiles: ReturnTiles = { 'R': 0, 'B': 0, 'Y': 0, 'W': 0, 'K': 0 };

        // check each queue to see if its filled
        for (const queue in this.queues) {
            // get the queue index as an int
            const i = Number(queue);

            // get the value of the left-most queue space (the last to be filled)
            const tileType = this.queues[i][i];

            // if the space is filled, then the row is filled
            if (tileType !== null) {
                const col = tileIndexMap[tileType][queue];
                // mark the corresponding space on the board as completed
                this.board[i][col] = true;
                
                // empty the queue
                for (let n = 0; n < this.queues[i].length; n++) {
                    this.queues[i][n] = null;
                }

                // put the remaining tiles from the queue into the return pile (they go back to the box)
                returnTiles[tileType] = i;

                // start tallying the round score
                let points = 0;

                // check the adjacent horizontal tiles
                for (let n = col - 1; n >= 0; n--) {
                    points += this.board[i][n] ? 1 : 0;
                }
                for (let n = col + 1; n <= 4; n++) {
                    points += this.board[i][n] ? 1 : 0;
                }

                // check the adjacent vertical tiles
                for (let n = i - 1; n >= 0; n--) {
                    points += this.board[n][col] ? 1 : 0;
                }
                for (let n = i + 1; n <= 4; n++) {
                    points += this.board[n][col] ? 1 : 0;
                }

                // update the score
                this.score += points;
            }
        }

        // subtract points
        let minusPoints = 0;
        for (const trayTile in this.tray) {
            const tileType = this.tray[trayTile];
            if (tileType !== null) {
                minusPoints += trayPenalties[trayTile];
                if (tileType !== '-1') {
                    returnTiles[tileType] += 1;
                }
                this.tray[trayTile] = null;
            }
        }
        this.score -= minusPoints;

        for (const row in this.board) {
            if (!this.board[row].some(c => c === false)) {
                this.completed = true;
                break;
            }
        }

        return returnTiles;
    }

    takePenaltyTile() {
        const nextTray = this.tray.findIndex(c => c === null);
        if (nextTray > -1) {
            this.tray[nextTray] = '-1';
        }
    }
}

export default Player;