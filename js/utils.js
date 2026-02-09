import { COLS, ROWS, TILE_SIZE, HUD_HEIGHT, CELL_EMPTY } from './constants.js';

/** Convert grid col to pixel x (center of tile) */
export function gridToPixelX(col) {
    return col * TILE_SIZE + TILE_SIZE / 2;
}

/** Convert grid row to pixel y (center of tile, accounting for HUD) */
export function gridToPixelY(row) {
    return row * TILE_SIZE + TILE_SIZE / 2 + HUD_HEIGHT;
}

/** Convert pixel x to grid col */
export function pixelToGridCol(px) {
    return Math.floor(px / TILE_SIZE);
}

/** Convert pixel y to grid row (accounting for HUD) */
export function pixelToGridRow(py) {
    return Math.floor((py - HUD_HEIGHT) / TILE_SIZE);
}

/** Snap a pixel coordinate to the center of the nearest tile */
export function snapToGrid(px, py) {
    const col = pixelToGridCol(px);
    const row = pixelToGridRow(py);
    return { x: gridToPixelX(col), y: gridToPixelY(row) };
}

/** Shuffle array in place (Fisher-Yates) */
export function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

/** Flood-fill from (startCol, startRow), returns set of reachable "col,row" strings */
export function floodFill(grid, startCol, startRow) {
    const visited = new Set();
    const queue = [[startCol, startRow]];
    visited.add(`${startCol},${startRow}`);
    while (queue.length > 0) {
        const [c, r] = queue.shift();
        for (const [dc, dr] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) {
            const nc = c + dc;
            const nr = r + dr;
            const key = `${nc},${nr}`;
            if (nc >= 0 && nc < COLS && nr >= 0 && nr < ROWS && !visited.has(key)) {
                if (grid.getCell(nc, nr) === CELL_EMPTY) {
                    visited.add(key);
                    queue.push([nc, nr]);
                }
            }
        }
    }
    return visited;
}

/** BFS shortest path from (sx,sy) to (tx,ty) on the grid.
 *  Returns array of {col, row} steps (excluding start), or null if unreachable.
 *  passable(col, row) should return true if the cell can be traversed. */
export function bfsPath(sx, sy, tx, ty, passable) {
    if (sx === tx && sy === ty) return [];
    const visited = new Set();
    const queue = [[sx, sy, []]];
    visited.add(`${sx},${sy}`);
    while (queue.length > 0) {
        const [c, r, path] = queue.shift();
        for (const [dc, dr] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) {
            const nc = c + dc;
            const nr = r + dr;
            const key = `${nc},${nr}`;
            if (nc < 0 || nc >= COLS || nr < 0 || nr >= ROWS) continue;
            if (visited.has(key)) continue;
            if (!passable(nc, nr)) continue;
            const newPath = [...path, { col: nc, row: nr }];
            if (nc === tx && nr === ty) return newPath;
            visited.add(key);
            queue.push([nc, nr, newPath]);
        }
    }
    return null;
}

/** Clamp a value between min and max */
export function clamp(val, min, max) {
    return Math.max(min, Math.min(max, val));
}

/** Linear interpolation */
export function lerp(a, b, t) {
    return a + (b - a) * t;
}

/** Distance between two points */
export function dist(x1, y1, x2, y2) {
    return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}
