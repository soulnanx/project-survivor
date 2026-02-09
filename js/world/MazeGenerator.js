import { COLS, ROWS, CELL_EMPTY, CELL_WALL, CELL_BRICK, LEVEL_CONFIG, POWERUP_TYPES } from '../constants.js';
import { shuffle, floodFill } from '../utils.js';

export default class MazeGenerator {
    static generate(grid, level) {
        const config = LEVEL_CONFIG[level];
        grid.clear();

        // 1. Borders as walls
        for (let c = 0; c < COLS; c++) {
            grid.setCell(c, 0, CELL_WALL);
            grid.setCell(c, ROWS - 1, CELL_WALL);
        }
        for (let r = 0; r < ROWS; r++) {
            grid.setCell(0, r, CELL_WALL);
            grid.setCell(COLS - 1, r, CELL_WALL);
        }

        // 2. Fixed pillars at even positions (classic survival pattern)
        for (let c = 2; c < COLS - 1; c += 2) {
            for (let r = 2; r < ROWS - 1; r += 2) {
                grid.setCell(c, r, CELL_WALL);
            }
        }

        // 3. Safe zones (keep empty around player and enemy spawns)
        const safeZones = [
            // Player spawn (top-left)
            [1, 1], [2, 1], [1, 2],
            // Enemy spawn corners
            [COLS - 2, 1], [COLS - 3, 1], [COLS - 2, 2],
            [1, ROWS - 2], [2, ROWS - 2], [1, ROWS - 3],
            [COLS - 2, ROWS - 2], [COLS - 3, ROWS - 2], [COLS - 2, ROWS - 3],
        ];
        const safeSet = new Set(safeZones.map(([c, r]) => `${c},${r}`));

        // 4. Fill with bricks based on density
        const candidates = [];
        for (let c = 1; c < COLS - 1; c++) {
            for (let r = 1; r < ROWS - 1; r++) {
                if (grid.getCell(c, r) !== CELL_EMPTY) continue;
                if (safeSet.has(`${c},${r}`)) continue;
                candidates.push([c, r]);
            }
        }

        shuffle(candidates);
        const brickCount = Math.floor(candidates.length * config.density);
        const bricks = candidates.slice(0, brickCount);
        for (const [c, r] of bricks) {
            grid.setCell(c, r, CELL_BRICK);
        }

        // 5. Validate reachability via flood-fill, carve paths if needed
        this._ensureReachability(grid, safeZones);

        // 6. Place powerups hidden in ~20% of bricks
        this._placePowerups(grid);
    }

    static _ensureReachability(grid, safeZones) {
        // Ensure all safe zone corners are reachable from player spawn (1,1)
        const targets = [
            [COLS - 2, 1],
            [1, ROWS - 2],
            [COLS - 2, ROWS - 2],
        ];

        for (const [tc, tr] of targets) {
            const reachable = floodFill(grid, 1, 1);
            if (reachable.has(`${tc},${tr}`)) continue;

            // Carve a path from (1,1) to (tc,tr)
            this._carvePath(grid, 1, 1, tc, tr);
        }
    }

    static _carvePath(grid, sc, sr, tc, tr) {
        let c = sc, r = sr;
        while (c !== tc || r !== tr) {
            if (c < tc) c++;
            else if (c > tc) c--;
            else if (r < tr) r++;
            else if (r > tr) r--;

            if (grid.getCell(c, r) === CELL_BRICK) {
                grid.setCell(c, r, CELL_EMPTY);
            } else if (grid.getCell(c, r) === CELL_WALL && !(c % 2 === 0 && r % 2 === 0)) {
                // Don't destroy fixed pillars, go around
                if (c !== tc) {
                    // Try moving vertically first
                    const detourR = r + (r < tr ? 1 : -1);
                    if (grid.getCell(c, detourR) === CELL_BRICK) {
                        grid.setCell(c, detourR, CELL_EMPTY);
                    }
                }
            }
        }
    }

    static _placePowerups(grid) {
        const brickCells = [];
        for (let c = 1; c < COLS - 1; c++) {
            for (let r = 1; r < ROWS - 1; r++) {
                if (grid.getCell(c, r) === CELL_BRICK) {
                    brickCells.push([c, r]);
                }
            }
        }

        shuffle(brickCells);
        const count = Math.max(3, Math.floor(brickCells.length * 0.2));
        for (let i = 0; i < count && i < brickCells.length; i++) {
            const [c, r] = brickCells[i];
            const type = POWERUP_TYPES[Math.floor(Math.random() * POWERUP_TYPES.length)];
            grid.setPowerup(c, r, type);
        }
    }
}
