import Behavior from './Behavior.js';
import { TILE_SIZE, HUD_HEIGHT } from '../constants.js';
import { pixelToGridCol, pixelToGridRow, gridToPixelX, gridToPixelY, dist } from '../utils.js';

const DIRECTIONS = [
    { dx: 0, dy: -1, name: 'up' },
    { dx: 0, dy: 1, name: 'down' },
    { dx: -1, dy: 0, name: 'left' },
    { dx: 1, dy: 0, name: 'right' },
];

export default class ChaserBehavior extends Behavior {
    constructor() {
        super();
        this.currentDir = DIRECTIONS[Math.floor(Math.random() * 4)];
        this.decisionTimer = 0;
        this.decisionInterval = 0.5;
    }

    update(entity, dt, context) {
        const { grid, entityManager, player, attractionSystem } = context;
        entity.moving = true;

        const col = pixelToGridCol(entity.x);
        const row = pixelToGridRow(entity.y);

        // CHECK ATTRACTION FIRST
        const attraction = attractionSystem?.getAttractionTarget(col, row);

        this.decisionTimer += dt;

        // Make a decision at intervals or when blocked
        const nextCol = col + this.currentDir.dx;
        const nextRow = row + this.currentDir.dy;
        const blocked = grid.isSolid(nextCol, nextRow) || this._hasBomb(entityManager, nextCol, nextRow);

        if (blocked || this.decisionTimer >= this.decisionInterval) {
            if (attraction) {
                // Move toward attraction (priority over player)
                this._chooseDirectionToTarget(grid, entityManager, col, row, attraction.col, attraction.row);
            } else {
                // Original behavior: chase player
                this._chooseDirection(entity, grid, entityManager, player, col, row);
            }
            this.decisionTimer = 0;
        }

        entity.direction = this.currentDir.name;

        // Move
        const speed = entity.speed * dt;
        let nx = entity.x;
        let ny = entity.y;
        const centerX = gridToPixelX(col);
        const centerY = gridToPixelY(row);

        if (this.currentDir.dx !== 0) {
            nx += this.currentDir.dx * speed;
            const diffY = centerY - entity.y;
            if (Math.abs(diffY) > 1) ny += Math.sign(diffY) * Math.min(Math.abs(diffY), speed);

            const edgeX = nx + this.currentDir.dx * (TILE_SIZE / 2 - 3);
            const checkCol = pixelToGridCol(edgeX);
            if (grid.isSolid(checkCol, row) || this._hasBomb(entityManager, checkCol, row)) {
                nx = entity.x;
            }
        } else {
            ny += this.currentDir.dy * speed;
            const diffX = centerX - entity.x;
            if (Math.abs(diffX) > 1) nx += Math.sign(diffX) * Math.min(Math.abs(diffX), speed);

            const edgeY = ny + this.currentDir.dy * (TILE_SIZE / 2 - 3);
            const checkRow = pixelToGridRow(edgeY);
            if (grid.isSolid(col, checkRow) || this._hasBomb(entityManager, col, checkRow)) {
                ny = entity.y;
            }
        }

        entity.x = nx;
        entity.y = ny;
    }

    _chooseDirection(entity, grid, entityManager, player, col, row) {
        if (!player || !player.alive) {
            // Random if no player
            this._pickRandom(grid, entityManager, col, row);
            return;
        }

        const playerCol = pixelToGridCol(player.x);
        const playerRow = pixelToGridRow(player.y);

        // Get open directions
        const open = DIRECTIONS.filter(d => {
            const nc = col + d.dx;
            const nr = row + d.dy;
            return !grid.isSolid(nc, nr) && !this._hasBomb(entityManager, nc, nr);
        });

        if (open.length === 0) return;

        // 70% chance to move toward player, 30% random
        if (Math.random() < 0.7) {
            // Sort by which direction gets closer to player
            open.sort((a, b) => {
                const distA = dist(col + a.dx, row + a.dy, playerCol, playerRow);
                const distB = dist(col + b.dx, row + b.dy, playerCol, playerRow);
                return distA - distB;
            });
            this.currentDir = open[0];
        } else {
            this.currentDir = open[Math.floor(Math.random() * open.length)];
        }
    }

    _pickRandom(grid, entityManager, col, row) {
        const open = DIRECTIONS.filter(d => {
            const nc = col + d.dx;
            const nr = row + d.dy;
            return !grid.isSolid(nc, nr) && !this._hasBomb(entityManager, nc, nr);
        });
        if (open.length > 0) {
            this.currentDir = open[Math.floor(Math.random() * open.length)];
        }
    }

    _hasBomb(entityManager, col, row) {
        return entityManager.getByType('bomb').some(b => {
            return pixelToGridCol(b.x) === col && pixelToGridRow(b.y) === row;
        });
    }

    _chooseDirectionToTarget(grid, entityManager, col, row, targetCol, targetRow) {
        const open = DIRECTIONS.filter(d => {
            const nc = col + d.dx;
            const nr = row + d.dy;
            return !grid.isSolid(nc, nr) && !this._hasBomb(entityManager, nc, nr);
        });

        if (open.length > 0) {
            // Sort by distance to target
            open.sort((a, b) => {
                const distA = dist(col + a.dx, row + a.dy, targetCol, targetRow);
                const distB = dist(col + b.dx, row + b.dy, targetCol, targetRow);
                return distA - distB;
            });
            this.currentDir = open[0];
        } else {
            // All blocked, pick random
            this._pickRandom(grid, entityManager, col, row);
        }
    }
}
