import { ReturnTiles, Tile } from "./Types.ts";

class TileManager {
    private _bag: Tile[] = [];
    private _bin: Tile[] = [];

    constructor() {
        for (const t of ['R','Y','B','W','K']) {
            for (let i = 0; i < 20; i++) {
                this._bag.push(t as Tile);
            }
        }
        this.shuffleBag();
    }

    refillBag() {
        this._bag = [ ...this._bin ];
        this._bin = [];
    }

    shuffleBag() {
        for (let i = this._bag.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this._bag[i], this._bag[j]] = [this._bag[j], this._bag[i]];
        }
    }

    draw(count: number = 1): Tile[] {
        const tiles: Tile[] = [];
        while (count-- > 0) {
            if (this._bag.length === 0) {
                this.refillBag();
                this.shuffleBag();
            }
            tiles.push(this._bag.pop() as Tile);
        }
        return tiles;
    }
    
    addToBin(tiles: ReturnTiles) {
        for (const tileType in tiles) {
            for (let i = 0; i < tiles[tileType as Tile]; i++) {
                this._bin.push(tileType as Tile);
            }
        }
    }
}

export default TileManager;