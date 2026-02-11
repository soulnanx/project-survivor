import { CELL_BRICK, CELL_WALL, CELL_EMPTY, TILE_SIZE, SCORE_BRICK, CELL_WOOD, CELL_IRON_BARS, CELL_HARD_BRICK } from '../constants.js';
import { pixelToGridCol, pixelToGridRow, gridToPixelX, gridToPixelY } from '../utils.js';
import Explosion from '../entities/Explosion.js';
import PowerUp from '../entities/PowerUp.js';
import EventBus from '../core/EventBus.js';

export default class BombSystem {
    update(dt, context) {
        // Bombs handle their own timers in their update()
        // This system handles chain reactions triggered by explosions touching bombs
        const { entityManager } = context;
        const explosions = entityManager.getLayer('explosions');
        const bombs = entityManager.getLayer('bombs');

        for (const bomb of bombs) {
            if (!bomb.alive) continue;
            const bc = pixelToGridCol(bomb.x);
            const br = pixelToGridRow(bomb.y);

            for (const explosion of explosions) {
                if (!explosion.alive) continue;
                for (const cell of explosion.cells) {
                    if (cell.col === bc && cell.row === br) {
                        bomb.detonate(context);
                        break;
                    }
                }
                if (!bomb.alive) break;
            }
        }
    }

    detonate(bomb, context) {
        const { grid, entityManager, soundEngine } = context;
        const col = pixelToGridCol(bomb.x);
        const row = pixelToGridRow(bomb.y);

        const cells = [{ col, row }]; // Center

        // Propagate in 4 directions
        const dirs = [[0, -1], [0, 1], [-1, 0], [1, 0]];
        for (const [dx, dy] of dirs) {
            for (let i = 1; i <= bomb.range; i++) {
                const nc = col + dx * i;
                const nr = row + dy * i;

                if (grid.getCell(nc, nr) === CELL_WALL) break;

                if (grid.getCell(nc, nr) === CELL_BRICK) {
                    // Destroy brick
                    grid.setCell(nc, nr, CELL_EMPTY);
                    cells.push({ col: nc, row: nr });
                    EventBus.emit('brick:destroyed', { col: nc, row: nr });

                    // REMOVIDO NA FASE 11: Power-ups serão substituídos por drops na Fase 13
                    // Check for hidden powerup
                    // const puType = grid.getPowerup(nc, nr);
                    // if (puType) {
                    //     grid.removePowerup(nc, nr);
                    //     const pu = new PowerUp(
                    //         gridToPixelX(nc),
                    //         gridToPixelY(nr),
                    //         puType
                    //     );
                    //     entityManager.add(pu, 'powerups');
                    // }
                    break; // Stop propagation after brick
                } else if (grid.getCell(nc, nr) === CELL_WOOD || grid.getCell(nc, nr) === CELL_IRON_BARS || grid.getCell(nc, nr) === CELL_HARD_BRICK) {
                    // Special blocks block explosions but are not destroyed
                    break;
                }

                cells.push({ col: nc, row: nr });
            }
        }

        const explosion = new Explosion(bomb.x, bomb.y, cells);
        entityManager.add(explosion, 'explosions');

        EventBus.emit('bomb:detonated', { bomb, cells });
        if (soundEngine) soundEngine.play('explosion');
    }
}
