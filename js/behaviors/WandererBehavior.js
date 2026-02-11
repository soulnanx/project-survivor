import Behavior from './Behavior.js';
import { TILE_SIZE, HUD_HEIGHT, CHASE_PROXIMITY_ENTER, CHASE_PROXIMITY_LEAVE } from '../constants.js';
import { pixelToGridCol, pixelToGridRow, gridToPixelX, gridToPixelY, dist, manhattanGrid } from '../utils.js';

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
        const { grid, entityManager, attractionSystem, player } = context;
        entity.moving = true;

        const col = pixelToGridCol(entity.x);
        const row = pixelToGridRow(entity.y);

        // CHECK RAGE FIRST (priority over everything)
        if (entity.isRaging && entity.ragePhase === 'moving' && entity.rageTarget) {
            this._moveTowardTarget(entity, dt, grid, entityManager, entity.rageTarget.col, entity.rageTarget.row);
            return;
        }

        // If in rage pause phase, don't move
        if (entity.isRaging && entity.ragePhase === 'paused') {
            entity.moving = false;
            // Face the target
            if (entity.rageTarget) {
                const dx = entity.rageTarget.col - col;
                const dy = entity.rageTarget.row - row;
                if (Math.abs(dx) > Math.abs(dy)) {
                    entity.direction = dx > 0 ? 'right' : 'left';
                } else {
                    entity.direction = dy > 0 ? 'down' : 'up';
                }
            }
            return;
        }

        // CHECK ATTRACTION SECOND
        const attraction = attractionSystem?.getAttractionTarget(col, row);
        if (attraction) {
            // Move toward the attraction
            this._moveTowardTarget(entity, dt, grid, entityManager, attraction.col, attraction.row);
            return;
        }

        // CHECK PROXIMITY TO PLAYER (Fase 25) — perseguir jogador quando perto
        if (player && player.alive) {
            const playerCol = pixelToGridCol(player.x);
            const playerRow = pixelToGridRow(player.y);
            const distanceToPlayer = manhattanGrid(col, row, playerCol, playerRow);

            if (distanceToPlayer <= CHASE_PROXIMITY_ENTER) {
                entity.isChasingByProximity = true;
                this._moveTowardTarget(entity, dt, grid, entityManager, playerCol, playerRow);
                return;
            }
            if (distanceToPlayer > CHASE_PROXIMITY_LEAVE) {
                entity.isChasingByProximity = false;
            } else if (entity.isChasingByProximity) {
                // Entre 3 e 4: manter perseguição
                this._moveTowardTarget(entity, dt, grid, entityManager, playerCol, playerRow);
                return;
            }
        } else {
            entity.isChasingByProximity = false;
        }

        // NORMAL WANDERING LOGIC
        this.changeTimer += dt;

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

    _moveTowardTarget(entity, dt, grid, entityManager, targetCol, targetRow) {
        const col = pixelToGridCol(entity.x);
        const row = pixelToGridRow(entity.y);

        // Get open directions
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
        }

        // Execute movement (same as normal logic)
        entity.direction = this.currentDir.name;

        const targetX = gridToPixelX(col + this.currentDir.dx);
        const targetY = gridToPixelY(row + this.currentDir.dy);
        const centerX = gridToPixelX(col);
        const centerY = gridToPixelY(row);

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
}
