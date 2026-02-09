import Behavior from './Behavior.js';
import { TILE_SIZE, HUD_HEIGHT } from '../constants.js';
import { pixelToGridCol, pixelToGridRow, gridToPixelX, gridToPixelY } from '../utils.js';

const DIRECTIONS = [
    { dx: 0, dy: -1, name: 'up' },
    { dx: 0, dy: 1, name: 'down' },
    { dx: -1, dy: 0, name: 'left' },
    { dx: 1, dy: 0, name: 'right' },
];

export default class WandererBehavior extends Behavior {
    constructor() {
        super();
        this.currentDir = DIRECTIONS[Math.floor(Math.random() * 4)];
        this.changeTimer = 0;
        this.changeInterval = 1.0 + Math.random() * 2.0;
    }

    update(entity, dt, context) {
        const { grid, entityManager } = context;
        entity.moving = true;

        this.changeTimer += dt;
        const col = pixelToGridCol(entity.x);
        const row = pixelToGridRow(entity.y);

        // Check if current direction is blocked
        const nextCol = col + this.currentDir.dx;
        const nextRow = row + this.currentDir.dy;
        const blocked = grid.isSolid(nextCol, nextRow) || this._hasBomb(entityManager, nextCol, nextRow);

        // Change direction if blocked or timer expired
        if (blocked || this.changeTimer >= this.changeInterval) {
            this._pickNewDirection(entity, grid, entityManager, col, row);
            this.changeTimer = 0;
            this.changeInterval = 1.0 + Math.random() * 2.0;
        }

        entity.direction = this.currentDir.name;

        // Move toward center of target cell
        const targetX = gridToPixelX(col + this.currentDir.dx);
        const targetY = gridToPixelY(row + this.currentDir.dy);
        const centerX = gridToPixelX(col);
        const centerY = gridToPixelY(row);

        // Align to grid center on the perpendicular axis
        const speed = entity.speed * dt;
        let nx = entity.x;
        let ny = entity.y;

        if (this.currentDir.dx !== 0) {
            nx += this.currentDir.dx * speed;
            // Align Y to center
            const diffY = centerY - entity.y;
            if (Math.abs(diffY) > 1) {
                ny += Math.sign(diffY) * Math.min(Math.abs(diffY), speed);
            }
            // Check collision
            const edgeX = nx + this.currentDir.dx * (TILE_SIZE / 2 - 3);
            const checkCol = pixelToGridCol(edgeX);
            if (grid.isSolid(checkCol, row) || this._hasBomb(entityManager, checkCol, row)) {
                nx = entity.x;
            }
        } else {
            ny += this.currentDir.dy * speed;
            const diffX = centerX - entity.x;
            if (Math.abs(diffX) > 1) {
                nx += Math.sign(diffX) * Math.min(Math.abs(diffX), speed);
            }
            const edgeY = ny + this.currentDir.dy * (TILE_SIZE / 2 - 3);
            const checkRow = pixelToGridRow(edgeY);
            if (grid.isSolid(col, checkRow) || this._hasBomb(entityManager, col, checkRow)) {
                ny = entity.y;
            }
        }

        entity.x = nx;
        entity.y = ny;
    }

    _pickNewDirection(entity, grid, entityManager, col, row) {
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
}
