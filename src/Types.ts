export type Tile = 'R'|'Y'|'B'|'W'|'K';
export type BoardRow = [boolean, boolean, boolean, boolean, boolean];
export type Board = [BoardRow, BoardRow, BoardRow, BoardRow, BoardRow];
export type TileIndices = Record<Tile, [number, number, number, number, number]>;
export type QueueValue = Tile | null;
export type Queues = [
    [ QueueValue ], 
    [ QueueValue, QueueValue ], 
    [ QueueValue, QueueValue, QueueValue ], 
    [ QueueValue, QueueValue, QueueValue, QueueValue ], 
    [ QueueValue, QueueValue, QueueValue, QueueValue, QueueValue ], 
];
export type TrayValue = QueueValue | '-1';
export type Tray = [TrayValue, TrayValue, TrayValue, TrayValue, TrayValue, TrayValue, TrayValue];
export type TrayPenalties = [number, number, number, number, number, number, number];
export type ReturnTiles = Record<Tile, number>;
export type PlayerScores = Record<string, number>;