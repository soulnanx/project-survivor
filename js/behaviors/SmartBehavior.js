import Behavior from './Behavior.js';
import { TILE_SIZE, CELL_EMPTY, CHASE_PROXIMITY_ENTER, CHASE_PROXIMITY_LEAVE } from '../constants.js';
import { pixelToGridCol, pixelToGridRow, gridToPixelX, gridToPixelY, bfsPath, manhattanGrid } from '../utils.js';

const DIRECTIONS = [
    { dx: 0, dy: -1, name: 'up' },
    { dx: 0, dy: 1, name: 'down' },
    { dx: -1, dy: 0, name: 'left' },
    { dx: 1, dy: 0, name: 'right' },
];

export default class SmartBehavior extends Behavior {
    constructor() {
        super();
        this.currentDir = DIRECTIONS[Math.floor(Math.random() * 4)];
        this.path = null;
        this.pathIndex = 0;
        this.recalcTimer = 0;
        this.recalcInterval = 0.8;
    }

    update(entity, dt, context) {
        const { grid, entityManager, player, attractionSystem } = context;
        entity.moving = true;

        const col = pixelToGridCol(entity.x);
        const row = pixelToGridRow(entity.y);

        // CHECK RAGE FIRST (priority over everything)
        if (entity.isRaging && entity.ragePhase === 'moving' && entity.rageTarget) {
            this.recalcTimer += dt;
            if (this.recalcTimer >= this.recalcInterval || !this.path || this.pathIndex >= this.path.length) {
                this._recalcPathToTarget(entity, grid, entityManager, col, row, entity.rageTarget.col, entity.rageTarget.row);
                this.recalcTimer = 0;
            }
            // Continue to path following code below
        } else if (entity.isRaging && entity.ragePhase === 'paused') {
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
        } else {
            // Proximidade ao jogador (Fase 25) — só pathfind ao jogador quando no alcance
            if (player && player.alive) {
                const playerCol = pixelToGridCol(player.x);
                const playerRow = pixelToGridRow(player.y);
                const distanceToPlayer = manhattanGrid(col, row, playerCol, playerRow);
                if (distanceToPlayer <= CHASE_PROXIMITY_ENTER) {
                    entity.isChasingByProximity = true;
                } else if (distanceToPlayer > CHASE_PROXIMITY_LEAVE) {
                    entity.isChasingByProximity = false;
                    this.path = null; // Para de seguir path antigo
                }
            } else {
                entity.isChasingByProximity = false;
                this.path = null;
            }

            // CHECK ATTRACTION SECOND
            const attraction = attractionSystem?.getAttractionTarget(col, row);

            this.recalcTimer += dt;

            if (this.recalcTimer >= this.recalcInterval || !this.path || this.pathIndex >= this.path.length) {
                if (attraction) {
                    // Pathfind to attraction instead of player
                    this._recalcPathToTarget(entity, grid, entityManager, col, row, attraction.col, attraction.row);
                } else if (entity.isChasingByProximity) {
                    // Pathfind to player só quando no alcance
                    this._recalcPath(entity, grid, entityManager, player, col, row);
                } else {
                    this.path = null;
                }
                this.recalcTimer = 0;
            }
        }

        // Follow path
        if (this.path && this.pathIndex < this.path.length) {
            const target = this.path[this.pathIndex];
            const targetX = gridToPixelX(target.col);
            const targetY = gridToPixelY(target.row);

            const diffX = targetX - entity.x;
            const diffY = targetY - entity.y;

            if (Math.abs(diffX) < 2 && Math.abs(diffY) < 2) {
                entity.x = targetX;
                entity.y = targetY;
                this.pathIndex++;
            } else {
                const speed = entity.speed * dt;
                if (Math.abs(diffX) > Math.abs(diffY)) {
                    entity.x += Math.sign(diffX) * Math.min(Math.abs(diffX), speed);
                    entity.direction = diffX > 0 ? 'right' : 'left';
                    // Align Y
                    if (Math.abs(diffY) > 1) {
                        entity.y += Math.sign(diffY) * Math.min(Math.abs(diffY), speed);
                    }
                } else {
                    entity.y += Math.sign(diffY) * Math.min(Math.abs(diffY), speed);
                    entity.direction = diffY > 0 ? 'down' : 'up';
                    // Align X
                    if (Math.abs(diffX) > 1) {
                        entity.x += Math.sign(diffX) * Math.min(Math.abs(diffX), speed);
                    }
                }
            }
        } else {
            // No path: wander
            this._wander(entity, dt, grid, entityManager, col, row);
        }
    }

    _recalcPath(entity, grid, entityManager, player, col, row) {
        if (!player || !player.alive) {
            this.path = null;
            return;
        }

        const playerCol = pixelToGridCol(player.x);
        const playerRow = pixelToGridRow(player.y);

        // BFS pathfinding avoiding walls, bricks, and bombs
        const passable = (c, r) => {
            if (grid.isSolid(c, r)) return false;
            // Avoid bombs
            const bombs = entityManager.getByType('bomb');
            for (const bomb of bombs) {
                if (pixelToGridCol(bomb.x) === c && pixelToGridRow(bomb.y) === r) return false;
            }
            return true;
        };

        this.path = bfsPath(col, row, playerCol, playerRow, passable);
        this.pathIndex = 0;
    }

    _recalcPathToTarget(entity, grid, entityManager, col, row, targetCol, targetRow) {
        const passable = (c, r) => {
            if (grid.isSolid(c, r)) return false;
            // Avoid bombs
            const bombs = entityManager.getByType('bomb');
            for (const bomb of bombs) {
                if (pixelToGridCol(bomb.x) === c && pixelToGridRow(bomb.y) === r) {
                    return false;
                }
            }
            return true;
        };

        this.path = bfsPath(col, row, targetCol, targetRow, passable);
        this.pathIndex = 0;

        // If no path found, clear it
        if (!this.path || this.path.length === 0) {
            this.path = null;
        }
    }

    _wander(entity, dt, grid, entityManager, col, row) {
        const nextCol = col + this.currentDir.dx;
        const nextRow = row + this.currentDir.dy;
        if (grid.isSolid(nextCol, nextRow)) {
            const open = DIRECTIONS.filter(d => {
                const nc = col + d.dx;
                const nr = row + d.dy;
                return !grid.isSolid(nc, nr);
            });
            if (open.length > 0) {
                this.currentDir = open[Math.floor(Math.random() * open.length)];
            }
        }

        entity.direction = this.currentDir.name;
        const speed = entity.speed * dt;
        const centerX = gridToPixelX(col);
        const centerY = gridToPixelY(row);

        if (this.currentDir.dx !== 0) {
            entity.x += this.currentDir.dx * speed;
            const diffY = centerY - entity.y;
            if (Math.abs(diffY) > 1) entity.y += Math.sign(diffY) * Math.min(Math.abs(diffY), speed);
        } else {
            entity.y += this.currentDir.dy * speed;
            const diffX = centerX - entity.x;
            if (Math.abs(diffX) > 1) entity.x += Math.sign(diffX) * Math.min(Math.abs(diffX), speed);
        }
    }
}
