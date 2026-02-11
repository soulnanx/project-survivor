import { COLS, ROWS, CELL_EMPTY, CELL_WALL, CELL_BRICK, CELL_WOOD, CELL_IRON_BARS, CELL_HARD_BRICK } from '../constants.js';
import EventBus from '../core/EventBus.js';

export default class Grid {
    constructor() {
        this.cols = COLS;
        this.rows = ROWS;
        this.cells = [];
        this.powerups = {}; // "col,row" -> powerup type
        this.clear();
    }

    clear() {
        this.cells = new Array(this.cols * this.rows).fill(CELL_EMPTY);
        this.powerups = {};
    }

    getCell(col, row) {
        if (col < 0 || col >= this.cols || row < 0 || row >= this.rows) return CELL_WALL;
        return this.cells[row * this.cols + col];
    }

    setCell(col, row, type) {
        if (col < 0 || col >= this.cols || row < 0 || row >= this.rows) return;
        this.cells[row * this.cols + col] = type;
        EventBus.emit('cell:changed', { col, row, type });
    }

    isWalkable(col, row) {
        const cell = this.getCell(col, row);
        return cell === CELL_EMPTY;
    }

    isSolid(col, row) {
        const cell = this.getCell(col, row);
        return cell === CELL_WALL || cell === CELL_BRICK ||
               cell === CELL_WOOD || cell === CELL_IRON_BARS ||
               cell === CELL_HARD_BRICK;
    }

    isDestructible(col, row) {
        return this.getCell(col, row) === CELL_BRICK;
    }

    isSpecialBlock(col, row) {
        const cell = this.getCell(col, row);
        return cell === CELL_WOOD || cell === CELL_IRON_BARS || cell === CELL_HARD_BRICK;
    }

    setPowerup(col, row, type) {
        this.powerups[`${col},${row}`] = type;
    }

    getPowerup(col, row) {
        return this.powerups[`${col},${row}`] || null;
    }

    removePowerup(col, row) {
        delete this.powerups[`${col},${row}`];
    }
}
